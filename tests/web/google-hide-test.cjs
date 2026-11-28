// 개인 매니저 로그인: 서버에서 Google 로그인이 꺼져 있으면 버튼을 숨김 ('준비 중' 버튼은 심사에서 고장으로 보임)
//  + '이메일 계정이 있어요' 링크로 이메일 로그인(테스트·심사용 계정) 화면으로 이동
const { chromium, devices } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch();
  const R = {}; const errs = [];
  const open = async (google) => {
    const p = await (await b.newContext({ ...devices['iPhone 14'], userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile' })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
    await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
    await p.route(/\/auth\/v1\/settings/, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ external: { google: google, kakao: true, apple: true } }) }));
    await p.goto(base + '/index.html'); await p.waitForTimeout(1000);
    await p.evaluate(() => Login.setTab('b2c')); await p.waitForTimeout(500);
    return p;
  };
  const off = await open(false);
  R.off = await off.evaluate(() => ({ google: !!document.querySelector('#google_btn_wrapper .btn-google'), kakao: !!document.querySelector('.btn-kakao') }));
  await off.click('text=이메일 계정이 있어요'); await off.waitForTimeout(300);
  R.link = await off.evaluate(() => ({ email: !!document.querySelector('#login-email')?.offsetParent, title: document.querySelector('#login-b2b-section .lg-h2')?.textContent }));
  const on = await open(true);
  R.on = await on.evaluate(() => ({ google: !!document.querySelector('#google_btn_wrapper .btn-google') }));
  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
