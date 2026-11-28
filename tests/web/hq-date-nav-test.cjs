// 본사 날짜 이동: 오늘이 아닌 날을 보면 "N일 뒤" 표시 + "오늘로" 버튼 · 날짜 옆 캘린더 버튼은 어느 탭에서든 월간으로 (11-28)
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
  const snap = async (n) => { return p.evaluate(() => ({ chip: document.getElementById('date-rel-chip').hidden ? '' : document.getElementById('date-rel-chip').textContent, btn: document.getElementById('btn-nav-today').textContent, view: document.querySelector('.view-tab-btn.active')?.dataset.view })); };
  const R = {};
  R.today = await snap('today');
  await p.click('#btn-nav-next'); await p.waitForTimeout(400); await p.click('#btn-nav-next'); await p.waitForTimeout(400);
  R.plus2 = await snap('plus2');
  await p.click('#btn-nav-today'); await p.waitForTimeout(300);
  await p.click('#btn-view-map'); await p.waitForTimeout(500);
  await p.click('#btn-open-month'); await p.waitForTimeout(600);
  R.month = await snap('month');
  await p.click('#btn-nav-today'); await p.waitForTimeout(400);
  R.back = await snap('back');
  // 월간 아래 아티스트 표: 누르면 그 아티스트만, 다시 누르면 전체 (11-28)
  R.legend = await p.evaluate(async () => {
    const arts = await hqStore.getArtists(); const now = new Date();
    const d = (n) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    await hqStore.saveSchedule({ title: '범례A', date: d(2), startTime: '10:00', endTime: '11:00', artistId: arts[0].id, location: 'KBS', shop: { needed: false } });
    await hqStore.saveSchedule({ title: '범례B', date: d(3), startTime: '10:00', endTime: '11:00', artistId: arts[1].id, location: 'MBC', shop: { needed: false } });
    document.getElementById('btn-view-day').click(); await new Promise(r => setTimeout(r, 200));
    document.getElementById('btn-open-month').click(); await new Promise(r => setTimeout(r, 500));
    const titles = () => [...document.querySelectorAll('.mv2-ev .mv2-tt')].map(e => e.textContent);
    const before = titles();
    document.querySelector(`[data-legend-art="${arts[0].id}"]`).click(); await new Promise(r => setTimeout(r, 500));
    const onlyA = titles(); const on = !!document.querySelector(`[data-legend-art="${arts[0].id}"].on`);
    document.querySelector(`[data-legend-art="${arts[0].id}"]`).click(); await new Promise(r => setTimeout(r, 500));
    const back = titles();
    return { a: before.includes('범례A') && before.includes('범례B'), onlyA: onlyA.includes('범례A') && !onlyA.includes('범례B'), on, back: back.includes('범례B'), oneLine: document.querySelector('#current-date-text.one .cdt-one')?.textContent || '' };
  });
  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
