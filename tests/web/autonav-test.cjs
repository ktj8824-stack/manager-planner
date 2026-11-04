const { chromium } = require('playwright');
const base = process.env.BASE_DEMO;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' });
  const p = await ctx.newPage(); await p.clock.install({ time: new Date('2026-10-25T09:30:00+09:00') }); await p.clock.resume();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  const navs = [];
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => { const u = r.request().url(); return u.endsWith('.js') || u.includes('supabase-js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort(); });
  // 1) 첫 방문 로그인 → 데모
  await p.goto(base + '/index.html'); await p.waitForTimeout(600);
  await p.evaluate(async () => { Login.demoLogin('ceo'); await hqStore.seedDemoData(); localStorage.setItem('bp_preferred_navi', 'tmap'); });
  // 2) go=next 로 다시 열기
  await p.goto(base + '/index.html?go=next');
  await p.evaluate(() => { window.__navs = []; U.openNavigation = (a, b) => { window.__navs.push(a); }; });
  await p.waitForTimeout(1500);
  const r1 = await p.evaluate(() => ({ url: location.href, box: document.getElementById('an-box')?.innerText, step: AutoNav.nextStep(), splash: !!document.getElementById('rp-splash') }));
  console.log(JSON.stringify({ url: r1.url, box: r1.box, dest: r1.step && r1.step.dest, splash: r1.splash }));
  await p.screenshot({ path: require('os').tmpdir() + '/an1.png' });
  await p.waitForTimeout(3500);
  console.log('navs', JSON.stringify(await p.evaluate(() => window.__navs)), 'overlay', await p.evaluate(() => !!document.getElementById('an-bg')));
  // 3) 설정 가이드
  await p.evaluate(() => { App.navigate('profile'); });
  await p.waitForTimeout(300);
  const has = await p.evaluate(() => document.body.innerText.includes('차에 타면 자동 길안내'));
  await p.evaluate(() => AutoNav.openGuide()); await p.waitForTimeout(300);
  await p.screenshot({ path: require('os').tmpdir() + '/an2.png' });
  console.log('profileRow', has, 'errs', errs.length, errs.slice(0, 3));
  await b.close();
})();
