// 로드톡을 열어도 아래 메뉴가 보이고, 홈을 누르면 로드톡이 닫힘 (아이폰 크기)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    const C = window.Chat; C.available = () => true; C.isHq = () => false; C.refreshList = async () => { }; C._ensureMyRoom = async () => { }; C._askNotifyPermission = () => { }; C._items = () => [{ key: 'all', kind: 'all', room: null, name: '전체 공지방', sub: '모든 매니저가 함께 보는 대화', avatar: '전' }, { key: 'd', kind: 'direct', room: null, name: '본사 (대표)', sub: '[지연 예상 약 707분] 루나스 (LUNAS) · 컴백 기념 팬사인회 청담동 아주 긴 미리보기 글이 이어집니다 아주 아주 길게 계속', avatar: '본' }];
  });
  await p.tap('#notice-bell'); await p.waitForTimeout(500);
  const R = {};
  R.open = await p.evaluate(() => !document.getElementById('chat-root').hidden);
  R.navVisible = await p.evaluate(() => { const n = document.getElementById('bottom-nav').getBoundingClientRect(); const el = document.elementFromPoint(n.left + 30, n.top + 30); return !!(el && el.closest('#bottom-nav')); });
  R.chatAboveNav = await p.evaluate(() => Math.round(document.getElementById('chat-root').getBoundingClientRect().bottom) <= Math.round(document.getElementById('bottom-nav').getBoundingClientRect().top) + 1);
  R.noSideScroll = await p.evaluate(() => { const b = document.querySelector('.chat-list [data-act="close"]').getBoundingClientRect(); return b.right <= innerWidth && document.querySelector('.chat-shell').scrollWidth <= innerWidth + 1; });
  R.closeBtn = await p.evaluate(() => { const b = document.querySelector('.chat-list [data-act="close"]').getBoundingClientRect(); return `${Math.round(b.width)}x${Math.round(b.height)}`; });
  await p.tap('#bottom-nav [data-s="home"]'); await p.waitForTimeout(400);
  R.closedByHome = await p.evaluate(() => document.getElementById('chat-root').hidden);
  await p.tap('#notice-bell'); await p.waitForTimeout(300);
  await p.tap('#notice-bell'); await p.waitForTimeout(300);
  R.toggleClose = await p.evaluate(() => document.getElementById('chat-root').hidden);
  await p.tap('#notice-bell'); await p.waitForTimeout(300);
  await p.goBack().catch(() => { }); await p.waitForTimeout(400);
  R.backClose = await p.evaluate(() => document.getElementById('chat-root').hidden);
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
