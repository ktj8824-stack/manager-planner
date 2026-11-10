// 로드플래너 결제 로직 (서버) — 금액은 서버가 정하고, 토스 승인 결과를 서버가 확인한 뒤에만 요금제를 바꿉니다.
// 회사 요금은 부가세 별도(공급가) → 실제 청구는 공급가 + 부가세 10%
// 개인 매니저 20,000원은 부가세 포함 가격
export const PRICING = {
  standard: { base: 100000, baseSlots: 2, perSlot: 20000, maxAdd: 50, vatRate: 0.1 },
  pro: { amount: 20000 }, // 개인 매니저 유료 (월, 부가세 포함)
};
export const DOCS_TEST_SECRET = "test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6"; // 토스 문서 공개 테스트 키 (실제 돈 안 나감)

export class PayError extends Error {
  status: number; code: string;
  constructor(status: number, code: string, message: string) { super(message); this.status = status; this.code = code; }
}
export type Caller = { id: string; company_id: string | null; role: string };

export function quote(plan: unknown, addSlots: unknown) {
  if (plan === "pro") {
    const a = PRICING.pro.amount;
    return { plan: "pro", addSlots: 0, supply: a, vat: 0, amount: a, orderName: "로드플래너 개인 매니저 (월 정기)" };
  }
  if (plan !== "standard") throw new PayError(400, "INVALID_PLAN", "알 수 없는 요금제입니다.");
  const n = Number(addSlots ?? 0);
  if (!Number.isInteger(n) || n < 0 || n > PRICING.standard.maxAdd) throw new PayError(400, "INVALID_SLOTS", "추가 인원 수가 올바르지 않습니다.");
  const s = PRICING.standard;
  const supply = s.base + s.perSlot * n;
  const vat = Math.round(supply * s.vatRate);
  return { plan: "standard", addSlots: n, supply, vat, amount: supply + vat, orderName: `로드플래너 회사 요금제 (${s.baseSlots + n}자리, 월 정기)` };
}

// 주문번호: 문의·환불 때 불러 주기 쉽게 "RP-날짜(한국)-영문숫자 6자리" (예: RP-20261110-8F3K2A)
export function makeOrderId(now: Date) {
  const k = new Date(now.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, "");
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0·O·1·I 빼고
  const r = crypto.getRandomValues(new Uint8Array(6));
  return `RP-${k}-${Array.from(r, (b) => abc[b % abc.length]).join("")}`;
}

export function addMonth(from: Date) {
  const d = new Date(from.getTime());
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

// db: { getPayment, insertPayment, updatePayment, getCompany, updateCompany, countManagers, proUntil, recentPayments }
// toss: (paymentKey, orderId, amount) => { ok, status, body }
export async function handle(action: string, body: Record<string, unknown>, caller: Caller, db: any, toss: any, mode: string, now = new Date()) {
  const isHQ = ["ceo", "hq_admin"].includes(caller.role);

  if (action === "prepare") {
    const q = quote(body.plan, body.addSlots);
    if (q.plan === "pro" && caller.role !== "indie_manager") throw new PayError(403, "FORBIDDEN", "개인 매니저 요금제는 개인 매니저 계정만 결제할 수 있습니다.");
    if (q.plan === "standard" && !isHQ) throw new PayError(403, "FORBIDDEN", "회사 요금제는 대표·본사 관리자만 결제할 수 있습니다.");
    if (q.plan === "standard") {
      // 지금 등록된 매니저보다 적은 자리로는 결제할 수 없음
      const used = await db.countManagers(caller.company_id);
      const need = used - PRICING.standard.baseSlots - q.addSlots;
      if (need > 0) throw new PayError(400, "SLOTS_BELOW_USED", `매니저가 ${used}명 등록돼 있어요. ${need}자리를 더 추가해야 결제할 수 있어요.`);
    }
    const orderId = makeOrderId(now);
    await db.insertPayment({ order_id: orderId, company_id: caller.company_id, user_id: caller.id, plan: q.plan, add_slots: q.addSlots, amount: q.amount, order_name: q.orderName, status: "READY", mode });
    return { orderId, amount: q.amount, supply: q.supply, vat: q.vat, orderName: q.orderName, mode };
  }

  if (action === "confirm") {
    const orderId = String(body.orderId || ""), paymentKey = String(body.paymentKey || "");
    if (!orderId || !paymentKey || paymentKey.length > 200) throw new PayError(400, "INVALID_REQUEST", "결제 정보가 올바르지 않습니다.");
    const row = await db.getPayment(orderId);
    if (!row || row.user_id !== caller.id) throw new PayError(404, "ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.");
    if (row.status === "DONE") return { status: "DONE", orderId, plan: row.plan, amount: row.amount, method: row.method, approvedAt: row.approved_at, periodEnd: row.period_end, mode: row.mode };
    if (row.status !== "READY") throw new PayError(409, "ORDER_CLOSED", "이미 처리된 주문입니다.");
    if (Number(body.amount) !== row.amount) {
      await db.updatePayment(orderId, { status: "FAILED", fail_reason: "AMOUNT_MISMATCH" });
      throw new PayError(400, "AMOUNT_MISMATCH", "결제 금액이 주문과 다릅니다. 결제가 승인되지 않았습니다.");
    }
    const r = await toss(paymentKey, orderId, row.amount);
    if (!r.ok || r.body?.status !== "DONE") {
      const waiting = r.ok && r.body?.status === "WAITING_FOR_DEPOSIT";
      await db.updatePayment(orderId, { status: waiting ? "WAITING_FOR_DEPOSIT" : "FAILED", payment_key: paymentKey, fail_reason: waiting ? null : String(r.body?.code || r.status || "TOSS_ERROR").slice(0, 80) });
      if (waiting) return { status: "WAITING_FOR_DEPOSIT", orderId, virtualAccount: r.body.virtualAccount };
      throw new PayError(402, String(r.body?.code || "PAYMENT_FAILED"), String(r.body?.message || "결제 승인에 실패했습니다."));
    }
    if (Number(r.body.totalAmount) !== row.amount) throw new PayError(400, "AMOUNT_MISMATCH", "승인 금액이 주문과 다릅니다.");
    let periodEnd: Date;
    if (row.plan === "standard") {
      const c = await db.getCompany(row.company_id);
      const start = c?.paid_until && new Date(c.paid_until) > now ? new Date(c.paid_until) : now;
      periodEnd = addMonth(start);
      await db.updateCompany(row.company_id, { plan: "standard", extra_manager_slots: row.add_slots, paid_until: periodEnd.toISOString(), plan_updated_at: now.toISOString() });
    } else {
      const cur = await db.proUntil(row.user_id);
      const start = cur && new Date(cur) > now ? new Date(cur) : now;
      periodEnd = addMonth(start);
    }
    const approvedAt = r.body.approvedAt || now.toISOString();
    await db.updatePayment(orderId, { status: "DONE", payment_key: paymentKey, method: String(r.body.method || ""), approved_at: approvedAt, period_end: periodEnd.toISOString() });
    return { status: "DONE", orderId, plan: row.plan, amount: row.amount, method: r.body.method, approvedAt, periodEnd: periodEnd.toISOString(), card: r.body.card ? { company: r.body.card.issuerCode, approveNo: r.body.card.approveNo } : undefined, mode: row.mode };
  }

  if (action === "status") {
    if (!caller.company_id) return { company: null, proUntil: await db.proUntil(caller.id), proFee: PRICING.pro.amount, payments: [], mode };
    const c = await db.getCompany(caller.company_id);
    const used = await db.countManagers(caller.company_id);
    const paidUntil = c?.paid_until || null;
    const active = !!paidUntil && new Date(paidUntil) > now;
    return {
      company: {
        plan: c?.plan || "free", active, paidUntil,
        baseSlots: PRICING.standard.baseSlots, extraSlots: Number(c?.extra_manager_slots) || 0,
        totalSlots: PRICING.standard.baseSlots + (Number(c?.extra_manager_slots) || 0), usedSlots: used,
        baseFee: PRICING.standard.base, perSlotFee: PRICING.standard.perSlot, vatRate: PRICING.standard.vatRate,
      },
      proUntil: await db.proUntil(caller.id),
      payments: isHQ ? await db.recentPayments(caller.company_id) : [],
      mode,
    };
  }
  throw new PayError(400, "INVALID_ACTION", "알 수 없는 요청입니다.");
}
