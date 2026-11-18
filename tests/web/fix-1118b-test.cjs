// 11/18 점검 2차: 밤샘 퇴근 · 지금 할 일 카드 넘기기 · 이어서 출발 · 닫기 버튼 · 바뀐 시간 '전날' · 취소 카드 회색 줄
//                 · 본사 취소됨으로 남기기 · 취소 문자 초안 · 해외 투어 칩 · 국내선 50분
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const BASE = process.argv[2];
const block = (p) => p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
const ymdOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function appPage(b, at) {
  const ctx = await b.newContext({ ...devices['iPhone 14'], timezoneId: 'Asia/Seoul' });
  const p = await ctx.newPage();
  p.__errs = []; p.on('pageerror', e => p.__errs.push(e.message));
  if (at) await p.clock.install({ time: at });
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await block(p);
  await p.goto(BASE + '/index.html'); await p.waitForTimeout(1000);
  await p.evaluate(() => Login.demoLogin('ceo')); await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__toasts = []; U.toast = (m) => window.__toasts.push(m); });
  return p;
}
// 확인 창이 뜨면 제목·버튼을 적고 고른 버튼을 누름
async function answer(p, which = '.ask-ok') {
  await p.waitForSelector('#ask-back', { timeout: 6000 });
  const info = await p.evaluate(() => ({ h: (document.querySelector('#ask-back h3') || {}).textContent || '', btns: [...document.querySelectorAll('#ask-back button')].map(x => x.textContent.trim()).join('|') }));
  await p.click('#ask-back ' + which); await p.waitForTimeout(300);
  return info;
}

(async () => {
  const b = await chromium.launch();
  const R = {}; const errs = [];

  // 1. 밤샘 퇴근: 00:40 에도 버튼이 보이고 기록은 전날(11/18) / 오전 10시는 안 보임
  {
    const p = await appPage(b, new Date('2026-11-19T00:40:00+09:00'));
    R.r1 = await p.evaluate(() => {
      const shown = /퇴근합시다/.test(WorkEnd.homeHtml());
      U.openNavigation = () => { };
      WorkEnd.leave('home', { name: '집', address: '서울 강남구' });
      const rec = JSON.parse(localStorage.getItem('rp_workend'));
      return `${shown}|${rec.day}|${!!WorkEnd.today()}`;
    });
    await p.clock.setFixedTime(new Date('2026-11-19T10:00:00+09:00'));
    R.r1morning = await p.evaluate(() => { localStorage.removeItem('rp_workend'); return WorkEnd.homeHtml() === '' ? 'hidden' : 'shown'; });
    await p.clock.setFixedTime(new Date('2026-11-19T16:00:00+09:00'));
    R.r1pm = await p.evaluate(() => /퇴근합시다/.test(WorkEnd.homeHtml()) ? 'shown' : 'hidden');
    errs.push(...p.__errs); await p.context().close();
  }

  // 2. 지금 할 일: 같은 날 3곳, 버튼 안 눌러도 16:35 엔 세 번째 일정 단계
  {
    const p = await appPage(b, new Date('2026-11-18T16:35:00+09:00'));
    R.r2 = await p.evaluate(() => {
      Home.selectedDate = new Date();
      const ev = (time, title) => ({ time, title, done: false, moving: false, isHQ: false });
      const html = Home.renderManagerRoute([
        ev('06:19', '[기상·준비] 기상 및 외출 준비'), ev('07:19', '[현장 이동] 숙소 출발 및 이동'), ev('09:00', '[메인 일정] A 녹화'), ev('11:00', '[현장 철수] 일정 종료'),
        ev('11:30', '[현장 이동] B로 출발'), ev('13:00', '[메인 일정] B 인터뷰'), ev('15:00', '[현장 철수] 일정 종료'),
        ev('15:40', '[현장 이동] C로 출발'), ev('16:30', '[메인 일정] C 팬사인회'), ev('18:30', '[현장 철수] 일정 종료'),
      ]);
      const d = document.createElement('div'); d.innerHTML = html;
      const card = d.querySelector('.now-card');
      return card ? `${card.querySelector('.nc-time').textContent.trim()}|${card.querySelector('.nc-name').textContent.trim()}|${(card.querySelector('.now-late') || {}).textContent || ''}` : 'none';
    });
    errs.push(...p.__errs); await p.context().close();
  }

  const p = await appPage(b, null);
  const tmr = new Date(); tmr.setDate(tmr.getDate() + 1); const D = ymdOf(tmr);

  // 3. 이어서 출발: 앞 일정 현장으로 출발지 채움 · 기상 단계 없음 · 늦음 경고
  await p.evaluate((D) => {
    const me = hqStore.getManagers()[0];
    window.__mgr = me.id;
    const list = hqStore.getSchedules();
    list.push({ id: 'sch_chainA', title: '라디오 녹음', date: D, startTime: '13:00', endTime: '16:30', category: 'broadcast', location: '상암 MBC', locationAddress: '서울 마포구 성암로 267', status: '확정', managerId: me.id, artistId: 'ALL', timeline: [] });
    hqStore.saveSchedules(list);
    Home.openScheduleRegisterModal();
  }, D);
  await p.waitForSelector('#m-sch-dep');
  await p.evaluate((D) => {
    const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('change')); };
    set('m-sch-mgr', window.__mgr); set('m-sch-date', D); set('m-sch-start', '17:00');
    document.getElementById('m-sch-end').value = '19:00';
    document.getElementById('m-sch-title').value = '저녁 팬사인회';
    document.getElementById('m-sch-loc').value = 'KBS 신관'; document.getElementById('m-sch-addr').value = '서울 영등포구 여의공원로 13';
  }, D);
  R.r3fill = await p.evaluate(() => `${document.getElementById('m-sch-dep').value}|${document.getElementById('m-sch-chain-hint').textContent}`);
  await p.click('#m-sch-submit');
  const late = await answer(p);
  R.r3late = late.h;
  await p.waitForTimeout(1500);
  R.r3 = await p.evaluate(() => {
    const s = hqStore.getSchedules().find(x => x.title === '저녁 팬사인회');
    const plain = hqStore.generateAutoTimeline({ title: 'x', date: '2026-11-20', startTime: '17:00', endTime: '19:00', location: 'KBS', departure: { place: '숙소', address: '숙소' } });
    return { saved: !!s, chained: !!(s && s.departure && s.departure.chained), dep: s && s.departure.address, wake: s ? s.timeline.filter(x => /^\[기상/.test(x.label || '')).length : -1, plainWake: plain.filter(x => /^\[기상/.test(x.label || '')).length };
  });

  // 4·9. 매니저 앱 취소: [닫기] 버튼 · 현장 담당자 번호 있으면 문자 초안 물어봄
  await p.evaluate((D) => {
    const list = hqStore.getSchedules();
    list.push({ id: 'sch_c1', title: '야외 버스킹', date: D, startTime: '12:00', endTime: '14:00', category: 'event', location: '여의도 한강공원', status: '예정', artistId: 'ALL', artistName: '루나스', contactName: '김지훈 PD', contactPhone: '010-1234-5678', timeline: [] });
    list.push({ id: 'sch_c2', title: '실내 리허설', date: D, startTime: '15:00', endTime: '16:00', category: 'event', location: '홍대 공연장', status: '예정', artistId: 'ALL', timeline: [] });
    hqStore.saveSchedules(list);
    hqStore.updateSchedule = async (id, patch) => { const all = hqStore.getSchedules(); const s = all.find(x => x.id === id); Object.assign(s, patch); hqStore.saveSchedules(all); return s; };
    Home.deleteScheduleFromApp('sch_c1');
  }, D);
  const a4 = await answer(p, '.ask-extra'); R.r4 = a4.btns;
  await p.waitForSelector('#ask-in'); await p.fill('#ask-in', '우천 취소'); await p.click('#ask-back .ask-ok'); await p.waitForTimeout(500);
  const a9 = await answer(p); R.r9 = `${a9.h}|${a9.btns}`;
  R.r9sheet = await p.evaluate(() => { const t = document.getElementById('ds-text'); const r = t ? /취소/.test(t.value) : false; DraftSheet.close(); return r; });
  await p.evaluate(() => { Home.deleteScheduleFromApp('sch_c2'); });
  await answer(p, '.ask-extra');
  await p.waitForSelector('#ask-in'); await p.click('#ask-back .ask-ok'); await p.waitForTimeout(600);
  R.r9noPhone = await p.evaluate(() => !document.getElementById('ask-back') && hqStore.getSchedules().find(x => x.id === 'sch_c2').status === '취소');

  // 5. 바뀐 시간: 자정 전 단계는 '전날'
  R.r5 = await p.evaluate(() => Home.timeDiff(
    { date: '2026-11-19', startTime: '01:00', endTime: '03:00', timeline: [{ label: '[현장 이동] 숙소 출발', time: '23:25', dayOffset: -1 }] },
    { date: '2026-11-19', startTime: '02:00', endTime: '04:00', timeline: [{ label: '[현장 이동] 숙소 출발', time: '00:25', dayOffset: 0 }] }));

  // 6. 취소된 카드 왼쪽 줄 회색 (회사 일정표 카드)
  R.r6 = await p.evaluate((D) => {
    const [y, m, d] = D.split('-').map(Number);
    Home.selectedDate = new Date(y, m - 1, d); Home.currentTab = 'schedule'; Home.render();
    const h = document.getElementById('screen-home').innerHTML;
    const r = { grey: h.includes('border-left:4px solid #CBD5E1'), blue: h.includes('border-left:4px solid #3B45C4') };
    Home.currentTab = 'timeline';
    return r;
  }, D);

  // 10. 해외 투어 칩
  await p.evaluate(() => { App.closeModal(); Home.openScheduleRegisterModal(); });
  await p.waitForSelector('#m-sch-category');
  R.r10 = await p.evaluate(() => {
    const row = document.getElementById('m-sch-flight-row');
    const before = row.style.display;
    const c = document.getElementById('m-sch-category'); c.value = 'overseas'; c.dispatchEvent(new Event('change'));
    const after = row.style.display;
    row.querySelector('[data-flight="true"]').click();
    const v = document.getElementById('m-sch-flight').value;
    const k = (s) => `${isDepartureSchedule(s)}@${arriveBufferFor(s)}`;
    const pay = hqStore._schedulePayload({ title: 't', date: '2026-11-20', flight: true, departure: { place: '숙소', address: '숙소' } });
    return {
      row: `${before}>${after}`, v,
      domeFlight: k({ title: '도쿄돔 이동', category: 'overseas', location: '도쿄돔', flight: true }),
      naritaLocal: k({ title: '나리타 귀국편', category: 'overseas', location: '나리타 국제공항', flight: false }),
      noChip: k({ title: '나리타 귀국편', category: 'overseas', location: '나리타 국제공항' }),
      payload: pay.departure_info.flight === true && pay.departure_info.place === '숙소',
    };
  });
  await p.evaluate(() => App.closeModal());

  // 11. 국내선 50분
  R.r11 = await p.evaluate(() => {
    const k = (s) => `${arriveBufferFor(s)}`;
    const desc = (s) => { const tl = hqStore.generateAutoTimeline({ date: '2026-11-20', startTime: '10:00', ...s }); return (tl.find(x => /^\[메인/.test(x.label)) || {}).desc || ''; };
    return {
      jeju: k({ title: '제주 공연 이동 (국내선)', location: '김포공항' }),
      gimhae: k({ title: '김해공항 비행기 탑승', location: '김해국제공항' }),
      gimpoIntl: k({ title: '김포공항 국제선 출국', location: '김포국제공항' }),
      normal: k({ title: '뮤직뱅크', location: 'KBS 신관' }),
      desc: /공항 도착 \(국내선 수속 여유\)/.test(desc({ title: '제주항공 탑승', location: '김포공항 국내선' })),
    };
  });
  errs.push(...p.__errs);
  await p.context().close();

  // 8. 본사 웹 취소됨으로 남기기 (코드 확인 — 본사 화면 시험은 admin 쪽 시험에서 열림)
  const adm = fs.readFileSync(path.join(__dirname, '../../js/admin.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '../../admin.html'), 'utf8');
  R.r8src = /extraLabel: '🌧️ 취소됨으로 남기기 \(기록 유지\)'/.test(adm) && /status: '취소', notes:/.test(adm) && /ScheduleNotify\.afterSave\(cur, next\)/.test(adm) && /js\/ask\.js/.test(html);

  // 8. 본사 웹 실제 화면
  {
    const ctx = await b.newContext({ viewport: { width: 1400, height: 900 }, timezoneId: 'Asia/Seoul' });
    const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
    await block(q);
    await q.goto(BASE + '/admin-login.html'); await q.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '대표'); });
    await q.goto(BASE + '/admin.html'); await q.waitForTimeout(1500);
    const ok = await q.evaluate(async (D) => {
      if (!window.hqStore || !window.Admin) return 'no-admin';
      const list = hqStore.getSchedules();
      list.push({ id: 'sch_hq1', title: '야외 촬영', date: D, startTime: '12:00', endTime: '14:00', category: 'shooting', location: '남산', status: '예정', artistId: 'ALL', timeline: [], notes: '기존 메모' });
      hqStore.saveSchedules(list);
      window.__upd = []; hqStore.updateSchedule = async (id, patch) => { window.__upd.push(patch); const all = hqStore.getSchedules(); Object.assign(all.find(x => x.id === id), patch); hqStore.saveSchedules(all); };
      window.__notify = 0; if (window.ScheduleNotify) ScheduleNotify.afterSave = async () => { window.__notify++; return null; };
      window.Admin.currentDetailScheduleId = 'sch_hq1';
      const btn = document.getElementById('btn-delete-schedule'); if (!btn) return 'no-btn';
      btn.click(); return 'clicked';
    }, D);
    R.r8open = ok;
    if (ok === 'clicked') {
      const a = await answer(q, '.ask-extra'); R.r8btns = a.btns;
      await q.waitForSelector('#ask-in'); await q.fill('#ask-in', '우천'); await q.click('#ask-back .ask-ok'); await q.waitForTimeout(600);
      R.r8 = await q.evaluate(() => { const u = window.__upd[0] || {}; return `${u.status}|${/^\[취소 \d+\/\d+ \d\d:\d\d\] 우천\n기존 메모$/.test(u.notes || '')}|${window.__notify}`; });
      await q.evaluate(() => document.getElementById('btn-delete-schedule').click());
      const a2 = await answer(q, '.ask-extra'); R.r8again = a2.btns; await q.waitForTimeout(400);
      R.r8revive = await q.evaluate(() => (window.__upd[1] || {}).status);
    }
    await ctx.close();
  }

  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
