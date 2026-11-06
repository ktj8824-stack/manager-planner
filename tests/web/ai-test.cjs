// AI 비서: 아래 메뉴(로드톡과 긴급 사이) · 화면이 메뉴 위에 딱 맞음 · 말 → 확인 카드 → 등록 창 채움 · 주변 장소 카드 (아이폰 14 크기)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  let sentBody = null;
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.route('**/functions/v1/roadplanner-ai', async r => {
    sentBody = JSON.parse(r.request().postData() || '{}');
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      reply: '**내일 오후 2시** 뮤직뱅크 사전녹화예요. 아래 카드에서 확인해 주세요.',
      actions: [{ type: 'schedule', title: '뮤직뱅크 사전녹화', date: '2026-11-08', start: '14:00', place: 'KBS 신관', category: 'broadcast', shop_name: '정샘물 청담', found: { addr: '서울 영등포구 여의공원로 13' } }],
      places: [{ id: 'p1', name: '여의도 국밥', category: '국밥', address: '서울 영등포구 1', phone: '02-1', url: 'https://place.map.kakao.com/p1', distance_m: 230 }],
      remaining: 9 }) });
  });
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  const R = {};
  R.navOrder = await p.evaluate(() => Array.from(document.querySelectorAll('#bottom-nav .bnav-item')).map(x => x.innerText.replace(/\s+/g, '').replace(/\d+$/, '')).join(','));
  // 로그인 안 함 → 안내
  await p.tap('#bottom-nav [data-s="ai"]'); await p.waitForTimeout(400);
  R.lockShown = await p.evaluate(() => !!document.querySelector('.rpai-lock') && document.getElementById('rpai-bar').style.display === 'none');
  // 로그인한 것처럼
  await p.evaluate(() => {
    window.SupabaseClient = window.SupabaseClient || {};
    Object.assign(window.SupabaseClient, { isConfigured: true, currentUser: { id: 'me-uuid' }, currentProfile: { name: '박진우 팀장' },
      client: { auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } } });
    RoadAI._ready = false; RoadAI.init();
  });
  R.active = await p.evaluate(() => document.querySelector('#bottom-nav [data-s="ai"]').classList.contains('active'));
  R.fit = await p.evaluate(() => {
    const a = document.getElementById('rpai').getBoundingClientRect(), n = document.getElementById('bottom-nav').getBoundingClientRect(), h = document.getElementById('top-header').getBoundingClientRect();
    return Math.abs(a.bottom - n.top) <= 1 && Math.abs(a.top - h.bottom) <= 1 && document.documentElement.scrollWidth <= innerWidth;
  });
  R.welcome = await p.evaluate(() => document.querySelector('#rpai-body').innerText.includes('박진우 팀장님') && document.querySelectorAll('.rpai-chip').length >= 5);
  await p.fill('#rpai-input', '내일 2시 KBS 뮤뱅 사녹 샵은 정샘물 청담'); await p.tap('#rpai-send'); await p.waitForTimeout(700);
  R.sent = !!sentBody && sentBody.message.includes('뮤뱅') && /^\d{4}-\d\d-\d\d$/.test(sentBody.context.today) && Array.isArray(sentBody.context.upcoming);
  R.card = await p.evaluate(() => !!document.querySelector('.rpai-card') && document.querySelector('.rpai-card').innerText.includes('여의공원로'));
  R.bold = await p.evaluate(() => !!document.querySelector('.rpai-row.bot:last-child .rpai-bubble b'));
  R.place = await p.evaluate(() => document.querySelector('.rpai-place')?.innerText.includes('230m'));
  R.left = await p.evaluate(() => document.getElementById('rpai-left').textContent);
  await p.tap('text=등록 창 열기'); await p.waitForTimeout(500);
  R.form = await p.evaluate(() => ({
    title: document.getElementById('m-sch-title')?.value, date: document.getElementById('m-sch-date')?.value, start: document.getElementById('m-sch-start')?.value,
    end: document.getElementById('m-sch-end')?.value, loc: document.getElementById('m-sch-loc')?.value, addr: document.getElementById('m-sch-addr')?.value,
    cat: document.getElementById('m-sch-category')?.value, shop: document.getElementById('m-sch-shop-needed')?.checked && document.getElementById('m-sch-shop-name')?.value,
  }));
  await p.evaluate(() => App.closeModal()); await p.waitForTimeout(400);
  R.cardDone = await p.evaluate(() => document.querySelector('.rpai-card .rpai-btn.done')?.innerText || '');
  R.kept = await p.evaluate(() => JSON.parse(localStorage.getItem('rp_ai_messages_v1_me-uuid') || '[]').length);
  await p.tap('#bottom-nav [data-s="home"]'); await p.waitForTimeout(400);
  R.homeBack = await p.evaluate(() => !document.getElementById('screen-ai').classList.contains('active') && document.getElementById('screen-home').classList.contains('active'));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
