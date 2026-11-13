// CEO플래너에서 가져온 5가지: 이동 시간 학습 · 문자 초안 · 모두 확인 · 반복 일정 · 조정 요청
const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch();
  const errs = [];
  const route = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  const ymd = (d) => d.toISOString().slice(0, 10);

  /* ── 본사 웹: 학습·반복·문자 초안 ── */
  const p = await (await b.newContext({ viewport: { width: 1440, height: 940 } })).newPage();
  p.on('pageerror', e => errs.push('hq: ' + e.message)); p.on('dialog', d => d.accept().catch(() => { }));
  await route(p);
  await p.goto(base + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '공진문'); });
  await p.goto(base + '/admin.html'); await p.waitForTimeout(1500);
  await p.evaluate(async () => { await hqStore.seedDemoData(); }); await p.reload(); await p.waitForTimeout(1800);
  await p.evaluate(() => { KakaoAPI.geocode = async () => ({ x: 127, y: 37.5 }); TmapAPI.getRouteTimeAt = async () => 52; });
  // 지난 기록 3번: 청담동 숙소 → MBC, 퇴근 시간대에 실제 70~80분
  await p.evaluate(async () => {
    for (const [d, min] of [['2026-10-05', 70], ['2026-10-12', 80], ['2026-10-19', 75]]) {
      const s = await hqStore.saveSchedule({ title: '지난 녹화', date: d, startTime: '19:00', endTime: '21:00', location: 'MBC 상암', locationAddress: '서울 마포구 성암로 267', departure: { place: '청담동 숙소', address: '' }, shop: { needed: false } });
      const mv = new Date(`${d}T17:00:00+09:00`);
      await hqStore.updateSchedule(s.id, { timeline: [{ label: '[현장 이동] 청담동 숙소 → MBC', time: '17:00', movingAtIso: mv.toISOString(), doneAtIso: new Date(mv.getTime() + min * 60000).toISOString() }] });
    }
  });
  await p.click('#btn-open-add-schedule'); await p.waitForTimeout(700);
  const day = new Date(Date.now() + 3 * 864e5);
  await p.evaluate((ds) => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('form-date', ds); set('form-title', '주간 음악방송'); set('form-start-time', '19:00'); set('form-end-time', '21:00');
    set('form-location', 'MBC 상암'); set('form-location-address', '서울 마포구 성암로 267'); set('form-departure-place', '청담동 숙소'); }, ymd(day));
  await p.waitForTimeout(2600);
  const learn = await p.evaluate(() => document.querySelector('.sr-learn')?.innerText.replace(/\s+/g, ' '));
  // 반복: 매주 3번
  await p.selectOption('#form-repeat', 'weekly'); await p.fill('#form-repeat-count', '3'); await p.dispatchEvent('#form-repeat-count', 'input');
  await p.waitForTimeout(300);
  const hint = await p.evaluate(() => document.getElementById('sch-repeat-hint')?.innerText);
  await p.screenshot({ path: require('os').tmpdir() + '/hq-form.png' });
  await p.evaluate(() => { const ch = document.querySelector('#form-artist-chips button:not(.all)'); ch && ch.click(); });
  await p.click('#sch-side-submit'); await p.waitForTimeout(5000);
  const rep = await p.evaluate(() => { const l = hqStore.getSchedules().filter(x => x.title === '주간 음악방송'); return { n: l.length, dates: l.map(x => x.date).sort().join(','), oneSeries: new Set(l.map(x => x.series && x.series.id)).size === 1 && !!l[0].series, idx: l.map(x => x.series && x.series.idx).sort().join(','), tl: l.every(x => (x.timeline || []).length > 2) }; });
  // 첫 번째를 고치면 이후 것도 같이 (확인 창 → 예)
  const prop = await p.evaluate(async () => {
    const l = hqStore.getSchedules().filter(x => x.title === '주간 음악방송').sort((a, c) => a.date.localeCompare(c.date));
    const prev = JSON.parse(JSON.stringify(l[0])); const next = { ...JSON.parse(JSON.stringify(l[0])), startTime: '20:00', endTime: '22:00' };
    await hqStore.saveSchedule(next);
    const msg = await AdminRepeat.afterSave(prev, next, null, null);
    const after = hqStore.getSchedules().filter(x => x.title === '주간 음악방송').map(x => x.startTime).join(',');
    return { msg, after };
  });
  // 지우면 이후 것도 같이
  const del = await p.evaluate(async () => {
    const l = hqStore.getSchedules().filter(x => x.title === '주간 음악방송').sort((a, c) => a.date.localeCompare(c.date));
    const mid = JSON.parse(JSON.stringify(l[1]));
    await hqStore.deleteSchedule(mid.id);
    const msg = await AdminRepeat.afterDelete(mid);
    return { msg, left: hqStore.getSchedules().filter(x => x.title === '주간 음악방송').length };
  });
  // 시간 변경 → 현장 담당자 문자 초안
  const draft = await p.evaluate(() => {
    const prev = { title: '팬사인회', date: '2026-11-20', startTime: '14:00', location: 'KBS 신관 (서울 영등포구 여의공원로 13)', contactName: '김지훈 PD', contactPhone: '010-1234-5678', artistName: '루나스 (LUNAS)', managerName: '김태현', status: '확정' };
    const ok = DraftSheet.afterHqChange(prev, { ...prev, startTime: '15:00' });
    const t = document.getElementById('ds-text')?.value; DraftSheet.close();
    const none = DraftSheet.afterHqChange({ ...prev, contactName: '', contactPhone: '' }, { ...prev, startTime: '16:00', contactName: '', contactPhone: '' });
    return { ok, text: t && t.replace(/\n/g, ' / '), none, noPhone: !!document.getElementById('ds-back') };
  });
  // 본사 '확인할 것'에 조정 요청 → [확인했어요]
  const hqAdj = await p.evaluate(async () => {
    const s = hqStore.getSchedules().find(x => x.title === '주간 음악방송');
    await hqStore.addStatusLog(s.id, { label: '[조정 요청] 앞 일정과 30분 겹침', adjust: { need: true }, managerName: '김매니저' });
    window.dispatchEvent(new Event('focus'));
    return { stage: hqStore.adjustState(hqStore.getSchedules().find(x => x.id === s.id)).stage, id: s.id };
  });
  await p.evaluate(() => window.HqTodo && HqTodo.draw());
  const todo = await p.evaluate(async (id) => {
    const box = document.getElementById('hq-todo'); const it = (box && box._items || []).find(x => /조정 요청/.test(x.title));
    if (!it) return { shown: false, text: box && box.innerText.slice(0, 80) };
    await it.run();
    return { shown: true, act: it.act, stage: hqStore.adjustState(hqStore.getSchedules().find(x => x.id === id)).stage };
  }, hqAdj.id);
  console.log('hq:', JSON.stringify({ learn, hint, rep, prop, del, draft, hqAdj: hqAdj.stage, todo }));

  /* ── 매니저 앱: 문자 초안 · 모두 확인 · 조정 요청 ── */
  const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  q.on('pageerror', e => errs.push('app: ' + e.message)); q.on('dialog', d => d.accept().catch(() => { }));
  await route(q);
  await q.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await q.goto(base + '/index.html'); await q.waitForTimeout(900);
  const app = await q.evaluate(async () => {
    const hq = window.hqStore, M = '0276e6a7-8868-4d07-b1ea-ffaf3c599815';
    localStorage.setItem('bp_user_name', '김태현');
    Object.assign(window.SupabaseClient, { isConfigured: true, currentUser: { id: M }, currentProfile: { role: 'manager' },
      async createSchedule(r) { return { ...r }; }, async updateSchedule(id, r) { return { id, ...r }; } });
    const t = new Date(Date.now() + 864e5); const ds = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const a = await hq.saveSchedule({ title: '라디오 생방송', artistName: '루나스', date: ds, startTime: '12:00', endTime: '14:00', managerId: M, location: 'SBS 목동', departure: { place: '회사' } });
    const c = await hq.saveSchedule({ title: '팬사인회', artistName: '루나스', date: ds, startTime: '14:30', endTime: '17:00', managerId: M, location: '영등포 타임스퀘어', departure: { place: '회사' }, contactName: '박지은 팀장', contactPhone: '010-2222-3333' });
    await hq.updateSchedule(c.id, { timeline: [{ label: '[현장 이동] SBS → 타임스퀘어', time: '13:30' }, { label: '[메인 일정] 팬사인회', time: '14:30' }] });
    Home.selectedDate = new Date(ds + 'T12:00:00');
    const R = {};
    let html = Home.renderAdjustCards();
    R.card = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    await Home.askAdjust(c.id, a.id);
    R.asked = hq.adjustState(hq.getSchedules().find(x => x.id === c.id)).stage;
    R.askedCard = /본사 확인 기다리는 중/.test(Home.renderAdjustCards());
    await hq.seeAdjust(c.id);
    R.seenCard = /확인 중/.test(Home.renderAdjustCards());
    await hq.updateSchedule(c.id, { timeline: [{ label: '[현장 이동] SBS → 타임스퀘어', time: '14:20' }, { label: '[메인 일정] 팬사인회', time: '15:00' }] });
    R.doneCard = /조정됨/.test(Home.renderAdjustCards());
    await hq.updateSchedule(c.id, { timeline: [{ label: '[현장 이동] SBS → 타임스퀘어', time: '13:30' }, { label: '[메인 일정] 팬사인회', time: '14:30' }] });
    const probe = document.createElement('div'); probe.id = 'probe'; probe.style.cssText = 'position:fixed;inset:0;background:#f2f2f7;padding:16px;z-index:99998;overflow:auto';
    for (const s of [a, c]) await hq.addStatusLog(s.id, { label: '[일정 수정] 시작 13:00→14:00', managerName: '공진문 (본사)', ack: { need: true, managerId: M } });
    probe.innerHTML = Home.renderAckCards() + Home.renderAdjustCards(); document.body.appendChild(probe);
    await new Promise(r => setTimeout(r, 100));
    window.__shot = true;
    // 모두 확인
    for (const s of [a, c]) await hq.addStatusLog(s.id, { label: '[일정 수정] 시작 변경', managerName: '공진문 (본사)', ack: { need: true, managerId: M } });
    R.ackBefore = hq.getPendingAcks(M).length;
    R.ackBtn = /모두 확인했습니다 \(2건\)/.test(Home.renderAckCards());
    await Home.ackAll();
    R.ackAfter = hq.getPendingAcks(M).length;
    // 문자 초안 (지금 할 일 카드 · 지연 창)
    DraftSheet.forSchedule(c.id, 15);
    R.chips = [...document.querySelectorAll('.ds-chips button')].map(x => x.textContent).join('|');
    R.on = document.querySelector('.ds-chips .on')?.textContent;
    R.text = document.getElementById('ds-text')?.value.replace(/\n/g, ' / ');
    R.sms = !!document.querySelector('.ds-s');
    return R;
  });
  await q.screenshot({ path: require('os').tmpdir() + '/draft-sheet.png' });
  await q.evaluate(() => DraftSheet.close()); await q.screenshot({ path: require('os').tmpdir() + '/app-cards.png' });
  console.log('app:', JSON.stringify(app));
  console.log('errs', JSON.stringify(errs.slice(0, 5)));
  await b.close();
})();
