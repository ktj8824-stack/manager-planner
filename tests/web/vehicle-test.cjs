// 내 차량(개인 매니저): 무료는 차량 정보만, 비용 기록은 잠김 · 유료는 주유·정비 바로 추가 → 이번 달 차량 비용에 합계 · 회사 매니저는 '정비·세차' 항목 안 보임
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => { localStorage.setItem('bp_account', 'indie'); localStorage.removeItem('rp_pro_until'); localStorage.removeItem('rp_vehicle'); localStorage.removeItem('rp_expenses_local'); App.renderNav(); App.navigate('profile'); });
  await p.waitForTimeout(300);
  const R = {};
  await p.tap('text=내 차량'); await p.waitForTimeout(400);
  R.free = await p.evaluate(() => ({ screen: State.screen, empty: !!document.querySelector('.veh-empty'), locked: !!document.querySelector('#screen-vehicle .art-add.locked') }));
  await p.tap('.veh-empty .btn-primary'); await p.waitForTimeout(400);
  await p.fill('#veh-model', '카니발'); await p.fill('#veh-plate', '12가 3456'); await p.fill('#veh-ins', '삼성화재'); await p.fill('#veh-tel', '1588-5114');
  await p.tap('#veh-form .exp-cat-pick >> text=경유');
  await p.tap('#veh-form button[type=submit]'); await p.waitForTimeout(500);
  R.saved = await p.evaluate(() => ({ title: Vehicle.title(), call: document.querySelector('.veh-call')?.getAttribute('href'), fuel: document.querySelector('.veh-info')?.innerText.includes('경유'), line: localStorage.getItem('bp_user_vehicle') }));
  await p.evaluate(() => { localStorage.setItem('rp_pro_until', new Date(Date.now() + 864e5 * 10).toISOString()); Vehicle.render(); }); await p.waitForTimeout(400);
  R.quick = await p.evaluate(() => Array.from(document.querySelectorAll('.veh-quick button')).map(x => x.innerText.replace(/\s+/g, '')).join(','));
  await p.tap('.veh-quick >> text=주유'); await p.waitForTimeout(400);
  R.formCat = await p.evaluate(() => document.querySelector('.exp-cat-pick button.on')?.dataset.c + '|' + document.querySelectorAll('#exp-form .exp-cat-pick button').length);
  await p.fill('#exp-amount', '70000'); await p.tap('#exp-save'); await p.waitForTimeout(600);
  R.cost = await p.evaluate(() => ({ screen: State.screen, total: document.querySelector('#veh-cost-body .exp-total-amt')?.innerText, items: document.querySelectorAll('#veh-cost-body .exp-item').length }));
  // 경비 화면 위 차량 바로가기
  await p.evaluate(() => App.navigate('expenses')); await p.waitForTimeout(400);
  R.expCar = await p.evaluate(() => document.querySelector('.exp-car')?.innerText.includes('카니발'));
  // 회사 매니저: 정비·세차 없음
  await p.evaluate(() => { localStorage.setItem('bp_account', 'company'); App.closeModal(); Expenses.openForm(); }); await p.waitForTimeout(400);
  R.companyCats = await p.evaluate(() => !document.querySelector('#exp-form [data-c="repair"]') && document.querySelectorAll('#exp-form .exp-cat-pick button').length === 7);
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
