// 운영 알림 — 서버 함수가 큰 문제(예: AI 크레딧 부족)를 만나면 대표(운영자)에게 기록 + 푸시
// 호출: POST { kind, source, message }  헤더 x-alert-key (app_settings.ops_alert_key 와 같아야 함)
// 받는 사람: app_settings.ops_alert_user_ids (쉼표로 여러 명). 같은 종류는 6시간에 한 번만 푸시, 기록은 매번.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const KINDS: Record<string, string> = {
  ai_credit: "AI 크레딧이 떨어졌어요",
  ai_key: "AI 키에 문제가 있어요",
  ai_error: "AI 서버 오류가 이어지고 있어요",
};
const PUSH_GAP_MS = 6 * 60 * 60 * 1000;

function secretKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const keys = JSON.parse(raw) as Record<string, unknown>;
      const picked = keys["default"] ?? Object.values(keys)[0];
      if (typeof picked === "string" && picked) return picked;
    } catch { /* 옛 변수 */ }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
}

Deno.serve(async (req: Request) => {
  const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json" } });
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL"), key = secretKey();
    if (!url || !key) return json({ error: "CONFIGURATION_ERROR" }, 500);
    const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    const { data: rows } = await db.from("app_settings").select("key, value").in("key", ["ops_alert_key", "ops_alert_user_ids"]);
    const cfg: Record<string, string> = {};
    for (const r of rows ?? []) cfg[r.key] = r.value;
    const given = req.headers.get("x-alert-key") || "";
    if (!cfg.ops_alert_key || given.length < 20 || given !== cfg.ops_alert_key) return json({ error: "UNAUTHORIZED" }, 401);

    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || "");
    if (!KINDS[kind]) return json({ error: "INVALID_KIND" }, 400);
    const source = String(body.source || "").slice(0, 40);
    const message = String(body.message || "").slice(0, 300);

    const since = new Date(Date.now() - PUSH_GAP_MS).toISOString();
    const { data: recent } = await db.from("ops_alerts").select("id").eq("kind", kind).eq("pushed", true).gte("created_at", since).limit(1);
    const shouldPush = !(recent && recent.length);

    let sent = 0;
    if (shouldPush) {
      const pub = Deno.env.get("VAPID_PUBLIC_KEY"), priv = Deno.env.get("VAPID_PRIVATE_KEY");
      const ids = String(cfg.ops_alert_user_ids || "").split(",").map((s) => s.trim()).filter(Boolean);
      if (pub && priv && ids.length) {
        webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com", pub, priv);
        const { data: subs } = await db.from("push_subscriptions").select("id, endpoint, p256dh, auth").in("user_id", ids);
        const payload = JSON.stringify({
          title: "⚠️ 로드플래너 운영 알림",
          body: `${KINDS[kind]} (${source || "서버"}). ${kind === "ai_credit" ? "console.anthropic.com → Plans & Billing에서 충전해 주세요." : "로그를 확인해 주세요."}`,
          tag: `ops-${kind}`, urgent: true, url: "",
        });
        await Promise.all((subs ?? []).map(async (s: any) => {
          try { await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: "high" }); sent++; }
          catch (e) { const c = (e as { statusCode?: number }).statusCode; if (c === 404 || c === 410) await db.from("push_subscriptions").delete().eq("id", s.id); }
        }));
      }
    }
    await db.from("ops_alerts").insert({ kind, source, message, pushed: shouldPush && sent > 0 });
    return json({ ok: true, pushed: shouldPush, sent });
  } catch (e) {
    console.error("ops-alert failure", (e as Error)?.message);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
});
