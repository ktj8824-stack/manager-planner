// '퇴근합시다' 카드: 오늘(근무일)을 볼 때만 · 그날 일정이 있었던 날에만 (11-28)
const { chromium, devices } = require('playwright');
const BASE = process.argv[2];
(async () => {
  const b = await chromium.launch(); const errs = [];
  const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2027-03-10T16:00:00+09:00') });
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
  const R = await p.evaluate(async () => {
    localStorage.removeItem('rp_workend');
    for (const s of (hqStore.getSchedulesSync ? hqStore.getSchedulesSync() : hqStore.getSchedules())) { if (s.date === '2027-03-10' || s.date === '2027-03-12') await hqStore.deleteSchedule?.(s.id); }
    const shown = () => /퇴근합시다/.test(document.getElementById('timeline-area')?.innerHTML || '');
    const go = async (d) => { Home.selectDate(2027, 2, d); await new Promise(r => setTimeout(r, 300)); };
    await go(10); const noWork = shown();
    const a = hqStore.getArtists()[0];
    await hqStore.saveSchedule({ title: '오전 녹화', date: '2027-03-10', startTime: '09:00', endTime: '12:00', artistId: a.id, location: 'KBS', shop: { needed: false } });
    await hqStore.saveSchedule({ title: '모레 녹화', date: '2027-03-12', startTime: '09:00', endTime: '12:00', artistId: a.id, location: 'KBS', shop: { needed: false } });
    await go(10); const work = shown();
    await go(12); const otherDay = shown();
    return { noWork, work, otherDay };
  });
  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
