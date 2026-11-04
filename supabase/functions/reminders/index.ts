// 로드플래너 예약 알림 — 서버 진입점 (로직은 logic.ts)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { run } from "./logic.ts";

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

const D = (globalThis as any).Deno;
if (D && D.serve) {
  D.serve(async (req: Request) => {
    const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json" } });
    try {
      const url = D.env.get("SUPABASE_URL"), key = secretKey();
      const pub = D.env.get("VAPID_PUBLIC_KEY"), priv = D.env.get("VAPID_PRIVATE_KEY");
      if (!url || !key || !pub || !priv) return json({ error: "CONFIGURATION_ERROR" }, 500);
      const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
      const { data: setting } = await db.from("app_settings").select("value").eq("key", "reminder_cron_key").maybeSingle();
      const given = req.headers.get("x-cron-key") || "";
      if (!setting?.value || given.length < 20 || given !== setting.value) return json({ error: "UNAUTHORIZED" }, 401);
      webpush.setVapidDetails(D.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com", pub, priv);
      const out = await run(db, (s, payload, ttl) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: ttl, urgency: "high" }).then(() => undefined), Date.now());
      return json(out);
    } catch (e) {
      console.error("reminders failure", (e as Error)?.message);
      return json({ error: "INTERNAL_ERROR" }, 500);
    }
  });
}
