import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handle, PayError, DOCS_TEST_SECRET, type Caller } from "./logic.ts";

function secretKey(): string | undefined {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (raw) { try { const k = JSON.parse(raw); const p = k["default"] ?? Object.values(k)[0]; if (typeof p === "string" && p) return p; } catch { /* */ } }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? undefined;
}
const ORIGINS = new Set((Deno.env.get("MANAGE_USERS_ALLOWED_ORIGINS") || "").split(",").map((s) => s.trim()).filter(Boolean));
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/;

function cors(origin: string | null) {
  const ok = origin && (ORIGINS.has(origin) || LOCAL.test(origin));
  return {
    "Access-Control-Allow-Origin": ok ? origin! : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const h = { ...cors(origin), "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response("ok", { headers: h });
  const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers: h });
  try {
    if (req.method !== "POST") throw new PayError(405, "METHOD", "POST only");
    const url = Deno.env.get("SUPABASE_URL")!, key = secretKey();
    if (!url || !key) throw new PayError(500, "CONFIG", "서버 설정이 완료되지 않았습니다.");
    const db = createClient(url, key, { auth: { persistSession: false } });
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u, error: ue } = await db.auth.getUser(token);
    if (ue || !u?.user) throw new PayError(401, "UNAUTHORIZED", "로그인이 필요합니다.");
    const { data: p } = await db.from("profiles").select("id, role, company_id").eq("id", u.user.id).maybeSingle();
    if (!p) throw new PayError(403, "NO_PROFILE", "계정 정보를 찾을 수 없습니다.");
    if (!p.company_id && p.role !== "indie_manager") throw new PayError(403, "NO_COMPANY", "회사 정보가 없는 계정입니다.");
    const caller = p as Caller;

    const text = await req.text();
    if (text.length > 8192) throw new PayError(413, "TOO_LARGE", "요청이 너무 큽니다.");
    const body = text ? JSON.parse(text) : {};
    const secret = Deno.env.get("TOSS_SECRET_KEY") || DOCS_TEST_SECRET;
    const mode = secret.startsWith("live_") ? "live" : "test";

    const must = <T>(r: { data: T; error: unknown }) => { if (r.error) throw new PayError(500, "DB", "저장소 오류가 발생했습니다."); return r.data; };
    const store = {
      getPayment: async (id: string) => must(await db.from("payments").select("*").eq("order_id", id).maybeSingle()),
      insertPayment: async (row: unknown) => must(await db.from("payments").insert(row)),
      updatePayment: async (id: string, patch: unknown) => must(await db.from("payments").update(patch).eq("order_id", id)),
      getCompany: async (id: string) => must(await db.from("companies").select("plan, paid_until, extra_manager_slots").eq("id", id).maybeSingle()),
      updateCompany: async (id: string, patch: unknown) => must(await db.from("companies").update(patch).eq("id", id)),
      countManagers: async (id: string) => {
        const r = await db.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", id).in("role", ["manager", "staff"]);
        return r.count || 0;
      },
      proUntil: async (uid: string) => {
        const r = must(await db.from("payments").select("period_end").eq("user_id", uid).eq("plan", "pro").eq("status", "DONE").order("period_end", { ascending: false }).limit(1)) as { period_end: string }[];
        return r?.[0]?.period_end || null;
      },
      recentPayments: async (cid: string) => must(await db.from("payments").select("order_id, plan, kind, add_slots, amount, status, method, approved_at, period_end, mode, created_at").eq("company_id", cid).neq("status", "READY").order("created_at", { ascending: false }).limit(12)),
    };
    const toss = async (paymentKey: string, orderId: string, amount: number) => {
      const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
        method: "POST",
        headers: { Authorization: "Basic " + btoa(secret + ":"), "Content-Type": "application/json", "Idempotency-Key": orderId },
        body: JSON.stringify({ paymentKey, orderId, amount }),
      });
      let b: any = {}; try { b = await res.json(); } catch { /* */ }
      return { ok: res.ok, status: res.status, body: b };
    };
    return reply(200, await handle(String(body.action || ""), body, caller, store, toss, mode));
  } catch (e) {
    if (e instanceof PayError) return reply(e.status, { error: { code: e.code, message: e.message } });
    console.error("payments error", e instanceof Error ? e.message : e);
    return reply(500, { error: { code: "INTERNAL", message: "결제 서버 오류가 발생했습니다." } });
  }
});
