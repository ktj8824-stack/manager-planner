// 11/19 점검 R6b: 같은 날 앞 현장에서 이어서 출발하는 일정
//  ① 출발 시각이 앞 일정 끝(16:30)보다 이르면 끝 시각으로 묶고 '몇 분 늦음'을 설명에 남김
//  ② 앞 일정의 [현장 철수 · 복귀] 단계는 빼고, 그 시각 '지금 할 일'은 다음 현장으로 가는 [현장 이동] 단계
const { chromium, devices } = require('playwright');
const BASE = process.argv[2];
const block = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-11-25T16:35:00+09:00') });
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await block(p);
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
  const R = await p.evaluate(() => {
    const out = {};
    const base = { date: '2026-11-25', artistId: 'ALL', managerId: '', status: '예정', category: 'event' };
    const a = { ...base, id: 'sch_t_a', title: 'KBS 녹화', startTime: '10:00', endTime: '16:30', location: 'KBS 신관', locationAddress: '서울 영등포구 여의공원로 13', departure: { place: '숙소', address: '서울 강남구' } };
    const c = { ...base, id: 'sch_t_c', title: 'SBS 라디오', startTime: '17:00', endTime: '19:00', location: 'SBS 탄현', locationAddress: '경기 고양시 일산서구 고양대로 1120', departure: { place: 'KBS 신관', address: '서울 영등포구 여의공원로 13', chained: true, fromScheduleId: 'sch_t_a' } };
    const l = hqStore.getSchedules().filter(s => s.date !== '2026-11-25'); l.push(a); hqStore.saveSchedules(l);
    a.timeline = hqStore.generateAutoTimeline(a);
    c.timeline = hqStore.generateAutoTimeline(c);
    const dep = c.timeline.find(s => /^\[현장 이동\]/.test(s.label));
    out.hold = `${dep.time}|${/앞 일정 끝\(16:30\) 바로 출발 → 현장 도착 약 17:15 \(도착 목표 16:50보다 25분 늦음\)/.test(dep.desc)}|${c.chainLateMin}`;
    // 앞 일정이 일찍 끝나면 그대로 (묶지 않음)
    const a2 = { ...a, endTime: '15:30' }; const l2 = hqStore.getSchedules().filter(s => s.id !== 'sch_t_a'); l2.push(a2); hqStore.saveSchedules(l2);
    const c2 = { ...c }; const tl2 = hqStore.generateAutoTimeline(c2);
    out.free = `${tl2.find(s => /^\[현장 이동\]/.test(s.label)).time}|${c2.chainLateMin === undefined}`;
    // 저장 → 그날 동선: 앞 일정 '철수' 단계 없음, 16:35 지금 할 일 = SBS 로 가는 이동
    const l3 = hqStore.getSchedules().filter(s => s.date !== '2026-11-25'); l3.push(a, c); hqStore.saveSchedules(l3);
    const ev = State.calculateDailyEvents(2026, 10, 25).filter(e => e.isHQ).map(e => `${e.time} ${e.title}`);
    out.events = ev.join(' / ');
    out.noReturn = !ev.some(t => /KBS|철수/.test(t) && /16:30 \[현장 철수\]/.test(t));
    out.returns = ev.filter(t => /현장 철수/.test(t)).length;
    return out;
  });
  await p.evaluate(() => { Home.selectedDate = new Date('2026-11-25T16:35:00+09:00'); Home.render(); }); await p.waitForTimeout(800);
  R.now = (await p.locator('.now-card').first().innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
  R.nowToSbs = /현장 이동/.test(R.now) && /고양대로 1120|SBS/.test(R.now) && !/도산대로|복귀/.test(R.now);
  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
