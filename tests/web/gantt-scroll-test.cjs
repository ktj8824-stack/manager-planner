// 본사 '하루 막대'를 휴대폰에서 볼 때: 오후 일정이 화면 밖(06~10시만 보임)에 있으면 '없는 것'처럼 보이던 문제 (11-28)
//  → 그날 가장 이른 막대가 보이도록 가로 스크롤 · 아티스트 이름 칸은 왼쪽에 고정
const { chromium, devices } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch(); const errs = [];
  const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => { }));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(base + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '공진문'); });
  await p.goto(base + '/admin.html'); await p.waitForTimeout(1500);
  await p.evaluate(async () => { await hqStore.seedDemoData(); }); await p.reload(); await p.waitForTimeout(1500);
  const t = new Date(Date.now() + 864e5); const day = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  await p.evaluate(async (d) => {
    const a = (await hqStore.getArtists())[0];
    await hqStore.saveSchedule({ title: '오후 생방송', date: d, startTime: '18:00', endTime: '19:30', status: '예정', artistId: a.id, location: 'CJ ENM 센터', shop: { needed: false },
      timeline: [{ time: '16:40', label: '[현장 이동] 숙소 출발' }, { time: '18:00', label: '[메인 일정] 오후 생방송' }] });
  }, day);
  // 그 날짜로 이동해서 하루 막대
  await p.click('#btn-nav-today'); await p.waitForTimeout(400);
  await p.click('#btn-nav-next'); const r = true;
  await p.waitForTimeout(800);
  const R = await p.evaluate(() => {
    const box = document.querySelector('.gv2'); const bar = box && box.querySelector('.gv2-bar');
    if (!box || !bar) return { box: !!box, bar: !!bar };
    const br = bar.getBoundingClientRect(), xr = box.getBoundingClientRect();
    const who = box.querySelector('.gv2-who'); 
    return { scrolled: box.scrollLeft > 0, barVisible: br.left < xr.right && br.right > xr.left + 150, sticky: getComputedStyle(who).position };
  });
  console.log(JSON.stringify({ nav: r, ...R }), 'errs', JSON.stringify(errs));
  await b.close();
})();
