// 일정 복사: 서버와 맞춘 일정(remoteId 있음)을 복사해도 복사본은 새 서버 번호를 받아야 함 (원본 덮어쓰기 방지)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_DEMO + '/index.html'); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    Login.demoLogin('ceo'); await hqStore.seedDemoData();
    const key = hqStore.getUserStorageKey(HQ_STORAGE_KEYS.SCHEDULES);
    const list = JSON.parse(localStorage.getItem(key)); const s = list.find(x => x.id === 'sch_today_1');
    s.remoteId = '11111111-2222-4333-8444-555555555555'; s.syncStatus = 'synced';
    localStorage.setItem(key, JSON.stringify(list));
    window.confirm = () => true;
    await Home.copySchedule('sch_today_1', 1);
    const all = hqStore.getSchedules();
    const copy = all.find(x => x.id !== 'sch_today_1' && x.title === s.title && x.date > s.date);
    return { copied: !!copy, sameRemote: !!copy && copy.remoteId === s.remoteId };
  });
  console.log(JSON.stringify(r)); await b.close();
})();
