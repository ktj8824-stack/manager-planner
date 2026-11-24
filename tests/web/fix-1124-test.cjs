// 11/24 점검: 차에 타면 자동 길안내(AutoNav.nextStep)가 안 누른 지난 단계(픽업·샵)로 안내하던 것
//  → 홈 '지금 할 일'처럼 다음 단계 시각이 이미 지났으면 그 단계는 넘김
const { chromium, devices } = require('playwright');
const BASE = process.argv[2];
const block = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-11-24T15:20:00+09:00') });
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await block(p);
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
  await p.evaluate(async () => { await hqStore.seedDemoData(); });
  await p.waitForTimeout(800);
  const R = await p.evaluate(() => {
    const n = AutoNav.nextStep();
    Home.render();
    const card = (document.querySelector('.now-card') || {}).innerText || '';
    return { step: n && `${n.time} ${n.tag} → ${n.dest}`, sameAsHome: !!(n && n.dest && card.includes(n.name ? n.name.slice(0, 4) : '§')) || /올림픽/.test(card) === /올림픽/.test(n && n.dest || ''), shop: /압구정로79길/.test(n && n.dest || '') };
  });
  console.log(JSON.stringify(R));
  console.log('errs', JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
