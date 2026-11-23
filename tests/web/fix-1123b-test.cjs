// 11/23 점검 R15·R16 (두 번째): 본사 변경 한 줄 띠(서버 없이) → 누르면 '[변경 확인]' 기록 · 본사 상세 '매니저 확인' 태그
//  · 기상·준비를 안 눌렀어도 30분 안 출발이면 출발 카드가 위 · 기상·준비는 한 줄로
//  · 본사 저장 전 경고(이미 누른 단계) · 체험 모드 저장 문구 · [메인 일정] 공유 버튼 · 체험 모드 공유 안내
//  · 공유 받는 화면: 출발·픽업 줄 / [기상·준비]·[픽업 출발] 단계 숨김 · 장소 줄 · 메모(있을 때만, 글자 이스케이프)
const { chromium, devices } = require('playwright');
const BASE = process.argv[2];
const block = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
(async () => {
  const b = await chromium.launch();
  const errs = [];
  const out = {};
  // ── 1. 매니저 앱 ──
  {
    const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.clock.install({ time: new Date('2026-11-23T08:40:00+09:00') });
    await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
    await block(p);
    await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000);
    await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
    const R = await p.evaluate(async () => {
      const base = { id: 'sch_t_r15b', date: '2026-11-23', artistId: 'ALL', managerId: '', status: '예정', category: 'event', title: '드라마 촬영', startTime: '10:30', endTime: '19:00', location: 'MBC 드림센터', locationAddress: '경기 고양시 일산동구 한류월드로 281', departure: { place: '사옥', address: '서울 강남구' } };
      hqStore.saveSchedules(hqStore.getSchedules().filter(s => s.date !== '2026-11-23'));
      hqStore.buildTimelineCapped = async s => hqStore.generateAutoTimeline(s);
      await hqStore.saveSchedule({ ...base });
      const s = hqStore.getSchedules().find(x => x.id === base.id);
      // 출발을 09:02 로 맞춤 (지금 08:40 → 22분 뒤)
      const di = s.timeline.findIndex(x => /^\[(픽업|현장 이동)/.test(x.label || ''));
      s.timeline[di].time = '09:02';
      s.timeline.forEach((x, i) => { if (i < di && /^\[기상/.test(x.label || '')) x.time = '08:00'; });
      s.statusLogs = [{ id: 'log_hq1', time: '08:42', date: '2026-11-23', label: '[일정 수정] 시작 11:00→10:30', managerName: '김본부 (본사)', status: '예정', stepIdx: null }];
      hqStore.saveSchedules(hqStore.getSchedules().map(x => x.id === s.id ? s : x));
      Home.selectedDate = new Date(); App.navigate ? App.navigate('home') : 0; Home.render();
      await new Promise(r => setTimeout(r, 400));
      const band = document.querySelector('.chg-band');
      const card = document.querySelector('.now-card');
      const fold = document.querySelector('.prep-fold');
      const share = document.querySelector('.rs-share');
      const r = {
        band: band ? band.textContent.replace(/\s+/g, ' ').trim() : null,
        bandAboveNow: !!(band && card && (band.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)),
        nowKicker: card ? card.querySelector('.nc-kicker').textContent.trim() : null,
        nowTime: card ? card.querySelector('.nc-time').textContent.trim() : null,
        fold: fold ? fold.textContent.replace(/\s+/g, ' ').trim() : null,
        wakeInList: [...document.querySelectorAll('.rs .rs-tag')].some(t => /기상/.test(t.textContent)),
        shareBtn: !!share
      };
      // 띠 누름 → 기록 · 다시 안 보임
      band.click(); await new Promise(r => setTimeout(r, 400));
      const s2 = hqStore.getSchedules().find(x => x.id === base.id);
      r.log = s2.statusLogs[0].label + '|' + s2.statusLogs[0].ackOf;
      r.bandAfter = !!document.querySelector('.chg-band');
      // 체험 모드 공유
      const toasts = []; const t0 = U.toast; U.toast = (m) => { toasts.push(m); };
      await ScheduleShare.open(base.id); U.toast = t0;
      r.shareToast = toasts[0] || '';
      return r;
    });
    Object.assign(out, R);
    // FAB 가 마지막 단계 버튼을 가리지 않는지 (맨 아래까지 내렸을 때)
    out.fab = await p.evaluate(async () => {
      const sc = document.querySelector('.split-right'); sc.scrollTop = window.__fabTop ? 0 : sc.scrollHeight; await new Promise(r => setTimeout(r, 300));
      document.querySelector('.home-fab')?.classList.remove('away');
      const f = document.querySelector('.home-fab').getBoundingClientRect();
      const btns = [...document.querySelectorAll('#timeline-area button')].filter(x => x.offsetParent);
      return !btns.some(x => { const r = x.getBoundingClientRect(); return r.right > f.left && r.left < f.right && r.bottom > f.top && r.top < f.bottom; });
    });
    await ctx.close();
  }
  // ── 2. 본사: 저장 전 경고(취소하면 저장 안 함) · 체험 모드 문구 · 매니저 확인 태그 ──
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 940 }, timezoneId: 'Asia/Seoul' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    const dialogs = []; p.on('dialog', d => { dialogs.push(d.message()); d.accept().catch(() => { }); });
    await p.clock.install({ time: new Date('2026-11-23T08:44:00+09:00') });
    await block(p);
    await p.goto(BASE + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '김본부'); });
    await p.goto(BASE + '/admin.html'); await p.waitForTimeout(1500);
    await p.evaluate(async () => {
      hqStore.buildTimelineCapped = async s => hqStore.generateAutoTimeline(s);
      await hqStore.saveSchedule({ id: 'sch_hq_r15', date: '2026-11-23', artistId: 'ALL', managerId: '', status: '예정', category: 'event', title: '드라마 촬영', startTime: '11:00', endTime: '19:00', location: 'MBC 드림센터', locationAddress: '경기 고양시 일산동구 한류월드로 281', departure: { place: '사옥', address: '서울 강남구' } });
      const s = hqStore.getSchedules().find(x => x.id === 'sch_hq_r15');
      s.timeline[0].done = true; s.timeline[0].doneAt = '08:40';
      hqStore.saveSchedules(hqStore.getSchedules().map(x => x.id === s.id ? s : x));
    });
    const edit = async (answer) => {
      await p.evaluate(async (ans) => {
        window.__asks = []; Ask.confirm = async (m) => { window.__asks.push(m); return ans; };
        await Admin.openScheduleDetailModal('sch_hq_r15');
      }, answer);
      await p.waitForTimeout(500);
      await p.click('#btn-edit-schedule'); await p.waitForTimeout(700);
      await p.evaluate(() => { const e = document.getElementById('form-start-time'); e.value = '10:30'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); });
      await p.waitForTimeout(300);
      await p.evaluate(() => { const f = document.getElementById('form-schedule') || document.querySelector('#modal-schedule-form form'); f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event('submit', { cancelable: true })); });
      await p.waitForTimeout(2000);
      return p.evaluate(() => ({ ask: window.__asks.find(m => /매니저가 이미/.test(m)) || '', start: hqStore.getSchedules().find(x => x.id === 'sch_hq_r15').startTime, toasts: [...document.querySelectorAll('.np-toast')].map(t => t.textContent) }));
    };
    const cancel = await edit(false);
    await p.evaluate(() => { document.querySelectorAll('.modal-overlay.active, .active[id^="modal-"]').forEach(m => m.classList.remove('active')); });
    const ok = await edit(true);
    const R = await p.evaluate(async () => {
      const s = hqStore.getSchedules().find(x => x.id === 'sch_hq_r15');
      const chg = s.statusLogs.find(l => /^\[일정 수정\]/.test(l.label || ''));
      await hqStore.addStatusLog(s.id, { label: '[변경 확인] 08:45', ackOf: chg.id, managerName: '이매니저' });
      document.querySelectorAll('.active[id^="modal-"]').forEach(m => m.classList.remove('active'));
      await Admin.openScheduleDetailModal(s.id); await new Promise(r => setTimeout(r, 400));
      return { log: chg.label, tag: (document.querySelector('.ack-seen-tag') || {}).textContent || '' };
    });
    out.admin = { cancelAsk: cancel.ask, cancelKept: cancel.start, okStart: ok.start, ...R, saved: ok.toasts.concat(dialogs).find(m => /저장됐어요/.test(m)) || '' };
    await ctx.close();
  }
  // ── 3. 공유 받는 화면 (서버 응답 흉내) ──
  {
    const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
    const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message));
    await p.route('**/rest/v1/rpc/get_shared_schedule', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      title: '드라마 촬영', artist: '루나', date: '2026-11-23', start_time: '10:30', end_time: '19:00', location: 'MBC 드림센터', shop: '', departure: '청담 숙소 101동',
      memo: '<img src=x onerror=alert(1)>3층 대기실', timeline: [{ time: '08:00', label: '[기상·준비] 숙소' }, { time: '09:02', label: '[픽업 출발] 청담 숙소' }, { time: '10:20', label: '[현장 도착] MBC' }, { time: '10:30', label: '[메인 일정] 드라마 촬영' }],
      manager_name: '이매니저', manager_phone: '010-0000-0000', updated_at: '2026-11-23T08:42:00+09:00', expires_at: '2026-11-25T00:00:00+09:00' }) }));
    await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)(?!.*get_shared_schedule)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
    await p.goto(BASE + '/share.html?t=' + 'a'.repeat(64)); await p.waitForTimeout(1200);
    out.share = await p.evaluate(() => {
      const txt = document.getElementById('root').innerText;
      const first = document.querySelector('.card');
      return { dep: /출발·픽업|청담 숙소/.test(txt), wake: /기상/.test(txt), pickup: /픽업 출발/.test(txt), main: /메인 일정/.test(txt),
        loc: (first.querySelector('.sh-loc') || {}).textContent || '', memo: (first.querySelector('.sh-memo') || {}).textContent || '', xss: !!document.querySelector('#root img') };
    });
    await ctx.close();
  }
  console.log(JSON.stringify(out));
  console.log('errs', JSON.stringify(errs));
  await b.close();
})();
