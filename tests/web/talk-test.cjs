// 로드톡 공지 탭: 긴급 공지는 맨 위 빨간 카드 + '확인했어요' → 확인함, 'N명 중 M명 확인', 제목 [..] 분리, XSS 없음
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    localStorage.removeItem('rp_talk_ack_m2');
    const now = Date.now();
    const C = window.Chat; C.available = () => true; C.isHq = () => false;
    C.st.rooms = [{ id: 'all1', kind: 'all', last_message_at: new Date(now).toISOString() }]; C.st.unread = { all1: 2 };
    C.refreshList = async () => { };
    window.__read = 0;
    Object.assign(window.SupabaseClient, {
      currentUser: { id: 'me' },
      chatMessages: async () => [
        { id: 'm1', body: '[운영] 법인 차량 정기 점검', is_urgent: false, sender_id: 'hq', sender_name: '본사', created_at: new Date(now - 864e5).toISOString() },
        { id: 'm2', body: '[해외 투어 의전 동선 지침] 공항 동선을 점검해 주세요 <img src=x onerror=alert(1)>', is_urgent: true, sender_id: 'hq', sender_name: '본사 총괄', created_at: new Date(now - 6e5).toISOString() }],
      chatReadStatus: async () => window.__read ? [{ last_read_at: new Date().toISOString() }, { last_read_at: new Date().toISOString() }, { last_read_at: null }] : [{ last_read_at: new Date(now).toISOString() }, { last_read_at: null }, { last_read_at: null }],
      chatMarkRead: async () => { window.__read = 1; },
    });
  });
  await p.tap('#top-bell'); await p.waitForTimeout(700);   // 종 → 공지 탭 (아래 로드톡은 대화 탭)
  const R = {};
  R.first = await p.evaluate(() => { const c = document.querySelector('.talk-card'); return { urgent: c.classList.contains('need'), title: c.querySelector('h2').textContent, tag: c.querySelector('.talk-tag').textContent, count: c.querySelector('.talk-card-foot span').textContent }; });
  R.noXss = await p.evaluate(() => !document.querySelector('.talk-card img'));
  R.badge = await p.evaluate(() => document.querySelector('.talk-tabs .talk-badge')?.textContent);
  await p.screenshot({ path: process.env.SHOT || '/dev/null' }).catch(()=>{}); await p.tap('.talk-ack'); await p.waitForTimeout(500);
  R.after = await p.evaluate(() => ({ need: document.querySelectorAll('.talk-card.need').length, acked: document.querySelector('.talk-acked')?.textContent, count: [...document.querySelectorAll('.talk-card-foot span')].map(s => s.textContent).join('|') }));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
