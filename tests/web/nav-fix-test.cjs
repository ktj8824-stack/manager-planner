const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => {
    const seen = [];
    RouteProxy.call = async (svc, params) => { seen.push(svc + ':' + params.query); if (svc === 'kakao_address' && params.query === '서울 마포구 성암로 267') return { documents: [{ address_name: '서울 마포구 상암동 1603', x: '126.8913', y: '37.5807' }] }; return { documents: [] }; };
    const urls = []; U._go = (u) => urls.push(u); U._launchApp = (u) => urls.push(u);
    await U.openNavigation('MBC 상암 신사옥 (서울 마포구 성암로 267)', '', 'tmap');
    await U.openNavigation('MBC 상암 신사옥 (서울 마포구 성암로 267)', '', 'kakao');
    // 같은 건물에 가게가 여러 개: 주소로 찾으면 다른 가게가 먼저 나와도 이름이 같은 곳으로
    RouteProxy.call = async (svc, params) => svc === 'kakao_keyword' && /서초대로74길/.test(params.query)
      ? { documents: [{ place_name: 'Tesla 강남 스토어', road_address_name: '서울 서초구 서초대로74길 49', x: '127.1111', y: '37.1111' }, { place_name: '강남아르누보씨티', road_address_name: '서울 서초구 서초대로74길 49', x: '127.0281', y: '37.4934' }] }
      : { documents: [] };
    U._navCache = {};
    await U.openNavigation('강남아르누보씨티 (서울 서초구 서초대로74길 49)', '', 'tmap');
    return { urls, seen: seen.length };
  });
  console.log(JSON.stringify(r, null, 1), errs); await b.close();
})();
