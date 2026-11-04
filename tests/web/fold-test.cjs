const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 430, height: 1000 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(600);
  const info = await p.evaluate(() => {
    const events = [
      { time: '10:55', title: '[픽업 출발] 청담동 아티스트 숙소 픽업 및 출발', isHQ: true, hqScheduleId: 's1', timelineIdx: 0, done: true },
      { time: '11:20', title: '[헤어·메이크업] 정샘물 청담본점 도착 및 스타일링', isHQ: true, hqScheduleId: 's1', timelineIdx: 1, done: true },
      { time: '12:50', title: '[현장 이동] 현장(MBC 상암)으로 출발', isHQ: true, hqScheduleId: 's1', timelineIdx: 2, done: false, location: 'MBC 상암' },
      { time: '13:30', title: '[메인 일정] 음악중심 사전녹화', isHQ: true, hqScheduleId: 's1', timelineIdx: 3, done: false, location: 'MBC 상암' }
    ];
    const host = document.createElement('div'); host.id = 'probe'; host.style.cssText = 'position:fixed;inset:0;overflow:auto;background:#f2f2f7;z-index:99999;padding:10px';
    host.innerHTML = Home.renderManagerRoute(events); document.body.appendChild(host);
    return host.innerText.replace(/\s+/g, ' ').slice(0, 260);
  });
  console.log(info, errs);
  await p.screenshot({ path: require('os').tmpdir() + '/fold.png' }); await b.close();
})();
