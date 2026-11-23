// 11/24 지금 할 일 카드: [메인 일정] 시작~끝 사이면 '진행 중' (주황 테두리·배경은 그대로)
//  · 머리 아래 'HH:MM 끝 · 다음 출발 HH:MM' 한 줄 → 티맵·카카오내비(항상 보임) → [완료] 순서 · 담당자 전화·문자 줄은 이때만 숨김
//  · 시작 전·끝난 뒤(안 누름)는 원래 카드 그대로 ('지남' 알약 · 담당자 줄)
const { chromium, devices } = require('playwright');
const BASE = process.argv[2];
const block = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const out = {};
  for (const [key, hm] of [['during', '10:40'], ['before', '08:00'], ['after', '11:45']]) {
    const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({ time: new Date(`2026-11-24T${hm}:00+09:00`) });
    await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
    await block(p);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000);
    await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
    out[key] = await p.evaluate(async () => {
      try { AutoNav._watchTick = () => {}; AutoNav.cancel(); } catch (e) { }
      hqStore.saveSchedules(hqStore.getSchedules().filter(s => s.date !== '2026-11-24'));
      hqStore.buildTimelineCapped = async s => hqStore.generateAutoTimeline(s);
      const base = { artistId: 'ALL', managerId: '', status: '예정', date: '2026-11-24' };
      await hqStore.saveSchedule({ ...base, id: 'ip_s1', title: '화보 촬영', category: 'shooting', startTime: '09:30', endTime: '11:30', location: '청담 스튜디오 A', locationAddress: '서울 강남구 도산대로 450', departure: { place: '청담동 숙소', address: '서울 강남구 청담동 1' }, contactName: '이PD', contactPhone: '010-1111-2222' });
      await hqStore.saveSchedule({ ...base, id: 'ip_s2', title: '광고 촬영', category: 'shooting', startTime: '13:00', endTime: '15:00', location: '성수 포토스튜디오', locationAddress: '서울 성동구 성수이로 77', departure: { place: '청담 스튜디오 A', address: '서울 강남구 도산대로 450', chained: true } });
      const s1 = hqStore.getSchedules().find(x => x.id === 'ip_s1');
      const mi = s1.timeline.findIndex(t => /^\[메인 일정\]/.test(t.label || ''));
      s1.timeline.forEach((t, i) => { if (i < mi) { t.done = true; t.doneAt = t.time; } });
      hqStore.saveSchedules(hqStore.getSchedules().map(x => x.id === s1.id ? s1 : x));
      const s2 = hqStore.getSchedules().find(x => x.id === 'ip_s2');
      const s2dep = (s2.timeline.find(t => /^\[(픽업|현장 이동)/.test(t.label || '') || /출발/.test(t.label || '')) || {}).time || '';
      Home.selectedDate = new Date(); Home.render();
      await new Promise(r => setTimeout(r, 500));
      const c = document.querySelector('.now-card');
      if (!c) return { card: false };
      const kids = [...c.children].map(e => e.classList.contains('nc-endline') ? 'line' : e.classList.contains('nc-navs') ? 'navs' : e.classList.contains('nc-acts') ? 'acts' : e.classList.contains('nc-contact') ? 'contact' : '');
      const line = c.querySelector('.nc-endline');
      const pill = c.querySelector('.now-late');
      const ls = line ? getComputedStyle(line) : null, ps = pill ? getComputedStyle(pill) : null;
      return {
        kicker: c.querySelector('.nc-kicker').textContent.trim(),
        late: c.classList.contains('late'),
        pill: pill ? pill.textContent.trim() : '',
        line: line ? line.textContent.trim() : '',
        nextOk: line ? line.textContent.includes('다음 출발 ' + s2dep) : null,
        sameColor: line ? ls.color === ps.color && ls.backgroundColor === ps.backgroundColor : null,
        navs: c.querySelectorAll('.nc-navs .nc-nav').length,
        contact: !!c.querySelector('.nc-contact'),
        order: kids.filter(Boolean).join('>'),
        done: [...c.querySelectorAll('.nc-acts button')].map(x => x.textContent.trim()).join('|')
      };
    });
    await ctx.close();
  }
  console.log(JSON.stringify(out));
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
