const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); localStorage.setItem('bp_buffer_prep', '0'); });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    const calls = [];
    RouteProxy.call = async (svc, prm) => {
      calls.push(svc + (prm.at ? '@' + prm.at : ''));
      if (svc === 'kakao_keyword' || svc === 'kakao_address') return { documents: [{ place_name: prm.query, x: '127.0' + (prm.query.length % 9), y: '37.5' + (prm.query.length % 7) }] };
      if (svc === 'tmap_route_at') return { features: [{ properties: { totalTime: prm.at.endsWith('13:20') ? 2700 : 1500 } }] };
      if (svc === 'tmap_route') return { features: [{ properties: { totalTime: 1200 } }] };
      return null;
    };
    const tl = await hqStore.generateSmartTimelineAsync({ title: '음악중심', date: (() => { const d = new Date(Date.now() + 2 * 86400000); return d.toISOString().slice(0, 10); })(), startTime: '13:30', endTime: '18:00', location: 'MBC 상암 신사옥 (서울 마포구 성암로 267)', shop: { needed: true, name: '정샘물 청담본점', address: '서울 강남구 압구정로79길 19', durationMin: 90 }, departure: { place: '청담동 숙소', address: '서울 강남구 청담동 118' } });
    const past = await hqStore.generateSmartTimelineAsync({ title: '과거', date: '2026-11-01', startTime: '13:30', endTime: '15:00', location: '서울 마포구 성암로 267', shop: { needed: false }, departure: { place: '사옥', address: '서울 강남구 청담동 118' } });
    return { tl: tl.map(s => s.time + ' ' + s.label + ' | ' + s.desc).slice(0, 3), past: past[0].time + ' ' + past[0].desc, calls: calls.filter(c => c.startsWith('tmap')) };
  });
  console.log(JSON.stringify(r, null, 1), errs); await b.close();
})();
