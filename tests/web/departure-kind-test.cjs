// 11/18 점검: '해외 투어 / 출국' 분류의 공항 도착 여유 — 현지 공연장은 보통 일정, 귀국편 탑승은 공항 2시간 30분 전
//            본사 '확인할 것': 취소됨으로 남긴 내일 미배정 일정은 '담당 미지정'으로 세지 않음
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const k = (s) => [isDepartureSchedule(s), arriveBufferFor(s)].join('@');
    return {
      dome: k({ title: '도쿄돔 콘서트 리허설', category: 'overseas', location: '도쿄돔' }),
      narita: k({ title: '나리타 귀국편 KE704', category: 'overseas', location: '나리타 국제공항 제1터미널' }),
      out: k({ title: '출국 (도쿄 공연)', category: 'overseas', location: '인천국제공항 제1터미널' }),
      pickup: k({ title: '인천공항 입국 마중', category: 'overseas', location: '인천국제공항 제2터미널' }),
      returnPickup: k({ title: '아티스트 귀국', category: 'overseas', location: '인천국제공항' }),
      gimpoIntl: k({ title: '김포공항 국제선 출국', category: 'event', location: '김포국제공항' }),
      normal: k({ title: '뮤직뱅크', category: 'music_show', location: 'KBS 신관' }),
    };
  });
  console.log(JSON.stringify(r), 'errs', JSON.stringify(errs));
  const src = require('fs').readFileSync(require('path').join(__dirname, '../../js/admin-v2.js'), 'utf8');
  console.log('unassigned-cancel:', /!s\.managerId && !\['취소', 'cancelled'\]\.includes\(s\.status\)/.test(src));
  await b.close();
})();
