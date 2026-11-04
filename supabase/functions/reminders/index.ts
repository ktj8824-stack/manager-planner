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

// 장소 검색·티맵 예측은 버디플래너 프로젝트의 manager-planner-route 함수가 대신 호출 (키는 그쪽 Secrets에만)
const ROUTE_URL = "https://iaccdqcthhtvvetmbryr.supabase.co/functions/v1/manager-planner-route";
const ROUTE_ANON_FULL = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhY2NkcWN0aGh0dnZldG1icnlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0MzM1MDksImV4cCI6MjEwOTAwOTUwOX0.WUuGsdr-mG0gEqhEFQTS0ew8Kr6uy9l7PZ6pXe5zbRM"; // 버디플래너 공개(anon) 키 — 앱 코드에도 공개된 값
async function routeCall(service: string, params: Record<string, unknown>) {
  try {
    const anon = Deno.env.get("ROUTE_ANON_KEY") || ROUTE_ANON_FULL;
    const res = await fetch(ROUTE_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + anon, apikey: anon }, body: JSON.stringify({ service, ...params }) });
    return res.ok ? await res.json() : null;
  } catch { return null; }
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
      // 점검용 (예약 키가 있어야 함): 장소 검색·티맵 예측이 실제로 되는지 확인
      const body = await req.json().catch(() => ({}));
      if (body && body.probe) {
        const a = await routeCall("kakao_address", { query: "서울 강남구 압구정로79길 19" });
        const b = await routeCall("kakao_address", { query: "서울 마포구 성암로 267" });
        const pa = a?.documents?.[0], pb = b?.documents?.[0];
        if (!pa || !pb) return json({ probe: "geocode_failed", a: !!pa, b: !!pb });
        const at = String(body.at || "");
        const anon = Deno.env.get("ROUTE_ANON_KEY") || ROUTE_ANON_FULL;
        const raw = await fetch(ROUTE_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + anon, apikey: anon }, body: JSON.stringify({ service: "tmap_route_at", sx: pa.x, sy: pa.y, ex: pb.x, ey: pb.y, at, mode: "arrive" }) });
        const rawText = await raw.text();
        let tm: any = null; try { tm = JSON.parse(rawText); } catch { tm = { text: rawText.slice(0, 300) }; }
        if (!raw.ok) return json({ probe: "timemachine_failed", status: raw.status, body: tm });
        const rt = await routeCall("tmap_route", { sx: pa.x, sy: pa.y, ex: pb.x, ey: pb.y });
        const p0 = tm?.features?.[0]?.properties || null;
        return json({ probe: "ok", at, timemachine: p0 ? { totalTime: p0.totalTime, departureTime: p0.departureTime, arrivalTime: p0.arrivalTime, totalDistance: p0.totalDistance } : tm, realtimeSec: rt?.features?.[0]?.properties?.totalTime ?? null });
      }
      webpush.setVapidDetails(D.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com", pub, priv);
      const send = (s: any, payload: string, ttl: number) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: ttl, urgency: "high" }).then(() => undefined);
      const out = await run(db, send, Date.now(), routeCall);
      return json(out);
    } catch (e) {
      console.error("reminders failure", (e as Error)?.message);
      return json({ error: "INTERNAL_ERROR" }, 500);
    }
  });
}
