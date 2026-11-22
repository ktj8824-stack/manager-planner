// 11/22: 주소로 고른 장소 이름 = '건물 (친 주소)' · 등록 창에 그 주소의 현장 메모(출입구·주차) 바로 보임
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route('**/functions/v1/manager-planner-route', async r => {
    const body = JSON.parse(r.request().postData() || '{}');
    const docs = body.service === 'kakao_address' && /상암동\s*1605/.test(body.query)
      ? [{ address_name: '서울 마포구 상암동 1605', address_type: 'REGION_ADDR', x: '126.89', y: '37.58', address: { address_name: '서울 마포구 상암동 1605' }, road_address: { address_name: '서울 마포구 매봉산로 31', building_name: '문화콘텐츠센터' } }] : [];
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ documents: docs }) });
  });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)(?!.*manager-planner-route)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    const store = [{ id: 'v1', place_key: 'a:서울마포구매봉산로31', place_label: '서울 마포구 매봉산로 31', note: '출연자 출입구 후문 · 지하 3층 주차', author_id: 'other', author_name: '최현석 매니저', created_at: '2026-11-20T05:00:00Z' }];
    const q = () => { const st = { f: [] }; const api = {
      select() { return api; }, in(k, v) { st.f.push(r => v.includes(r[k])); return api; }, eq(k, v) { st.f.push(r => r[k] === v); return api; },
      order() { return api; }, limit() { return Promise.resolve({ data: store.filter(r => st.f.every(f => f(r))), error: null }); } }; return api; };
    window.SupabaseClient.client = { from: q }; window.SupabaseClient.currentUser = { id: 'me' };
    VenueNotes._cache.clear();
    Home.openScheduleRegisterModal();
  });
  await p.waitForTimeout(500);
  const R = {};
  R.noAddrNoMemo = await p.evaluate(() => document.getElementById('m-sch-venue').innerText.trim() === '');
  await p.tap('#m-sch-loc'); await p.type('#m-sch-loc', '상암동 1605', { delay: 20 }); await p.waitForTimeout(900);
  await p.tap('#m-sch-loc + .place-suggest .ps-item'); await p.waitForTimeout(600);
  R.filled = await p.evaluate(() => [document.getElementById('m-sch-loc').value, document.getElementById('m-sch-addr').value].join('|'));
  R.memo = await p.evaluate(() => document.getElementById('m-sch-venue').innerText.replace(/\s+/g, ' ').trim());
  await p.tap('#m-sch-dep'); await p.fill('#m-sch-dep', ''); await p.type('#m-sch-dep', '상암동 1605', { delay: 20 }); await p.waitForTimeout(900);
  await p.tap('#m-sch-dep + .place-suggest .ps-item'); await p.waitForTimeout(200);
  R.dep = await p.evaluate(() => document.getElementById('m-sch-dep').value);
  R.split = await p.evaluate(() => JSON.stringify(KakaoAPI.splitPlace('문화콘텐츠센터 (상암동 1605)')));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
