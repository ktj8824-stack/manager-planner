// 스케줄 등록 창: 행사장 이름을 치면 장소 검색 목록 → 고르면 이름·주소 채움 (출발지는 '이름 (주소)')
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  let calls = 0;
  await p.route('**/functions/v1/manager-planner-route', async r => {
    calls++;
    const body = JSON.parse(r.request().postData() || '{}');
    const docs = body.service === 'kakao_keyword' && /프리즘/.test(body.query)
      ? [{ id: '1', place_name: 'SBS프리즘타워', road_address_name: '서울 마포구 상암산로 82', address_name: '서울 마포구 상암동 1607-1', x: '126.89', y: '37.57' }] : [];
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ documents: docs }) });
  });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)(?!.*manager-planner-route)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => Home.openScheduleRegisterModal()); await p.waitForTimeout(500);
  const R = {};
  await p.tap('#m-sch-loc'); await p.type('#m-sch-loc', '프리즘', { delay: 30 }); await p.waitForTimeout(900);
  R.listShown = await p.evaluate(() => { const l = document.querySelector('#m-sch-loc + .place-suggest'); return !!l && !l.hidden && l.innerText.includes('SBS프리즘타워'); });
  await p.tap('.place-suggest .ps-item'); await p.waitForTimeout(200);
  R.filled = await p.evaluate(() => [document.getElementById('m-sch-loc').value, document.getElementById('m-sch-addr').value].join('|'));
  R.closed = await p.evaluate(() => document.querySelector('#m-sch-loc + .place-suggest').hidden);
  await p.tap('#m-sch-dep'); await p.fill('#m-sch-dep', ''); await p.type('#m-sch-dep', '프리즘', { delay: 30 }); await p.waitForTimeout(900);
  await p.tap('#m-sch-dep + .place-suggest .ps-item'); await p.waitForTimeout(200);
  R.dep = await p.evaluate(() => document.getElementById('m-sch-dep').value);
  await p.fill('#m-sch-loc', '없는장소'); await p.waitForTimeout(900);
  R.empty = await p.evaluate(() => document.querySelector('#m-sch-loc + .place-suggest').innerText.includes('검색 결과가 없어요'));
  R.calls = calls > 0;
  // 폰 키보드 엔터: 창이 닫히지 않고 바로 검색, 한 번 더 누르면 첫 번째 고름
  await p.fill('#m-sch-loc', ''); await p.type('#m-sch-loc', '프리즘', { delay: 10 }); await p.press('#m-sch-loc', 'Enter'); await p.waitForTimeout(500);
  R.enterSearch = await p.evaluate(() => !!document.getElementById('app-modal') && document.querySelector('#m-sch-loc + .place-suggest').innerText.includes('SBS프리즘타워'));
  await p.press('#m-sch-loc', 'Enter'); await p.waitForTimeout(300);
  R.enterPick = await p.evaluate(() => !!document.getElementById('app-modal') && document.getElementById('m-sch-addr').value === '서울 마포구 상암산로 82');
  await p.press('#m-sch-title', 'Enter'); await p.waitForTimeout(400);
  R.enterOther = await p.evaluate(() => !!document.getElementById('app-modal') && document.getElementById('app-modal').classList.contains('open'));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
