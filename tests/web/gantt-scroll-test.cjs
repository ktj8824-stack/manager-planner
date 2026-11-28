// 본사 '하루 막대' 좁은 화면 (11-28)
//  - 휴대폰: 막대 대신 아티스트별 세로 카드 (기상·픽업·샵·이동 단계가 시간과 함께 다 보임, 누르면 상세)
//  - 태블릿 폭: 가로 막대 유지, 그날 첫 일정 쪽으로 가로 스크롤 · 아티스트 이름 칸 고정
const { chromium, devices } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch(); const errs = [];
  const run = async (ctxOpt) => {
    const p = await (await b.newContext(ctxOpt)).newPage();
    p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(() => { }));
    await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
    await p.goto(base + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '공진문'); });
    await p.goto(base + '/admin.html'); await p.waitForTimeout(1500);
    await p.evaluate(async () => { await hqStore.seedDemoData(); }); await p.reload(); await p.waitForTimeout(1500);
    await p.evaluate(async () => {
      const t = new Date(Date.now() + 864e5); const d = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      const a = (await hqStore.getArtists())[0];
      await hqStore.saveSchedule({ title: '오후 생방송', date: d, startTime: '18:00', endTime: '19:30', status: '예정', artistId: a.id, location: 'CJ ENM 센터', shop: { needed: false },
        timeline: [{ time: '15:40', label: '[기상·준비] 기상 및 외출 준비' }, { time: '16:40', label: '[현장 이동] 숙소 출발' }, { time: '18:00', label: '[메인 일정] 오후 생방송' }] });
    });
    await p.click('#btn-nav-today'); await p.waitForTimeout(400);
    await p.click('#btn-nav-next'); await p.waitForTimeout(800);
    const r = await p.evaluate(() => {
      const card = document.querySelector('.gv2m-card');
      if (card) return { mobile: true, steps: card.querySelectorAll('.gv2m-steps li').length, title: card.querySelector('.gv2m-title').textContent, clickable: !!card.dataset.schId };
      const box = document.querySelector('.gv2'); const bar = box && box.querySelector('.gv2-bar');
      if (!box || !bar) return { box: !!box, bar: !!bar };
      const br = bar.getBoundingClientRect(), xr = box.getBoundingClientRect();
      return { scrolled: box.scrollLeft > 0, barVisible: br.left < xr.right && br.right > xr.left + 150, sticky: getComputedStyle(box.querySelector('.gv2-who')).position };
    });
    if (r.mobile) { await p.click('.gv2m-card'); await p.waitForTimeout(500); r.opened = await p.evaluate(() => !!document.querySelector('.modal-overlay.active, .modal.active, [class*="modal"][style*="flex"], [class*="detail"].open')); }
    return r;
  };
  const phone = await run({ ...devices['iPhone 14'] });
  const tablet = await run({ viewport: { width: 820, height: 1000 } });
  console.log(JSON.stringify({ phone, tablet }), 'errs', JSON.stringify(errs));
  await b.close();
})();
