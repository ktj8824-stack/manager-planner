import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// 로디톡 메시지를 보낸 직후 호출되어, 받는 사람들의 기기로 푸시 알림을 보낸다.
// 보낸 사람 본인이 방금 보낸 메시지에 대해서만 동작한다 (토큰으로 확인).
type Json = Record<string, unknown>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_AGE_MS = 5 * 60 * 1000;

function secretKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, unknown>;
      const picked = keys["default"] ?? Object.values(keys)[0];
      if (typeof picked === "string" && picked) return picked;
    } catch { /* 옛 변수로 시도 */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
}

Deno.serve(async (req: Request): Promise<Response> => {
  const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Vary": "Origin" });
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = secretKey();
    const pub = Deno.env.get("VAPID_PUBLIC_KEY");
    const priv = Deno.env.get("VAPID_PRIVATE_KEY");
    const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com";
    const origins = new Set((Deno.env.get("MANAGE_USERS_ALLOWED_ORIGINS") ?? "").split(",").map((s) => s.trim()).filter(Boolean));
    if (!url || !serviceKey || !pub || !priv || !origins.size) return json({ error: { code: "CONFIGURATION_ERROR", message: "Server configuration is incomplete." } }, 500);

    const origin = req.headers.get("origin");
    if (origin !== null && !origins.has(origin)) return json({ error: { code: "ORIGIN_FORBIDDEN" } }, 403);
    if (origin) {
      headers.set("Access-Control-Allow-Origin", origin);
      headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "authorization, apikey, content-type, x-client-info");
    }
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (req.method !== "POST") return json({ error: { code: "METHOD_NOT_ALLOWED" } }, 405);

    const match = /^Bearer\s+(\S+)$/i.exec(req.headers.get("authorization") ?? "");
    if (!match) return json({ error: { code: "UNAUTHORIZED" } }, 401);
    const db = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    const { data: authData, error: authError } = await db.auth.getUser(match[1]);
    if (authError || !authData.user) return json({ error: { code: "UNAUTHORIZED" } }, 401);
    const callerId = authData.user.id;

    let body: Json;
    try { body = await req.json(); } catch { return json({ error: { code: "INVALID_JSON" } }, 400); }
    const messageId = body.message_id;
    if (typeof messageId !== "string" || !UUID.test(messageId)) return json({ error: { code: "INVALID_ID" } }, 400);

    const { data: msg } = await db.from("chat_messages").select("id, room_id, sender_id, sender_name, body, image_path, is_urgent, created_at").eq("id", messageId).maybeSingle();
    if (!msg || msg.sender_id !== callerId || Date.now() - new Date(msg.created_at).getTime() > MAX_AGE_MS) {
      return json({ error: { code: "NOT_ALLOWED" } }, 403);
    }
    const { data: room } = await db.from("chat_rooms").select("id, company_id, kind, manager_id").eq("id", msg.room_id).maybeSingle();
    if (!room) return json({ error: { code: "NOT_FOUND" } }, 404);

    // 받는 사람: 전체방=회사 매니저/스태프 전원, 1:1방=상대방 (본사→그 매니저 / 매니저→회사 본사 계정들). 보낸 본인은 제외.
    let q = db.from("profiles").select("id").eq("company_id", room.company_id).neq("id", callerId);
    if (room.kind === "all") q = q.in("role", ["manager", "staff"]);
    else {
      const { data: me } = await db.from("profiles").select("role").eq("id", callerId).maybeSingle();
      q = ["ceo", "hq_admin"].includes(me?.role ?? "") ? q.eq("id", room.manager_id) : q.in("role", ["ceo", "hq_admin"]);
    }
    const { data: people } = await q;
    const ids = (people ?? []).map((p: { id: string }) => p.id);
    if (!ids.length) return json({ sent: 0, failed: 0 });
    const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", ids);

    webpush.setVapidDetails(subject, pub, priv);
    const text = (msg.body ? String(msg.body) : "(사진)").slice(0, 120);
    const payload = JSON.stringify({
      title: (msg.is_urgent ? "🚨 긴급 · " : "💬 ") + (msg.sender_name || "로디톡"),
      body: text, room_id: msg.room_id, urgent: !!msg.is_urgent, tag: "chat-" + msg.room_id,
    });
    let sent = 0, failed = 0;
    const dead: string[] = [];
    await Promise.all((subs ?? []).map(async (s: { id: string; endpoint: string; p256dh: string; auth: string }) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: msg.is_urgent ? 3600 : 600, urgency: msg.is_urgent ? "high" : "normal",
        });
        sent++;
      } catch (e) {
        failed++;
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id); // 사라진 기기는 정리
      }
    }));
    if (dead.length) await db.from("push_subscriptions").delete().in("id", dead);
    return json({ sent, failed });
  } catch (_e) {
    console.error("send-push internal failure");
    return json({ error: { code: "INTERNAL_ERROR" } }, 500);
  }
});
