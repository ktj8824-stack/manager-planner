const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 37.52, longitude: 127.04 }, permissions: ['geolocation'] });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-10-25T12:55:00+09:00') }); await p.clock.resume();
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); localStorage.setItem('bp_buffer_prep', '0'); localStorage.setItem('rp_loc_consent', 'yes'); });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_DEMO + '/index.html'); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    Login.demoLogin('ceo'); await hqStore.seedDemoData();
    window.SupabaseClient.currentUser = { id: 'mgr_2' };
    const key = hqStore.getUserStorageKey(HQ_STORAGE_KEYS.SCHEDULES);
    const list = JSON.parse(localStorage.getItem(key)); const s = list.find(x => x.id === 'sch_today_1');
    s.timeline.forEach((st, i) => { st.done = i < 2; st.moving = i === 2; });
    localStorage.setItem(key, JSON.stringify(list));
    KakaoAPI.geocode = async () => ({ x: 126.89, y: 37.58 });
    TmapAPI.getRouteTime = async () => 70;     // 지금 12:55 + 40분 = 13:35, 목표 13:50-10=13:40? 
    const sent = []; window.Chat = { available: () => true, sendNotice: async (m) => sent.push(m) };
    await AutoNav._delayCheck();
    const box = document.getElementById('an-box')?.innerText.replace(/\s+/g, ' ');
    const tl = s.timeline.map(x => x.time + ' ' + x.label).slice(1, 4);
    await AutoNav.reportDelay(); return { box, sent, log: hqStore.getSchedules().find(x => x.id === 'sch_today_1').statusLogs[0].label };
  });
  console.log(JSON.stringify(r, null, 1), errs); await b.close();
})();
