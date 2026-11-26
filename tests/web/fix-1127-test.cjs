// 11/27 점검 R19: 본사가 앞 일정(녹화)의 끝 시각을 늦추면(15:30 → 16:30), 그 현장에서 이어서 출발하는 일정(라디오)의
//  동선도 다시 계산되는지 — 출발이 앞 일정 끝(16:30)으로 밀리고 '몇 분 늦음'이 붙고, 본사에 알림 한 줄
const { chromium } = require('playwright');
const BASE = process.argv[2];
const block = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Seoul' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-12-01T14:50:00+09:00') });
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await block(p);
  await p.goto(BASE + '/admin-login.html');
  await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '공진문'); });
  await p.goto(BASE + '/admin.html'); await p.waitForTimeout(2500);
  await p.evaluate(async () => {
    const base = { date: '2026-12-01', artistId: 'ALL', managerId: '', status: '확정', category: 'broadcast' };
    const a = { ...base, id: 'sch_t27_a', title: 'KBS 녹화', startTime: '10:00', endTime: '15:30', location: 'KBS 신관', locationAddress: '서울 영등포구 여의공원로 13', departure: { place: '숙소', address: '서울 용산구 독서당로 46' } };
    const c = { ...base, id: 'sch_t27_c', title: 'SBS 라디오', startTime: '17:00', endTime: '19:00', location: 'SBS 탄현', locationAddress: '경기 고양시 일산서구 고양대로 1120', departure: { place: 'KBS 신관', address: '서울 영등포구 여의공원로 13', chained: true, fromScheduleId: 'sch_t27_a' } };
    const l = hqStore.getSchedules().filter(s => s.date !== '2026-12-01'); l.push(a); hqStore.saveSchedules(l);
    c.timeline = hqStore.generateAutoTimeline(c); a.timeline = hqStore.generateAutoTimeline(a);
    const l2 = hqStore.getSchedules().filter(s => s.date !== '2026-12-01'); l2.push(a, c); hqStore.saveSchedules(l2);
  });
  const depOf = () => p.evaluate(() => { const s = hqStore.getSchedules().find(x => x.id === 'sch_t27_c'); const d = (s.timeline || []).find(x => /^\[현장 이동\]/.test(x.label)); return d ? d.time + '|' + /분 늦음/.test(d.desc || '') : ''; });
  const R = { before: await depOf() };
  await p.evaluate(() => Admin.openScheduleDetail('sch_t27_a')); await p.waitForTimeout(800);
  await p.click('#btn-edit-schedule'); await p.waitForTimeout(800);
  await p.evaluate(() => { document.getElementById('form-end-time').value = '16:30'; window.updateDisplayDateTimeTexts && updateDisplayDateTimeTexts(); });
  await p.evaluate(() => document.getElementById('form-schedule').requestSubmit());
  await p.waitForTimeout(3500);
  for (let i = 0; i < 3; i++) { if (!(await p.locator('#ask-back').count())) break; await p.locator('#ask-back .ask-ok').first().click({ timeout: 800 }).catch(() => {}); await p.waitForTimeout(1200); }
  await p.waitForTimeout(2500);
  R.after = await depOf();
  R.log = await p.evaluate(() => { const s = hqStore.getSchedules().find(x => x.id === 'sch_t27_c'); return ((s.statusLogs || [])[0] || {}).label || ''; });
  R.toast = await p.evaluate(() => [...document.querySelectorAll('.np-toast')].map(t => t.textContent).find(t => /이어서 출발하는 일정/.test(t)) || '');
  console.log(JSON.stringify(R));
  console.log('errs', JSON.stringify(errs.slice(0, 3)));
  await b.close();
})();
