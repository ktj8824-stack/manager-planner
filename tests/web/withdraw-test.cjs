// 회원 탈퇴 (앱스토어·구글 플레이 필수): 내 정보 맨 아래 '회원 탈퇴'
//   - 둘러보기: 지울 계정이 없다는 안내만
//   - 로그인한 개인 매니저: '탈퇴'라고 적어야 지워짐 → 서버 호출 → 이 기기 정보 정리 → 로그인 화면
//   - 대표: 서버가 거절(CEO_CONTACT) → 메일로 요청 안내
//   - 본사 웹 대표: 메뉴의 회원 탈퇴 → 메일로 요청 안내 / 계정 삭제 안내 페이지
const { chromium, devices } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch();
  const R = {}; const errs = [];
  const block = (pg) => pg.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  const sheet = async (pg) => { await pg.waitForSelector('#ask-back', { timeout: 4000 }); return pg.evaluate(() => document.querySelector('#ask-back h3')?.textContent || ''); };
  const tap = async (pg, sel) => { await pg.click('#ask-back ' + sel); await pg.waitForTimeout(150); };

  const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await block(p);
  await p.goto(base + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => App.navigate('profile')); await p.waitForTimeout(400);
  R.button = await p.evaluate(() => !!document.querySelector('#screen-profile .me-withdraw') && document.querySelector('#screen-profile .me-withdraw').textContent.trim());

  // 둘러보기
  await p.evaluate(() => { Profile.withdraw(); });
  R.demo = await sheet(p); await tap(p, '.ask-ok');

  // 로그인한 개인 매니저 (서버는 가짜로)
  await p.evaluate(() => {
    localStorage.setItem('bp_logged_in', 'true'); localStorage.setItem('bp_account', 'indie'); localStorage.setItem('rp_vehicle', '카니발');
    SupabaseClient.isConfigured = true;
    window.__calls = 0;
    SupabaseClient.deleteMyAccount = async () => { window.__calls++; return { ok: true }; };
    Profile.withdraw();
  });
  R.indieTitle = await sheet(p);
  R.indieDesc = await p.evaluate(() => /내 일정·아티스트/.test(document.querySelector('#ask-back p')?.textContent || ''));
  await p.fill('#ask-in', '틀림'); await tap(p, '.ask-ok');
  R.wrongWord = await p.evaluate(() => ({ err: document.getElementById('ask-err')?.textContent, calls: window.__calls, open: !!document.getElementById('ask-in') }));
  await p.fill('#ask-in', '탈퇴'); await tap(p, '.ask-ok');
  R.done = await sheet(p); await tap(p, '.ask-ok'); await p.waitForTimeout(300);
  R.after = await p.evaluate(() => ({ calls: window.__calls, screen: State.screen, left: Object.keys(localStorage).filter(k => /^(bp_|rp_)/.test(k)) }));

  // 대표 (서버가 거절)
  await p.evaluate(() => {
    localStorage.setItem('bp_logged_in', 'true');
    SupabaseClient.deleteMyAccount = async () => ({ ok: false, code: 'CEO_CONTACT', message: '대표 계정은 회사 전체 자료와 결제 기록이 연결돼 있어 바로 지울 수 없어요.' });
    Profile.withdraw();
  });
  await sheet(p); await p.fill('#ask-in', '탈퇴'); await tap(p, '.ask-ok');
  R.ceo = await sheet(p);
  R.ceoBtns = await p.evaluate(() => [...document.querySelectorAll('#ask-back button')].map(x => x.textContent.trim()).join('/'));
  await tap(p, '.ask-x');

  // 본사 웹 대표
  const h = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  h.on('pageerror', e => errs.push(e.message));
  await block(h);
  await h.goto(base + '/admin-login.html'); await h.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '테스트'); });
  await h.goto(base + '/admin.html'); await h.waitForTimeout(1500);
  R.hqMenu = await h.evaluate(() => !!document.querySelector('#user-dropdown-menu [onclick="Admin.withdraw()"]'));
  await h.evaluate(() => { Admin.withdraw(); });
  R.hqCeo = await sheet(h); await tap(h, '.ask-x');

  // 계정 삭제 안내 페이지
  await h.goto(base + '/delete-account.html'); await h.waitForTimeout(300);
  R.page = await h.evaluate(() => ({ h1: document.querySelector('h1')?.textContent, steps: /내 정보.*회원 탈퇴/s.test(document.body.textContent), mail: !!document.querySelector('a[href^="mailto:support@roadplanner.kr"]') }));

  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
