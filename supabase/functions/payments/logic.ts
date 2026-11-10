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

export function addMonth(from: Date, n = 1) {
  const d = new Date(from.getTime());
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
}

const DAY = 86400000;
// 이용 중에 자리를 늘릴 때: 늘린 자리만 다음 결제일까지 남은 날짜만큼 일할 계산 (공급가는 10원 단위 버림)
//   예) 30일짜리 달에서 20일 남았을 때 1자리 추가 → 20,000 × 20/30 = 13,330원 + 부가세 1,333원
export function prorate(added: number, paidUntil: string | Date, now: Date) {
  const end = new Date(paidUntil);
  const start = addMonth(end, -1);
  const cycleDays = Math.round((end.getTime() - start.getTime()) / DAY);
  const daysLeft = Math.min(cycleDays, Math.max(1, Math.ceil((end.getTime() - now.getTime()) / DAY)));
  const s = PRICING.standard;
  const supply = Math.floor((s.perSlot * added * daysLeft) / cycleDays / 10) * 10;
  const vat = Math.round(supply * s.vatRate);
  return { supply, vat, amount: supply + vat, daysLeft, cycleDays };
}

// 회사 요금제 견적: 이용 중이고 자리를 늘리면 "자리 추가(일할)", 아니면 "한 달 요금"
async function companyQuote(body: Record<string, unknown>, caller: Caller, db: any, now: Date) {
  const q = quote("standard", body.addSlots);
  const used = await db.countManagers(caller.company_id);
  const need = used - PRICING.standard.baseSlots - q.addSlots;
  if (need > 0) throw new PayError(400, "SLOTS_BELOW_USED", `매니저가 ${used}명 등록돼 있어요. ${need}자리를 더 추가해야 결제할 수 있어요.`);
  const c = await db.getCompany(caller.company_id);
  const curExtra = Number(c?.extra_manager_slots) || 0;
  const active = !!c?.paid_until && new Date(c.paid_until) > now;
  // 다음 자동결제부터 내는 금액 (늘린 자리 포함 한 달 요금)
  const monthly = { supply: q.supply, vat: q.vat, amount: q.amount };
  if (active && q.addSlots > curExtra) {
    const added = q.addSlots - curExtra;
    const p = prorate(added, c.paid_until, now);
    return {
      kind: "prorate", plan: "standard", addSlots: q.addSlots, prevSlots: curExtra, added,
      supply: p.supply, vat: p.vat, amount: p.amount, daysLeft: p.daysLeft, cycleDays: p.cycleDays,
      nextBillAt: c.paid_until, monthly,
      orderName: `로드플래너 자리 추가 (${added}자리, ${p.daysLeft}일분)`,
    };
  }
  const start = active ? new Date(c.paid_until) : now;
  return { kind: "month", plan: "standard", addSlots: q.addSlots, prevSlots: curExtra, added: 0, supply: q.supply, vat: q.vat, amount: q.amount, nextBillAt: addMonth(start).toISOString(), monthly, orderName: q.orderName };
}

// db: { getPayment, insertPayment, updatePayment, getCompany, updateCompany, countManagers, proUntil, recentPayments }
// toss: (paymentKey, orderId, amount) => { ok, status, body }
export async function handle(action: string, body: Record<string, unknown>, caller: Caller, db: any, toss: any, mode: string, now = new Date()) {
  const isHQ = ["ceo", "hq_admin"].includes(caller.role);

  if (action === "quote" || action === "prepare") {
    const plan = body.plan;
    if (plan === "pro" && caller.role !== "indie_manager") throw new PayError(403, "FORBIDDEN", "개인 매니저 요금제는 개인 매니저 계정만 결제할 수 있습니다.");
    if (plan === "standard" && !isHQ) throw new PayError(403, "FORBIDDEN", "회사 요금제는 대표·본사 관리자만 결제할 수 있습니다.");
    const q: any = plan === "standard" ? await companyQuote(body, caller, db, now) : { ...quote(plan, 0), kind: "month", prevSlots: 0 };
    if (action === "quote") return q;
    const orderId = makeOrderId(now);
    await db.insertPayment({ order_id: orderId, company_id: caller.company_id, user_id: caller.id, plan: q.plan, kind: q.kind, prev_slots: q.prevSlots, add_slots: q.addSlots, amount: q.amount, order_name: q.orderName, status: "READY", mode });
    return { orderId, kind: q.kind, amount: q.amount, supply: q.supply, vat: q.vat, daysLeft: q.daysLeft, cycleDays: q.cycleDays, nextBillAt: q.nextBillAt, monthly: q.monthly, orderName: q.orderName, mode };
  }

  if (action === "confirm") {
    const orderId = String(body.orderId || ""), paymentKey = String(body.paymentKey || "");
    if (!orderId || !paymentKey || paymentKey.length > 200) throw new PayError(400, "INVALID_REQUEST", "결제 정보가 올바르지 않습니다.");
    const row = await db.getPayment(orderId);
    if (!row || row.user_id !== caller.id) throw new PayError(404, "ORDER_NOT_FOUND", "주문을 찾을 수 없습니다.");
    if (row.status === "DONE") return { status: "DONE", orderId, plan: row.plan, kind: row.kind || "month", amount: row.amount, method: row.method, approvedAt: row.approved_at, periodEnd: row.period_end, mode: row.mode };
    if (row.status !== "READY") throw new PayError(409, "ORDER_CLOSED", "이미 처리된 주문입니다.");
    if (Number(body.amount) !== row.amount) {
      await db.updatePayment(orderId, { status: "FAILED", fail_reason: "AMOUNT_MISMATCH" });
      throw new PayError(400, "AMOUNT_MISMATCH", "결제 금액이 주문과 다릅니다. 결제가 승인되지 않았습니다.");
    }
    // 자리 추가(일할) 주문은 그 사이 요금제가 바뀌었으면 돈이 나가기 전에 멈춤
    if (row.kind === "prorate") {
      const c = await db.getCompany(row.company_id);
      const stillActive = !!c?.paid_until && new Date(c.paid_until) > now;
      if (!stillActive || (Number(c?.extra_manager_slots) || 0) !== Number(row.prev_slots)) {
        await db.updatePayment(orderId, { status: "FAILED", fail_reason: "STALE_ORDER" });
        throw new PayError(409, "STALE_ORDER", "그 사이 요금제가 바뀌었어요. 구독 관리에서 다시 결제해 주세요. 돈은 빠져나가지 않았어요.");
      }
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
    if (row.plan === "standard" && row.kind === "prorate") {
      // 결제일은 그대로, 자리만 늘림 → 다음 자동결제부터 늘린 자리 포함 한 달 요금
      const c = await db.getCompany(row.company_id);
      periodEnd = new Date(c.paid_until);
      await db.updateCompany(row.company_id, { extra_manager_slots: row.add_slots, plan_updated_at: now.toISOString() });
    } else if (row.plan === "standard") {
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
    return { status: "DONE", orderId, plan: row.plan, kind: row.kind || "month", amount: row.amount, method: r.body.method, approvedAt, periodEnd: periodEnd.toISOString(), card: r.body.card ? { company: r.body.card.issuerCode, approveNo: r.body.card.approveNo } : undefined, mode: row.mode };
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
