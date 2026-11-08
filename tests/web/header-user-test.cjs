// 위 막대: 로드플래너 + 아래 줄 '이름님 · 회사 · 본사 연결됨' (작은 폰에서도 안 넘침) · 로그아웃은 내 정보에만 → 누르면 로그인 화면
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
    await p.evaluate(() => { localStorage.setItem('bp_user_name', '박진우 팀장'); localStorage.setItem('bp_company_name', 'KJM 엔터테인먼트'); App.navigate('home'); });
    await p.waitForTimeout(200);
    R[label] = await p.evaluate(() => {
      const n = document.getElementById('top-user-name'), bell = document.getElementById('top-bell');
      const nb = n.getBoundingClientRect(), bb = bell.getBoundingClientRect();
      return { name: n.textContent, noLogoutInHeader: !document.querySelector('#top-header .top-logout'), fits: nb.right <= bb.left + 1 && bb.right <= innerWidth, noHScroll: document.documentElement.scrollWidth <= innerWidth };
    });
    if (label === 'i14') {
      await p.screenshot({ path: process.env.SHOT || '/dev/null', clip: { x: 0, y: 0, width: 390, height: 120 } }).catch(() => {});
      p.once('dialog', d => d.accept());
      await p.tap('#bottom-nav [data-s="profile"]'); await p.waitForTimeout(400);
      await p.tap('.me-logout'); await p.waitForTimeout(800);
      R.loggedOut = await p.evaluate(() => document.getElementById('screen-login').classList.contains('active') && !localStorage.getItem('bp_user_name'));
    }
  }
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
