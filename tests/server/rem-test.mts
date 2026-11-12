import { run } from '../../supabase/functions/reminders/logic.ts';
const M = 'm1';
const rows = [
  { id: 's1', title: '음악중심', date: '2026-11-04', start_time: '13:30:00', location: 'MBC (서울 마포구 성암로 267)', manager_id: M, is_secret: false, status: 'scheduled', status_logs: [],
    timeline_items: [{ time: '10:55', label: '[픽업 출발] 청담동 숙소 픽업 및 출발', done: false }, { time: '11:20', label: '[헤어·메이크업] 샵 도착', done: false }, { time: '12:50', label: '[현장 이동] 현장으로 출발', done: false }],
    artists: { name: '루나스' }, vehicles: { name: '1호차' }, profiles: { company_id: 'co' } },
  { id: 's2', title: '팬사인회', date: '2026-11-05', start_time: '14:00:00', location: '타임스퀘어 (서울 영등포구 영중로 15)', manager_id: M, is_secret: false, status: 'scheduled',
    status_logs: [{ id: 'r1', ack: { need: true, managerId: M } }], timeline_items: [{ time: '11:25', label: '[픽업 출발] 숙소' }], artists: { name: '루나스' }, vehicles: { name: '1호차' }, profiles: { company_id: 'co' } },
  { id: 's3', title: '개인무료일정', date: '2026-11-04', start_time: '13:30:00', location: '홍대', manager_id: 'indie1', is_secret: false, status: 'scheduled', status_logs: [],
    timeline_items: [{ time: '10:55', label: '[픽업 출발] 숙소 출발', done: false }], artists: { name: '솔로' }, vehicles: null, profiles: { company_id: null } },
  { id: 's4', title: '개인유료일정', date: '2026-11-04', start_time: '13:30:00', location: '홍대', manager_id: 'indie2', is_secret: false, status: 'scheduled', status_logs: [],
    timeline_items: [{ time: '10:55', label: '[픽업 출발] 숙소 출발', done: false }], artists: { name: '솔로' }, vehicles: null, profiles: { company_id: null } },
  // 담당 미지정: 매니저 프로필이 없어도 만든 사람(본사)의 회사로 묶여 본사 요약에 '담당 미지정'으로 나와야 함
  { id: 's5', title: '미지정일정', date: '2026-11-05', start_time: '16:00:00', location: '여의도', manager_id: null, is_secret: false, status: 'scheduled', status_logs: [],
    timeline_items: [], artists: { name: '루나스' }, vehicles: null, profiles: null, creator: { company_id: 'co' } },
];
const logged = new Set<string>(); const sent: any[] = []; let prefOff = false;
const db: any = { rpc: async (_n: string, a: any) => ({ data: a.p_user === 'indie2' ? '2099-01-01T00:00:00Z' : null }), from(t: string) {
  const q: any = { _t: t, select() { return q; }, in() { return q; }, not() { return q; }, eq() { return q; },
    insert(r: any) { if (logged.has(r.key)) return Promise.resolve({ error: { code: '23505' } }); logged.add(r.key); return Promise.resolve({ error: null }); },
    delete() { return { in: () => Promise.resolve({}) }; },
    then(res: any) {
      if (t === 'schedules') return res({ data: rows, error: null });
      if (t === 'push_subscriptions') return res({ data: [{ id: 'p', endpoint: 'e', p256dh: 'k', auth: 'a' }] });
      if (t === 'profiles') return res({ data: [{ id: 'ceo' }] });
      if (t === 'notify_prefs') return res({ data: prefOff ? [{ user_id: 'ceo' }] : [] });
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

// 대표가 '밤 요약 알림'을 끄면 본사 요약은 안 감 (매니저 요약은 감)
prefOff = true; const before = sent.length;
await run(db, send, t('2026-11-03T21:00:00+09:00'));
console.log('prefOff hq:', sent.slice(before).filter(x => /manager-planner-web/.test(x.url)).length, 'mgr:', sent.slice(before).filter(x => /manager-planner-app/.test(x.url)).length);

// 출발 약 1시간 전 '다음 일정' 알림 (같은 tag로 15분 전 알림이 바꿔 씀)
const b2 = sent.length;
const pr = await run(db, send, t('2026-11-04T09:52:00+09:00'));
await run(db, send, t('2026-11-04T09:57:00+09:00'));   // 중복 X
const pre = sent.slice(b2).filter(x => x.kind === 'pre');
console.log('pre:', pr.pre, pre.length, pre[0] && pre[0].title, pre[0] && pre[0].tag, /go=next/.test(pre[0] && pre[0].url));
console.log('sameTag:', sent.some(x => x.kind === 'departure' && x.tag === 'next-s1-0'));
