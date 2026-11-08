// 긴급 지원 전체 화면: 아래 '긴급' → 화면 / 상황 하나 고르고 두 번 눌러야 보내짐 / 일정·위치·시각 첨부 / 119·112
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['iPhone 14'], geolocation: { latitude: 37.5665, longitude: 126.978 }, permissions: ['geolocation'] });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__sent = []; window.Chat = window.Chat || {}; Chat.available = () => true; Chat.sendNotice = async (n) => { window.__sent.push(n); }; });
  await p.tap('#bottom-nav [data-s="sos"]'); await p.waitForTimeout(800);
  const R = {};
  R.screen = await p.evaluate(() => document.getElementById('screen-sos').classList.contains('active') && document.querySelector('#bottom-nav [data-s="sos"]').classList.contains('active'));
  R.idle = await p.evaluate(() => document.getElementById('sos-send').textContent);
  await p.tap('#sos-send'); await p.waitForTimeout(200);
  R.noSendWithoutType = await p.evaluate(() => window.__sent.length === 0);
  await p.tap('.sos-types >> text=교통 지연'); await p.waitForTimeout(200);
  await p.fill('#sos-memo', '올림픽대로 정체 20분 지연');
  await p.tap('#sos-send'); await p.waitForTimeout(200);
  R.confirm = await p.evaluate(() => document.getElementById('sos-send').textContent + '|' + window.__sent.length);
  await p.tap('#sos-send'); await p.waitForTimeout(500);
  R.sent = await p.evaluate(() => { const n = window.__sent[0] || {}; return { label: document.getElementById('sos-send').textContent, title: n.title, urgent: n.isUrgent, hasTime: /시각: \d\d:\d\d/.test(n.content || ''), hasGps: /map\.kakao\.com/.test(n.content || ''), hasMemo: /올림픽대로/.test(n.content || '') }; });
  R.links = await p.evaluate(() => [...document.querySelectorAll('.sos-119 a')].map(a => a.getAttribute('href')).join(','));
  R.noHScroll = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
