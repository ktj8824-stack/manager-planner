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
out.quote = quote('standard', 3).amount;
try { await handle('prepare', { plan: 'standard', addSlots: 1 }, mgr, db, okToss, 'test', now); } catch (e: any) { out.mgrBlocked = e.code; }
const p = await handle('prepare', { plan: 'standard', addSlots: 2 }, ceo, db, okToss, 'test', now);
out.prepared = p.amount;
try { await handle('confirm', { orderId: p.orderId, paymentKey: 'k', amount: 1000 }, ceo, db, okToss, 'test', now); } catch (e: any) { out.tamper = e.code; }
const p2 = await handle('prepare', { plan: 'standard', addSlots: 2 }, ceo, db, okToss, 'test', now);
try { await handle('confirm', { orderId: p2.orderId, paymentKey: 'k', amount: p2.amount }, mgr, db, okToss, 'test', now); } catch (e: any) { out.otherUser = e.code; }
const c = await handle('confirm', { orderId: p2.orderId, paymentKey: 'k', amount: p2.amount }, ceo, db, okToss, 'test', now);
out.confirmed = c.status; out.slots = company.extra_manager_slots; out.until = company.paid_until;
const again = await handle('confirm', { orderId: p2.orderId, paymentKey: 'k', amount: p2.amount }, ceo, db, okToss, 'test', now);
out.idempotent = again.status;
const st = await handle('status', {}, ceo, db, okToss, 'test', now);
out.total = st.company.totalSlots; out.active = st.company.active;
const p3 = await handle('prepare', { plan: 'pro' }, mgr, db, okToss, 'test', now);
const badToss = async () => ({ ok: false, status: 400, body: { code: 'REJECT_CARD_COMPANY', message: '카드사 거절' } });
try { await handle('confirm', { orderId: p3.orderId, paymentKey: 'k', amount: 4900 }, mgr, db, badToss, 'test', now); } catch (e: any) { out.rejected = e.code; }
console.log(JSON.stringify(out));
