// 로드톡: 위 종 → 공지 탭(본사 긴급 공지도 보임) / 아래 [로드톡] → 대화 탭 바로 (아이폰 크기)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    const C = window.Chat; C.available = () => true; C.isHq = () => false; C.refreshList = async () => { }; C._ensureMyRoom = async () => { };
    C._items = () => [{ key: 'all', kind: 'all', room: null, name: '전체 공지방', sub: '모든 매니저', avatar: '전' }];
    C.st.rooms = [];
    localStorage.setItem('HQ_NOTIFICATIONS_V2', JSON.stringify([{ id: 'n1', title: '🚨 긴급 공지', content: '테스트 긴급', isUrgent: true, targetId: 'ALL', createdAt: new Date().toISOString() }]));
  });
  await p.tap('.bnav-item[data-s="talk"]'); await p.waitForTimeout(500);
  const bottom = await p.evaluate(() => document.querySelector('.talk-tabs .on')?.textContent.trim());
  await p.tap('#top-bell'); await p.waitForTimeout(500);
  const bell = await p.evaluate(() => ({ tab: document.querySelector('.talk-tabs .on')?.textContent.trim(), body: document.getElementById('talk-body')?.innerText.replace(/\s+/g, ' ').trim() }));
  console.log('bottom:', bottom); console.log('bell:', bell.tab, '|', bell.body); console.log('errors:', errs.length);
  await b.close();
})();
