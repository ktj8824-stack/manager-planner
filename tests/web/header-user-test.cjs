// 위 막대 오른쪽: 이름 + 로그아웃 (아이폰 14·작은 폰에서 겹치지 않음, 누르면 로그인 화면)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const R = {}; const errs = [];
  for (const [label, dev] of [['i14', devices['iPhone 14']], ['se', devices['iPhone SE']]]) {
    const p = await (await b.newContext({ ...dev })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
    await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
    await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(900);
    await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1200);
    await p.evaluate(() => { localStorage.setItem('bp_user_name', '박진우 팀장'); App.navigate('home'); });
    await p.waitForTimeout(200);
    R[label] = await p.evaluate(() => {
      const n = document.getElementById('top-user-name'), btn = document.querySelector('.top-logout'), brand = document.querySelector('.top-brand-text');
      const nb = n.getBoundingClientRect(), bb = btn.getBoundingClientRect(), tb = brand.getBoundingClientRect();
      return { name: n.textContent, btnVisible: bb.width > 0 && bb.right <= innerWidth, noOverlap: tb.right <= nb.left + 1 && nb.right <= bb.left, noHScroll: document.documentElement.scrollWidth <= innerWidth };
    });
    if (label === 'i14') {
      await p.screenshot({ path: process.env.SHOT || '/dev/null', clip: { x: 0, y: 0, width: 390, height: 120 } }).catch(() => {});
      p.once('dialog', d => d.accept());
      await p.tap('.top-logout'); await p.waitForTimeout(800);
      R.loggedOut = await p.evaluate(() => document.getElementById('screen-login').classList.contains('active') && !localStorage.getItem('bp_user_name'));
    }
  }
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
