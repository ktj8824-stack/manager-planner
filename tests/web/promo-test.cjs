// 출시 기념 무료 기간 (2027-03-31, 결제 스위치 닫힘): 앱·결제 페이지·본사 모두 결제 없이 모든 기능
//   - 개인 매니저: 유료 기능 열림 · 내 정보/요금제 화면에 무료 안내 · 결제 버튼 없음 · 아티스트 여러 명
//   - 결제 페이지: 안내만 보이고 결제창(토스)을 띄우지 않음
//   - 본사: 매니저 52명(2 + 50) · 구독 관리를 누르면 결제 창 대신 무료 안내
const { chromium, devices } = require('playwright');
const { autoAsk, asked } = require('./_ask-auto.cjs');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch();
  const R = {}; const errs = [];
  const block = (pg) => pg.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => {
    const u = r.request().url();
    if (u.includes('tosspayments')) { R.tossLoaded = true; return r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.__tossInit=0;window.TossPayments=function(){window.__tossInit++;return{widgets(){return{setAmount:async()=>{},renderPaymentMethods:async()=>{},renderAgreement:async()=>{}}}}};window.TossPayments.ANONYMOUS="a";' }); }
    return u.endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort();
  });

  // ── 앱: 개인 매니저 ──
  const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await block(p);
  await p.goto(base + '/index.html'); await p.waitForTimeout(1000);
  R.loginHint = await p.evaluate(() => [...document.querySelectorAll('.lg-hint')].map(x => x.textContent.trim()).join('|'));
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => { localStorage.setItem('bp_account', 'indie'); localStorage.removeItem('rp_pro_until'); App.renderNav(); App.navigate('profile'); });
  await p.waitForTimeout(400);
  R.app = await p.evaluate(() => ({
    free: PROMO.isFree(), text: PROMO.text(),
    paid: Plan.isPaid(), hasPaid: Plan.hasPaid(),
    can: ['ai', 'autonav', 'traffic', 'artists', 'expenses'].every(f => Plan.can(f)),
    profile: (document.querySelector('#screen-profile .me-plan')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
    sub: document.querySelector('#screen-profile .me-sub')?.textContent.trim(),
  }));
  await p.evaluate(() => App.navigate('upgrade')); await p.waitForTimeout(400);
  R.upgrade = await p.evaluate(() => {
    const t = document.getElementById('screen-upgrade')?.textContent || '';
    return { free: t.includes('2027년 3월 31일까지 무료'), noPayBtn: !document.querySelector('#screen-upgrade .btn-upg'), noPrice: !t.includes('20,000') && !t.includes('정기결제'), noAuto: t.includes('자동으로 결제되지도 않아요') };
  });
  await p.evaluate(() => App.navigate('artists')); await p.waitForTimeout(400);
  R.artists = await p.evaluate(() => (document.querySelector('#screen-artists .art-plan')?.textContent || '').trim().slice(0, 24));

  // ── 결제 페이지 ──
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  q.on('pageerror', e => errs.push(e.message));
  await block(q);
  await q.goto(base + '/payment.html?plan=pro'); await q.waitForTimeout(1200);
  R.pay = await q.evaluate(() => ({
    notice: !document.getElementById('free-notice').hidden,
    title: document.getElementById('free-notice-title').textContent,
    mainHidden: document.getElementById('pay-main').hidden,
    tossInit: window.__tossInit || 0,
    testBanner: !!document.getElementById('test-banner'),
  }));

  // ── 본사 ──
  const h = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  h.on('pageerror', e => errs.push(e.message)); await autoAsk(h);
  await block(h);
  await h.goto(base + '/admin-login.html'); await h.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '테스트'); });
  await h.goto(base + '/admin.html'); await h.waitForTimeout(1500);
  R.hq = await h.evaluate(() => { const s = hqStore.getSubscription(); return { free: s.free, total: s.totalSlots, fee: s.monthlyFee, plan: s.planName, canAdd: hqStore.canAddManager() }; });
  await h.evaluate(() => Admin.openSubscriptionModal()); await h.waitForTimeout(500);
  R.hqModal = { payModalOpen: await h.evaluate(() => !!document.getElementById('modal-company-subscription')?.classList.contains('active')), asked: (await asked(h)).join('|').slice(0, 40) };

  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
