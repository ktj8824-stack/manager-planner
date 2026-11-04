const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 430, height: 1100 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept('지하 2층 B구역 주차 · 출연자 출입구 정문 오른쪽'));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(500);
  await p.evaluate(() => {
    const store = [{ id: 'v1', place_key: 'a:서울마포구성암로267', place_label: 'MBC 상암 신사옥', note: '대기실 5층 · 엘리베이터 B', author_id: 'other', author_name: '최현석 매니저', created_at: '2026-11-03T05:00:00Z' }];
    window.__store = store;
    const q = (table) => { const st = { f: [] }; const api = {
      select() { return api; }, in(k, v) { st.f.push(r => v.includes(r[k])); return api; }, eq(k, v) { st.f.push(r => r[k] === v); return api; },
      order() { return api; }, limit() { return Promise.resolve({ data: store.filter(r => st.f.every(f => f(r))), error: null }); },
      insert(row) { store.push({ ...row, id: 'v' + (store.length + 1), created_at: new Date().toISOString() }); return Promise.resolve({ error: null }); },
      delete() { return { eq: (k, v) => { const i = store.findIndex(r => r[k] === v); if (i >= 0) store.splice(i, 1); return Promise.resolve({ error: null }); } }; } }; return api; };
    window.SupabaseClient.client = { from: q }; window.SupabaseClient.currentUser = { id: 'me' };
    localStorage.setItem('bp_user_name', '박진우 팀장');
    const events = [
      { time: '12:50', title: '[현장 이동] 현장(MBC 상암)으로 출발', isHQ: true, hqScheduleId: 's1', timelineIdx: 2, done: false, location: 'MBC 상암 신사옥 (서울 마포구 성암로 267)', desc: '이동 약 45분 + 버퍼 10분 배정 (예상 소요 약 55분 · 11/7(토) 13:20 도착 기준 교통 예측)' },
      { time: '13:30', title: '[메인 일정] 음악중심 사전녹화', isHQ: true, hqScheduleId: 's1', timelineIdx: 3, done: false, location: 'MBC 상암 신사옥 (서울 마포구 성암로 267)' }
    ];
    const host = document.createElement('div'); host.id = 'probe'; host.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#f2f2f7;z-index:99999;padding:10px';
    host.innerHTML = Home.renderManagerRoute(events); document.body.appendChild(host);
  });
  await p.waitForTimeout(600);
  const before = await p.evaluate(() => document.getElementById('probe').innerText.replace(/\s+/g, ' ').slice(0, 500));
  await p.evaluate(() => VenueNotes.add('MBC 상암 신사옥 (서울 마포구 성암로 267)'));
  await p.waitForTimeout(500);
  const after = await p.evaluate(() => ({ text: [...document.querySelectorAll('[data-venue]')].map(e => e.innerText.replace(/\s+/g, ' ')).join(' || '), stored: window.__store.map(r => r.place_key + ' ' + r.note) }));
  console.log(before, '\n---\n', JSON.stringify(after, null, 1), errs);
  await p.screenshot({ path: require('os').tmpdir() + '/venue.png' }); await b.close();
})();
