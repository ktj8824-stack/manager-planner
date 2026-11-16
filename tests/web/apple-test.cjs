// Apple 로그인 (아이폰 앱 안에서만, 애플 심사 지침 4.8) + 탈퇴 때 Apple 연결 끊기 코드 (5.1.1(v))
//   - 웹·안드로이드: Apple 버튼 없음
//   - 아이폰 앱: 버튼 → 앱에 해시한 nonce 전달 → 받은 표 + 원래 nonce 로 서버 로그인 → 처음 받은 이름 저장
//   - 취소하면 아무 일 없음
//   - Apple 계정 탈퇴: Apple 확인 코드를 서버에 같이 보냄 / 취소하면 탈퇴 멈춤
const { chromium, devices } = require('playwright');
const crypto = require('crypto');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch();
  const R = {}; const errs = [];
  const block = (pg) => pg.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  const open = async (native) => {
    const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
    p.on('pageerror', e => errs.push(e.message));
    await p.addInitScript((native) => {
      sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1;
      if (!native) return;
      window.__rpNative = { apple: true };
      window.__posted = []; window.__reply = null;
      window.webkit = { messageHandlers: { roadplanner: { postMessage(m) { window.__posted.push(m); if (m.type === 'appleLogin') setTimeout(() => window.__rpAppleDone && window.__rpAppleDone(window.__reply), 20); } } } };
    }, native);
    await block(p);
    await p.goto(base + '/index.html'); await p.waitForTimeout(1000);
    await p.evaluate(() => Login.setTab('b2c'));
    return p;
  };

  // 웹(앱 아님)
  const w = await open(false);
  R.web = await w.evaluate(() => ({ btn: !!document.querySelector('.btn-apple'), kakao: !!document.querySelector('.btn-kakao') }));

  // 아이폰 앱
  const p = await open(true);
  R.app = await p.evaluate(() => ({ btn: (document.querySelector('.btn-apple')?.textContent || '').trim(), visible: !!document.querySelector('.btn-apple')?.offsetParent }));
  await p.evaluate(() => {
    window.__toasts = []; const t = U.toast; U.toast = (m) => { window.__toasts.push(m); };
    SupabaseClient.isConfigured = true;
    window.__sign = null; window.__upd = null; window.__fin = null;
    SupabaseClient.client = {
      auth: { signInWithIdToken: async (o) => { window.__sign = o; return { error: null }; } },
      from: () => ({ update: (v) => ({ eq: async () => { window.__upd = v; return { error: null }; } }) }),
    };
    SupabaseClient.getCurrentSession = async () => ({ user: { id: 'u1', email: 'abc@privaterelay.appleid.com' }, profile: { id: 'u1', name: 'abc', role: 'indie_manager', company_id: null } });
    Login.finishLogin = (prov, u) => { window.__fin = { prov, name: u.name, role: u.role }; };
  });
  // 1) 취소
  await p.evaluate(() => { window.__reply = { error: 'cancel' }; });
  await p.click('.btn-apple'); await p.waitForTimeout(300);
  R.cancel = await p.evaluate(() => ({ posted: window.__posted.length, signed: !!window.__sign, toasts: window.__toasts.length }));
  // 2) 로그인
  await p.evaluate(() => { window.__reply = { idToken: 'ID.TOKEN.X', code: 'c1', name: '김하늘', email: 'abc@privaterelay.appleid.com' }; });
  await p.click('.btn-apple'); await p.waitForTimeout(400);
  const got = await p.evaluate(() => ({ msg: window.__posted[1], sign: window.__sign, upd: window.__upd, fin: window.__fin, prov: localStorage.getItem('bp_provider') }));
  R.login = {
    scopes: got.msg?.scopes === true,
    nonceHashed: !!got.sign && got.msg?.nonce === crypto.createHash('sha256').update(got.sign.nonce).digest('hex') && got.sign.nonce.length >= 32,
    provider: got.sign?.provider, token: got.sign?.token, name: got.upd?.name, fin: got.fin, prov: got.prov,
  };
  // 3) 서버에서 Apple 로그인이 아직 꺼져 있을 때
  await p.evaluate(() => { window.__toasts = []; SupabaseClient.client.auth.signInWithIdToken = async () => ({ error: { message: 'Provider (issuer "https://appleid.apple.com") is not enabled' } }); });
  await p.click('.btn-apple'); await p.waitForTimeout(400);
  R.disabled = await p.evaluate(() => window.__toasts.join('|'));

  // 4) Apple 계정 탈퇴
  const withdraw = async (reply) => {
    await p.evaluate((reply) => {
      localStorage.setItem('bp_logged_in', 'true'); localStorage.setItem('bp_account', 'indie');
      SupabaseClient.currentUser = { id: 'u1', app_metadata: { provider: 'apple', providers: ['apple'] } };
      window.__del = null; window.__reply = reply;
      SupabaseClient.deleteMyAccount = async (code) => { window.__del = { code }; return { ok: true }; };
      Profile.withdraw();
    }, reply);
    await p.waitForSelector('#ask-in', { timeout: 4000 });
    await p.fill('#ask-in', '탈퇴'); await p.click('#ask-back .ask-ok'); await p.waitForTimeout(500);
    const r = await p.evaluate(() => ({ del: window.__del, last: window.__posted[window.__posted.length - 1] }));
    if (await p.$('#ask-back .ask-ok')) { await p.click('#ask-back .ask-ok'); await p.waitForTimeout(200); }
    return { called: !!r.del, code: r.del?.code ?? null, scopes: r.last?.scopes };
  };
  R.wdCancel = await withdraw({ error: 'cancel' });
  R.wdOk = await withdraw({ code: 'APPLE_CODE_1' });

  // 정책 페이지
  await p.goto(base + '/privacy.html'); R.privacy = await p.evaluate(() => /Apple \(apple\.com\)/.test(document.body.textContent));

  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
