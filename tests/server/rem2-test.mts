import { run, retimeSchedule } from '../../supabase/functions/reminders/logic.ts';
const M = 'm1';
const mk = () => ([{ id: 'aaaaaaaa-1', title: '음악중심', date: '2026-11-05', start_time: '13:30:00', location: 'MBC 상암 신사옥 (서울 마포구 성암로 267)', manager_id: M, is_secret: false, status: 'scheduled', status_logs: [],
  departure_info: { place: '청담동 숙소', address: '서울 강남구 청담동 118' }, shop_info: { needed: true, name: '정샘물', address: '서울 강남구 압구정로79길 19', durationMin: 90 },
  timeline_items: [
    { time: '10:55', label: '[픽업 출발] 청담동 숙소 픽업 및 출발', desc: '이동 약 15분 + 버퍼 10분 배정', done: false },
    { time: '11:20', label: '[헤어·메이크업] 정샘물 도착 및 스타일링', desc: '소요시간 약 90분', done: false },
    { time: '12:50', label: '[현장 이동] 현장으로 출발', desc: '이동 약 20분 + 버퍼 10분 배정', done: false },
    { time: '13:30', label: '[메인 일정] 음악중심', desc: '장소 / 10분 전(13:20) 현장 도착', done: false },
    { time: '18:00', label: '[현장 철수] 복귀', desc: '', done: false }],
  artists: { name: '루나스' }, vehicles: { name: '1호차' }, profiles: { name: '박진우 팀장', company_id: 'co' } }]);
let rows = mk();
const logged = new Set<string>(); const sent: any[] = []; const updates: any[] = []; const routeCalls: string[] = [];
const db: any = { from(t: string) {
  const q: any = { select() { return q; }, in() { return q; }, not() { return q; }, eq(_k: string, v: any) { if (q._upd) { updates.push({ id: v, ...q._upd }); return Promise.resolve({ error: null }); } return q; },
    update(u: any) { q._upd = u; return q; },
    insert(r: any) { if (logged.has(r.key)) return Promise.resolve({ error: { code: '23505' } }); logged.add(r.key); return Promise.resolve({ error: null }); },
    delete() { return { in: () => Promise.resolve({}) }; },
    then(res: any) {
      if (t === 'schedules') return res({ data: rows, error: null });
      if (t === 'push_subscriptions') return res({ data: [{ id: 'p', endpoint: 'e', p256dh: 'k', auth: 'a' }] });
      if (t === 'profiles') return res({ data: [{ id: 'ceo' }] });
      return res({ data: [] });
    } };
  return q; } };
const send = async (_s: any, p: string) => { sent.push(JSON.parse(p)); };
const route = async (svc: string, p: any) => {
  routeCalls.push(svc + ':' + (p.query || p.at));
  if (svc.startsWith('kakao')) return { documents: [{ x: '127.0', y: '37.5' }] };
  if (svc === 'tmap_route_at') return { features: [{ properties: { totalTime: p.at.endsWith('13:20') ? 2700 : 1500 } }] };   // 현장 45분, 샵까지 25분
  return null;
};
const T = (s: string) => Date.parse(s);
console.log('05:31', await run(db, send, T('2026-11-05T05:31:00+09:00'), route));
console.log('times', rows[0].timeline_items.map((x: any) => x.time).join(' '), '|', updates.length, updates[0]?.status_logs?.[0]?.label);
console.log('05:36 again', await run(db, send, T('2026-11-05T05:36:00+09:00'), route));
console.log('10:12 (pickup 10:20 -> 8min, none)', await run(db, send, T('2026-11-05T10:06:00+09:00'), route));
console.log('10:27 late', await run(db, send, T('2026-11-05T10:27:00+09:00'), route));
for (const s of sent) console.log(' >', s.title, '|', s.body.replace(/\n/g, ' / '));
