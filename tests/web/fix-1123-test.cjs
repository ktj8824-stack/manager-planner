// 11/23 점검 R15: 본사가 시작 시각만 고쳐 다시 저장(saveSchedule)해도
//  매니저가 이미 누른 단계(완료·이동 중) 표시는 남아야 함. 날짜가 바뀌면 옮기지 않음
const { chromium, devices } = require('playwright');
const BASE = process.argv[2];
const block = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-11-23T08:40:00+09:00') });
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await block(p);
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
  const R = await p.evaluate(async () => {
    const base = { id: 'sch_t_r15', date: '2026-11-23', artistId: 'ALL', managerId: '', status: '예정', category: 'event', title: '드라마 촬영', startTime: '11:00', endTime: '19:00', location: 'MBC 드림센터', locationAddress: '경기 고양시 일산동구 한류월드로 281', departure: { place: '사옥', address: '서울 강남구' } };
    const l = hqStore.getSchedules().filter(s => s.date !== '2026-11-23'); hqStore.saveSchedules(l);
    hqStore.buildTimelineCapped = async s => hqStore.generateAutoTimeline(s);
    await hqStore.saveSchedule({ ...base });
    // 매니저가 첫 단계 완료
    const s1 = hqStore.getSchedules().find(s => s.id === 'sch_t_r15');
    s1.timeline[0].done = true; s1.timeline[0].doneAt = '08:40';
    hqStore.saveSchedules(hqStore.getSchedules().map(s => s.id === s1.id ? s1 : s));
    // 본사가 10:30 으로 당겨 다시 저장
    await hqStore.saveSchedule({ ...base, startTime: '10:30' });
    const s2 = hqStore.getSchedules().find(s => s.id === 'sch_t_r15');
    const keep = `${s2.timeline[0].label.split(']')[0]}]|${!!s2.timeline[0].done}|${s2.timeline[0].doneAt}|${s2.startTime}`;
    const moved = s2.timeline[0].time !== s1.timeline[0].time;
    // 다른 날로 옮기면 진행 표시는 옮기지 않음
    await hqStore.saveSchedule({ ...base, date: '2026-11-24', startTime: '10:30' });
    const s3 = hqStore.getSchedules().find(s => s.id === 'sch_t_r15');
    return { keep, moved, otherDay: !!s3.timeline[0].done };
  });
  console.log(JSON.stringify(R));
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
