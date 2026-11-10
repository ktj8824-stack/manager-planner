// 광고: 무료 개인 매니저만 아래 띠 광고 + 일정 등록 뒤 전면 광고(3초 뒤 닫기, 3분 간격) / 회사 매니저·유료는 광고 없음
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(900);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1800);
  const R = {};
  R.company = await p.evaluate(() => { Ads.sync(); return { bar: !!document.getElementById('ad-banner'), full: Ads.moment('schedule', true) }; });
  await p.evaluate(() => { localStorage.setItem('bp_account', 'indie'); localStorage.removeItem('rp_pro_until'); localStorage.removeItem('rp_ad_log'); App.renderNav(); App.navigate('home'); });
  await p.waitForTimeout(600);
  R.free = await p.evaluate(() => { const bar = document.getElementById('ad-banner'); const nav = document.getElementById('bottom-nav'); return { bar: !!bar, tag: bar?.querySelector('.ad-tag')?.textContent, above: bar && nav ? Math.round(bar.getBoundingClientRect().bottom) <= Math.round(nav.querySelector('.bnav-item').getBoundingClientRect().top) + 1 : false }; });
  if (process.argv[3]) await p.screenshot({ path: process.argv[3] + '/ads-bar.png' });
  R.first = await p.evaluate(() => Ads.moment('schedule'));
  await p.waitForTimeout(1000);
  R.full = await p.evaluate(() => { const b = document.querySelector('#ad-full .ad-close'); return { shown: !!b, locked: b?.disabled }; });
  if (process.argv[3]) await p.screenshot({ path: process.argv[3] + '/ads-full.png' });
  await p.waitForTimeout(3200);
  R.closable = await p.evaluate(() => { const b = document.querySelector('#ad-full .ad-close'); const ok = b && !b.disabled; b?.click(); return ok && !document.getElementById('ad-full'); });
  R.capped = await p.evaluate(() => Ads.moment('schedule') === false);
  await p.evaluate(() => { localStorage.setItem('rp_pro_until', new Date(Date.now() + 864e5).toISOString()); App.navigate('profile'); });
  await p.waitForTimeout(400);
  R.paid = await p.evaluate(() => ({ bar: !!document.getElementById('ad-banner'), full: Ads.moment('schedule', true) }));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
