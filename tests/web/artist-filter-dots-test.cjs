// 홈 주간 달력 점·내일 미리보기·캘린더 탭: 고른 담당 아티스트 기준 (11-28)
//  루나스를 골랐는데 다른 팀 일정 날에도 점이 찍혀 눌러 보면 비어 있던 문제
const { chromium, devices } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => { }));
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(base + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(800);
  const R = await p.evaluate(async () => {
    const t = new Date(); t.setDate(t.getDate() + 7 - t.getDay());           // 다음 주 일요일
    const ds = (k) => { const x = new Date(t); x.setDate(t.getDate() + k); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
    const arts = hqStore.getArtists(); const A = arts[0].id, B = arts[1].id;
    for (const s of hqStore.getSchedulesSync ? hqStore.getSchedulesSync() : hqStore.getSchedules()) { if (s.date >= ds(0) && s.date <= ds(6)) await hqStore.deleteSchedule?.(s.id); }
    await hqStore.saveSchedule({ title: 'A팀 일정', date: ds(1), startTime: '10:00', endTime: '12:00', artistId: A, location: 'KBS', shop: { needed: false } });
    await hqStore.saveSchedule({ title: 'B팀 일정', date: ds(2), startTime: '10:00', endTime: '12:00', artistId: B, location: 'MBC', shop: { needed: false } });
    await hqStore.saveSchedule({ title: '전체 회의', date: ds(3), startTime: '10:00', endTime: '11:00', artistId: 'ALL', location: '사옥', shop: { needed: false } });
    Home.selectDate(t.getFullYear(), t.getMonth(), t.getDate()); await new Promise(r => setTimeout(r, 300));
    const dots = () => [...document.querySelectorAll('#mini-cal-grid .wk-dot')].map(d => d.classList.contains('on') ? 1 : 0).join('');
    const all = dots();
    Home.artistFilter = A; Home.updateLeftCal(); const onlyA = dots();
    Home.artistFilter = B; Home.updateLeftCal(); const onlyB = dots();
    // 일요일(일정 없음)에서 내일(A팀) 미리보기: B를 고르면 안 보여야
    const peekB = Home.renderTomorrowPeek();
    Home.artistFilter = A; const peekA = Home.renderTomorrowPeek();
    Home.artistFilter = 'ALL';
    return { all, onlyA, onlyB, peekA: /기상|출발|첫 일정/.test(peekA), peekB: peekB === '' };
  });
  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
