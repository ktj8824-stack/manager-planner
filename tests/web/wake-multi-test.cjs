// 하루 일정 2개: 기상·준비는 첫 일정 앞에 한 번만
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(600);
  const out = await p.evaluate(() => {
    const mk = (id, st, en, loc) => { const s = { id, title: id, date: '2030-03-04', startTime: st, endTime: en, location: loc }; s.timeline = window.hqStore.generateAutoTimeline(s); return s; };
    const list = [mk('오전 녹화', '10:00', '12:00', 'KBS'), mk('오후 행사', '17:00', '19:00', '코엑스')];
    State.getHQSchedulesForDate = (y, m, d) => (y === 2030 && m === 2 && d === 4) ? list.map(x => ({ ...x, timeline: x.timeline.map(t => ({ ...t })) })) : [];
    const ev = State.calculateDailyEvents(2030, 2, 4);
    const wakes = ev.filter(e => /^\[기상/.test(e.title || ''));
    return { perSchedule: list.map(s => s.timeline.filter(t => /^\[기상/.test(t.label)).length).join(','), wakeCount: wakes.length, wakeTime: wakes[0] && wakes[0].time, firstTitle: ev[0] && ev[0].title };
  });
  console.log(JSON.stringify(out), 'errs', errs.slice(0, 3));
  await b.close();
})();
