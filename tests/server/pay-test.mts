import { handle, quote } from '../../supabase/functions/payments/logic.ts';
const rows: Record<string, any> = {}; const company: any = { plan: 'free', paid_until: null, extra_manager_slots: 0 };
const db = {
  getPayment: async (id: string) => rows[id], insertPayment: async (r: any) => { rows[r.order_id] = { ...r }; },
  updatePayment: async (id: string, p: any) => Object.assign(rows[id], p), getCompany: async () => company,
  updateCompany: async (_: string, p: any) => Object.assign(company, p), countManagers: async () => 3,
  proUntil: async () => null, recentPayments: async () => Object.values(rows),
};
const okToss = async (_k: string, _o: string, amount: number) => ({ ok: true, status: 200, body: { status: 'DONE', totalAmount: amount, method: '카드', approvedAt: '2026-11-05T06:00:00Z' } });
const ceo = { id: 'u1', company_id: 'c1', role: 'ceo' }, mgr = { id: 'u2', company_id: 'c1', role: 'manager' };
const now = new Date('2026-11-05T06:00:00Z');
const out: any = {};
out.quote = quote('standard', 3).amount; { const q = quote('standard', 2); out.vat = [q.supply, q.vat, q.amount].join('/'); }
try { await handle('prepare', { plan: 'standard', addSlots: 0 }, ceo, db, okToss, 'test', now); } catch (e: any) { out.belowUsed = e.code + ' ' + e.message; }
try { await handle('prepare', { plan: 'standard', addSlots: 1 }, mgr, db, okToss, 'test', now); } catch (e: any) { out.mgrBlocked = e.code; }
const p = await handle('prepare', { plan: 'standard', addSlots: 2 }, ceo, db, okToss, 'test', now);
out.prepared = p.amount; out.orderIdFmt = /^RP-20261105-[A-Z2-9]{6}$/.test(p.orderId);
try { await handle('confirm', { orderId: p.orderId, paymentKey: 'k', amount: 1000 }, ceo, db, okToss, 'test', now); } catch (e: any) { out.tamper = e.code; }
const p2 = await handle('prepare', { plan: 'standard', addSlots: 2 }, ceo, db, okToss, 'test', now);
try { await handle('confirm', { orderId: p2.orderId, paymentKey: 'k', amount: p2.amount }, mgr, db, okToss, 'test', now); } catch (e: any) { out.otherUser = e.code; }
const c = await handle('confirm', { orderId: p2.orderId, paymentKey: 'k', amount: p2.amount }, ceo, db, okToss, 'test', now);
out.confirmed = c.status; out.slots = company.extra_manager_slots; out.until = company.paid_until;
const again = await handle('confirm', { orderId: p2.orderId, paymentKey: 'k', amount: p2.amount }, ceo, db, okToss, 'test', now);
out.idempotent = again.status;
// 이용 중 자리 추가 → 다음 결제일까지 일할 (30일 중 10일 남음: 20,000×10/30=6,660 + 부가세 666)
const mid = new Date('2026-11-25T06:00:00Z');
const qq = await handle('quote', { plan: 'standard', addSlots: 3 }, ceo, db, okToss, 'test', mid);
out.prorateQuote = [qq.kind, qq.added, qq.daysLeft, qq.cycleDays, qq.supply, qq.vat, qq.amount, qq.monthly.amount].join('/');
const untilBefore = company.paid_until;
const pr = await handle('prepare', { plan: 'standard', addSlots: 3 }, ceo, db, okToss, 'test', mid);
const prc = await handle('confirm', { orderId: pr.orderId, paymentKey: 'k2', amount: pr.amount }, ceo, db, okToss, 'test', mid);
out.prorateDone = [prc.kind, company.extra_manager_slots, company.paid_until === untilBefore].join('/');
const same = await handle('quote', { plan: 'standard', addSlots: 3 }, ceo, db, okToss, 'test', mid);
out.renewKind = same.kind + '/' + same.amount;
const st2 = await handle('prepare', { plan: 'standard', addSlots: 4 }, ceo, db, okToss, 'test', mid);
company.extra_manager_slots = 5; // 그 사이 다른 결제로 자리가 바뀜
let tossCalled = false; const spyToss = async (...a: any[]) => { tossCalled = true; return okToss(a[0], a[1], a[2]); };
try { await handle('confirm', { orderId: st2.orderId, paymentKey: 'k3', amount: st2.amount }, ceo, db, spyToss, 'test', mid); } catch (e: any) { out.stale = e.code + '/' + tossCalled; }
company.extra_manager_slots = 2;
const st = await handle('status', {}, ceo, db, okToss, 'test', now);
out.total = st.company.totalSlots; out.active = st.company.active;
try { await handle('prepare', { plan: 'pro' }, mgr, db, okToss, 'test', now); } catch (e: any) { out.companyMgrPro = e.code; }
const indie = { id: 'u9', company_id: null, role: 'indie_manager' };
const p3 = await handle('prepare', { plan: 'pro' }, indie, db, okToss, 'test', now);
out.indieAmount = p3.amount; out.indieRowCompany = rows[p3.orderId].company_id;
const ist = await handle('status', {}, indie, db, okToss, 'test', now);
out.indieStatus = ist.company === null && ist.proFee === 20000;
try { await handle('prepare', { plan: 'standard', addSlots: 0 }, indie, db, okToss, 'test', now); } catch (e: any) { out.indieStd = e.code; }
const badToss = async () => ({ ok: false, status: 400, body: { code: 'REJECT_CARD_COMPANY', message: '카드사 거절' } });
try { await handle('confirm', { orderId: p3.orderId, paymentKey: 'k', amount: 20000 }, indie, db, badToss, 'test', now); } catch (e: any) { out.rejected = e.code; }
console.log(JSON.stringify(out));
