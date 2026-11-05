// 자정 넘김: 00:30 일정 출발 시각, 새벽 01:00(샵 경유) 일정의 전날 단계 순서·표시·알림 날짜
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 430, height: 1000 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); localStorage.setItem('bp_buffer_prep', '0'); });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(600);
  const out = await p.evaluate(async () => {
    const R = {};
    const t1 = window.hqStore.generateAutoTimeline({ title: '자정 생방송', date: '2026-11-27', startTime: '00:30', endTime: '02:00', location: 'KBS 신관' });
    R.depart0030 = t1[0].time; R.offs0030 = t1.map(s => s.dayOffset).join(',');
    const t2 = window.hqStore.generateAutoTimeline({ title: '새벽 공항 출국', date: '2026-11-27', startTime: '01:00', endTime: '03:00', location: '인천공항 T2', shop: { needed: true, name: '정샘물' } });
    R.raw = t2.map(s => s.time + '(' + s.dayOffset + ')').join(' ');
    // 옛 자료(dayOffset 없음)도 추론
    R.inferred = State.stepDayOffsets(t2.map(({ dayOffset, ...x }) => x), '01:00').join(',');
    // 순서: 날짜 차이까지 고려해 정렬되는지 (calculateDailyEvents 와 같은 정렬 키)
    const key = (e) => { const t = e.time.split(':'); return (e.dayOffset || 0) * 1440 + (+t[0]) * 60 + (+t[1]); };
    R.order = [...t2].sort((a, b) => key(a) - key(b)).map(s => s.time).join(' ');
    // 화면: '전날' 표시
    const evs = t2.map((s, i) => ({ time: s.time, title: s.label, dayOffset: s.dayOffset, isHQ: true, hqScheduleId: 'x', timelineIdx: i, done: false })).sort((a, b) => key(a) - key(b));
    const host = document.createElement('div'); host.innerHTML = Home.renderManagerRoute(evs); document.body.appendChild(host);
    R.badge = (host.innerText.match(/전날/g) || []).length;
    return R;
  });
  console.log(JSON.stringify(out), 'errs', errs.slice(0, 3));
  await b.close();
})();
