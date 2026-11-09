// 위치 동의(위치정보법): 동의 전엔 위치를 읽지 않음 · 긴급 지원은 '위치도 보내기' 버튼 · 동의 화면 → 동의하면 위치 읽음 · 내 정보에 위치 정보 줄 · 약관/방침 페이지
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 14'], geolocation: { latitude: 37.5, longitude: 127.0 }, permissions: ['geolocation'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.addInitScript(() => {
    sessionStorage.setItem('rp_splash_shown', '1');
    window.__geo = 0;
    const g = navigator.geolocation && navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    if (g) navigator.geolocation.getCurrentPosition = (...a) => { window.__geo++; return g(...a); };
  });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => { localStorage.setItem('bp_account', 'company'); localStorage.removeItem('rp_loc_consent'); App.renderNav(); App.navigate('home'); });
  await p.waitForTimeout(300);
  const R = {};
  // 동의 전: 긴급 지원 열어도 위치 안 읽음
  await p.evaluate(() => Sos.open()); await p.waitForTimeout(500);
  R.before = await p.evaluate(() => ({ geo: window.__geo, btn: !!document.querySelector('.sos-loc-btn'), line: document.querySelector('#sos-gps-line')?.innerText.slice(0, 9) }));
  // 동의 화면 → 동의
  await p.tap('.sos-loc-btn'); await p.waitForTimeout(400);
  R.modal = await p.evaluate(() => ({ title: document.querySelector('#app-modal .modal-title')?.innerText, items: document.querySelectorAll('.loc-dl > div').length, terms: !!document.querySelector('.loc-link[href="location-terms.html"]') }));
  await p.tap('.loc-yes'); await p.waitForTimeout(1200);
  R.after = await p.evaluate(() => ({ state: Loc.state(), geo: window.__geo > 0, gps: !!Sos.st.gps, line: document.querySelector('#sos-gps-line')?.innerText.slice(0, 5) }));
  // 철회하면 다시 안 읽음
  await p.evaluate(() => { localStorage.setItem('rp_loc_consent', 'no'); Sos.open(); }); await p.waitForTimeout(400);
  const g0 = await p.evaluate(() => window.__geo);
  R.withdrawn = await p.evaluate(async (g) => { const pos = await Loc.get(); return { pos: pos === null, geo: window.__geo === g, btn: !!document.querySelector('.sos-loc-btn') }; }, g0);
  // 내 정보: 위치 정보 줄 → 설정 창
  await p.evaluate(() => App.navigate('profile')); await p.waitForTimeout(400);
  R.profile = await p.evaluate(() => { const r = Array.from(document.querySelectorAll('.me-row')).find(x => x.innerText.includes('위치 정보')); return { row: !!r, sub: r?.innerText.includes('동의 안 함'), foot: document.querySelector('.me-foot')?.innerText.includes('위치기반서비스 이용약관') }; });
  await p.evaluate(() => Loc.openSettings()); await p.waitForTimeout(400);
  R.settings = await p.evaluate(() => ({ st: document.querySelector('.loc-st b')?.innerText, log: !!document.querySelector('#loc-log') }));
  // 약관 · 방침 페이지
  await p.goto(process.argv[2] + '/location-terms.html'); await p.waitForTimeout(300);
  R.terms = await p.evaluate(() => ({ h: document.querySelector('h1')?.innerText, secs: document.querySelectorAll('.section').length }));
  await p.goto(process.argv[2] + '/privacy.html'); await p.waitForTimeout(300);
  R.privacy = await p.evaluate(() => ({ loc: !!document.querySelector('#location'), old: document.body.innerText.includes('위치 첨부를 직접 누를 때에만'), anth: document.body.innerText.includes('Anthropic') }));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
