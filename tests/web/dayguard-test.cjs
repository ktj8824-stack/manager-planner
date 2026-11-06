// 미래 날짜 일정: 이동중·완료 못 누름 / 지난 날짜: 완료만 / 오늘: 모두
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 430, height: 1000 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    const ymd = (k) => { const d = new Date(); d.setDate(d.getDate() + k); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const tl = () => [{ time: '09:00', label: '[픽업 출발] 숙소 픽업 및 출발' }, { time: '10:00', label: '[메인 일정] 녹화', done: true, doneAt: '22:21' }];
    const store = [{ id: 'F', date: ymd(2), startTime: '10:00', timeline: tl() }, { id: 'P', date: ymd(-2), startTime: '10:00', timeline: tl() }, { id: 'T', date: ymd(0), startTime: '10:00', timeline: tl() }];
    window.hqStore.getSchedules = () => store;
    let toast = ''; U.toast = (m) => { toast = m; };
    const R = {};
    for (const id of ['F', 'P', 'T']) {
      const sch = store.find(s => s.id === id);
      const [y, m, d] = sch.date.split('-').map(Number); Home.selectedDate = new Date(y, m - 1, d);
      const evs = sch.timeline.map((s, i) => ({ time: s.time, title: s.label, isHQ: true, hqScheduleId: id, timelineIdx: i, done: !!s.done, doneAt: s.doneAt }));
      const host = document.createElement('div'); host.innerHTML = Home.renderManagerRoute(evs); document.body.appendChild(host);
      const txt = host.innerText.replace(/\s+/g, ' ');
      R[id] = { move: (txt.match(/이동중/g) || []).length, wait: /당일/.test(txt), now: /지금 할 일/.test(txt), pastBanner: /지난 일정이에요/.test(txt), gray: host.querySelectorAll('.step-past').length, staleDone: /22:21 완료/.test(txt) };
      host.remove();
    }
    toast = ''; Home.setHQRouteStatus('F', 0, '완료'); R.futureToast = toast;
    toast = ''; Home.setHQRouteStatus('P', 0, '이동중'); R.pastMoveToast = toast;
    return R;
  });
  console.log(JSON.stringify(out), 'errs', errs.slice(0, 3));
  await b.close();
})();
