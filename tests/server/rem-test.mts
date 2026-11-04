import { run } from '../../supabase/functions/reminders/logic.ts';
const M = 'm1';
const rows = [
  { id: 's1', title: '음악중심', date: '2026-11-04', start_time: '13:30:00', location: 'MBC (서울 마포구 성암로 267)', manager_id: M, is_secret: false, status: 'scheduled', status_logs: [],
    timeline_items: [{ time: '10:55', label: '[픽업 출발] 청담동 숙소 픽업 및 출발', done: false }, { time: '11:20', label: '[헤어·메이크업] 샵 도착', done: false }, { time: '12:50', label: '[현장 이동] 현장으로 출발', done: false }],
    artists: { name: '루나스' }, vehicles: { name: '1호차' }, profiles: { company_id: 'co' } },
  { id: 's2', title: '팬사인회', date: '2026-11-05', start_time: '14:00:00', location: '타임스퀘어 (서울 영등포구 영중로 15)', manager_id: M, is_secret: false, status: 'scheduled',
    status_logs: [{ id: 'r1', ack: { need: true, managerId: M } }], timeline_items: [{ time: '11:25', label: '[픽업 출발] 숙소' }], artists: { name: '루나스' }, vehicles: { name: '1호차' }, profiles: { company_id: 'co' } },
];
const logged = new Set<string>(); const sent: any[] = [];
const db: any = { from(t: string) {
  const q: any = { _t: t, select() { return q; }, in() { return q; }, not() { return q; }, eq() { return q; },
    insert(r: any) { if (logged.has(r.key)) return Promise.resolve({ error: { code: '23505' } }); logged.add(r.key); return Promise.resolve({ error: null }); },
    delete() { return { in: () => Promise.resolve({}) }; },
    then(res: any) {
      if (t === 'schedules') return res({ data: rows, error: null });
      if (t === 'push_subscriptions') return res({ data: [{ id: 'p', endpoint: 'e', p256dh: 'k', auth: 'a' }] });
      if (t === 'profiles') return res({ data: [{ id: 'ceo' }] });
      return res({ data: [] });
    } };
  return q; } };
const send = async (_s: any, payload: string) => { sent.push(JSON.parse(payload)); };
const t = (iso: string) => Date.parse(iso);
console.log(await run(db, send, t('2026-11-04T10:42:00+09:00')));   // 픽업 13분 전
console.log(await run(db, send, t('2026-11-04T10:47:00+09:00')));   // 중복 X
console.log(await run(db, send, t('2026-11-04T21:00:00+09:00')));   // 밤 요약
console.log(await run(db, send, t('2026-11-04T21:05:00+09:00')));
for (const s of sent) console.log(s.title, '|', s.body.replace(/\n/g, ' / '), '|', s.url);
