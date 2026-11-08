// 개인 매니저 모드: 아래 메뉴 4개(홈·아티스트·AI·내 정보) · 로드톡/긴급/본사 없음 · 무료 제한(아티스트 1명·알림·자동 길안내·교통 예측) · 유료 화면 2만원
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.dismiss());
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  const R = {};
  R.loginText = await p.evaluate(() => document.getElementById('login-b2c-section')?.textContent.includes('아티스트 1명까지 무료') && !!document.getElementById('tab-b2b') && !!document.getElementById('tab-b2c'));
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => { localStorage.setItem('bp_account', 'indie'); localStorage.removeItem('rp_pro_until'); App.renderNav(); App.navigate('home'); });
  await p.waitForTimeout(400);
  R.nav = await p.evaluate(() => Array.from(document.querySelectorAll('#bottom-nav .bnav-item')).map(x => x.innerText.replace(/\s+/g, '')).join(','));
  R.noHQ = await p.evaluate(() => !document.querySelector('#screen-home a[href*="admin"]'));
  // 아티스트 화면: 무료 1명 제한
  await p.tap('#bottom-nav [data-s="artists"]'); await p.waitForTimeout(300);
  R.artists = await p.evaluate(() => ({ cards: document.querySelectorAll('.art-card').length, free: document.querySelector('.art-plan')?.innerText.includes('1명까지'), active: document.querySelector('#bottom-nav [data-s="artists"]').classList.contains('active') }));
  R.artUI = await p.evaluate(() => {
    const n = Artists.list().length, lock = document.querySelector('div.art-add.locked');
    return { count: document.querySelector('.art-count')?.innerText.includes('/ 1명'), lockedOk: n >= 1 ? !!lock && lock.innerText.includes('유료 혜택 보기') : !lock, noRowBtns: !document.querySelector('.art-card .art-btn') };
  });
  if (await p.$('.art-card')) {
    await p.tap('.art-card'); await p.waitForTimeout(400);
    R.detail = await p.evaluate(() => { const t = document.querySelector('#app-modal')?.innerText || ''; return t.includes('다가오는 일정') && t.includes('정보 수정') && t.includes('삭제'); });
    await p.evaluate(() => App.closeModal()); await p.waitForTimeout(350);
  }
  await p.evaluate(() => Artists.openForm()); await p.waitForTimeout(400);
  R.upsell = await p.evaluate(() => Artists.list().length < 1 || (document.querySelector('#app-modal')?.innerText.includes('유료 기능이에요') && document.querySelector('#app-modal').innerText.includes('20,000')));
  await p.evaluate(() => App.closeModal()); await p.waitForTimeout(350);
  // 내 정보: 요금 카드, 긴급 없음, 잠금 표시
  await p.tap('#bottom-nav [data-s="profile"]'); await p.waitForTimeout(400);
  R.profile = await p.evaluate(() => { const t = document.getElementById('screen-profile').innerText; return { free: t.includes('무료로 쓰는 중'), noSos: !t.includes('긴급 지원'), locks: document.getElementById('screen-profile').innerHTML.split('padding:3px 9px;border-radius:999px').length - 1 }; });
  await p.tap('text=유료 알아보기'); await p.waitForTimeout(400);
  R.upgrade = await p.evaluate(() => { const t = document.getElementById('screen-upgrade').innerText; return t.includes('20,000') && t.includes('로드비서 하루 60번') && !t.includes('4,900'); });
  // 무료: 자동 길안내·알림·교통 예측 막힘
  R.gates = await p.evaluate(async () => {
    let tmap = 0;
    Object.assign(TmapAPI, { getRouteTimeAt: async () => { tmap++; return 33; }, getRouteTime: async () => { tmap++; return 30; }, searchPlace: async () => [] });
    Object.assign(KakaoAPI, { geocode: async () => ({ x: 127, y: 37 }), searchPlace: async () => [], getRouteTime: async () => 31 });
    const d = new Date(Date.now() + 3 * 86400e3); const ymd = d.toISOString().slice(0, 10);
    const r1 = await window.hqStore.getTravelDuration('청담동', '여의도', 40, ymd, '10:00');
    const free = { autonav: AutoNav._can('autonav'), alerts: AutoNav._can('alerts'), traffic: r1.predicted || tmap > 0 };
    localStorage.setItem('rp_pro_until', new Date(Date.now() + 86400e3 * 20).toISOString());
    const r2 = await window.hqStore.getTravelDuration('청담동', '여의도', 40, ymd, '10:00');
    const paid = { autonav: AutoNav._can('autonav'), alerts: AutoNav._can('alerts'), traffic: !!r2.predicted };
    localStorage.setItem('bp_account', 'company'); localStorage.removeItem('rp_pro_until');
    const company = Plan.can('ai') && Plan.can('traffic');
    localStorage.setItem('bp_account', 'indie');
    return JSON.stringify({ free, paid, company });
  });
  // AI 카드: 개인 매니저는 본사 요청이 아니라 직접 수정
  R.aiEdit = await p.evaluate(() => RoadAI.canEdit());
  R.aiRole = await p.evaluate(() => RoadAI.context().role);
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
