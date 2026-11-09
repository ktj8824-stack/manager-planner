// 본사 웹 시안: 오늘 현황 6칸(지연 맨 앞) · 월간 3줄+n개 더 · 보기 탭 5개 그려짐 · 기능 창은 오른쪽 패널 · 신규 동선 미리보기 · 공지 앱 미리보기 · 지연 기준 설정
const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(base + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '공진문'); });
  await p.goto(base + '/admin.html'); await p.waitForTimeout(1200);
  // 오늘 일정 하나를 30분 전 단계 미확인으로 → 지연
  await p.evaluate(async () => {
    await hqStore.seedDemoData();
    const d = new Date(); const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hm = (m) => { const t = new Date(Date.now() + m * 60000); return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`; };
    const list = hqStore.getSchedules(); const s = list[0]; const m = hqStore.getManagers()[2];
    Object.assign(s, { date: ymd, startTime: hm(60), endTime: hm(120), managerId: m.id, managerName: m.name, timeline: [{ time: hm(-30), label: '[픽업 출발] 숙소 픽업', done: false }, { time: hm(60), label: '[메인 일정] 테스트', done: false }] });
    for (let i = 1; i <= 4; i++) { const c = list[i]; Object.assign(c, { date: ymd, startTime: hm(200 + i * 10), timeline: [] }); }
    hqStore.saveSchedules(list);
  });
  await p.reload(); await p.waitForTimeout(1500);
  const R = {};
  R.kpi = await p.evaluate(() => { const t = [...document.querySelectorAll('.tb-tile.v2')]; return { n: t.length, first: t[0]?.querySelector('.tb-l')?.textContent, hot: t[0]?.classList.contains('hot'), sub: !!t[0]?.querySelector('.tb-s')?.textContent }; });
  R.month = await p.evaluate(() => { const c = document.querySelector('.mv2-cell.today'); return { rows: c.querySelectorAll('.mv2-ev').length, more: c.querySelector('.mv2-more')?.textContent || '', legend: !!document.querySelector('.mv2-legend') }; });
  R.sideStatus = await p.evaluate(() => [...document.querySelectorAll('#manager-status-list .sb-st.late')].length >= 1);
  R.views = {};
  for (const v of ['week', 'gantt', 'kanban', 'map', 'analytics']) {
    await p.click(`.view-tab-btn[data-view="${v}"]`); await p.waitForTimeout(500);
    R.views[v] = await p.evaluate((v) => !!document.querySelector({ week: '.wv2-ev', gantt: '.gv2-bar.late', kanban: '.kb2-card.late', map: '.mp2-ctl', analytics: '.an2-kpi' }[v]), v);
  }
  await p.click('.view-tab-btn[data-view="month"]'); await p.waitForTimeout(300);
  // 신규 스케줄: 오른쪽 패널 + 동선 미리보기
  await p.click('#btn-open-add-schedule'); await p.waitForTimeout(500);
  await p.fill('#form-title', '테스트 방송');
  await p.waitForTimeout(400);
  R.newPanel = await p.evaluate(() => { const r = document.querySelector('#modal-schedule-form > .modal-content').getBoundingClientRect(); const pv = document.getElementById('sch-route-preview'); return { right: Math.round(r.right) === innerWidth, tall: r.height >= innerHeight - 2, preview: !pv.hidden && pv.querySelectorAll('li').length >= 2, side: !!pv.closest('#sch-side') && pv.getBoundingClientRect().left > document.getElementById('form-title').getBoundingClientRect().right }; });
  await p.evaluate(() => document.querySelector('#modal-schedule-form [data-close]').click()); await p.waitForTimeout(300);
  // 긴급 공지 미리보기
  await p.evaluate(() => Admin.openSendMsgModal()); await p.waitForTimeout(300);
  await p.fill('#msg-title', '<b>x</b> 해외 투어'); await p.fill('#msg-content', '동선 점검'); await p.waitForTimeout(200);
  R.notice = await p.evaluate(() => { const c = document.querySelector('#msg-app-preview .msg-prev-card'); return { card: !!c, urgent: c?.classList.contains('urgent'), noXss: !document.querySelector('#msg-app-preview b b'), btn: document.querySelector('#form-send-message button[type=submit]').textContent }; });
  await p.evaluate(() => document.getElementById('modal-send-message').classList.remove('active'));
  // 패널 안쪽: 아티스트 줄 · 차량 요약 · 경비 승인 대기 · 아티스트 칩
  await p.evaluate(() => Admin.openArtistModal()); await p.waitForTimeout(500);
  R.artists = await p.evaluate(() => ({ rows: document.querySelectorAll('#artist-management-list .p2-row').length, search: !!document.getElementById('p2-artist-q'), title: document.querySelector('#modal-artist-management .p2-title h3')?.textContent }));
  await p.fill('#p2-artist-q', '루나'); await p.waitForTimeout(300);
  R.artistSearch = await p.evaluate(() => document.querySelectorAll('#artist-management-list .p2-row').length);
  await p.click('#artist-management-list .p2-row'); await p.waitForTimeout(500);
  R.artistDel = await p.evaluate(() => !!document.querySelector('#form-artist-add .p2-del'));
  await p.evaluate(() => document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')));
  await p.evaluate(() => Admin.openVehicleModal()); await p.waitForTimeout(500);
  R.vehicles = await p.evaluate(() => ({ sum: document.querySelectorAll('#vehicle-management-list .p2-sum > div').length, rows: document.querySelectorAll('#vehicle-management-list .p2-row').length }));
  await p.evaluate(() => document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')));
  R.expenses = await p.evaluate(() => { const H = HqExpenses; H.month = new Date().toISOString().slice(0, 7); H._modal().classList.add('active'); const ms = hqStore.getManagers(); H.items = [{ id: 'a', user_id: ms[2].id, date: H.month + '-02', category: 'fuel', amount: 1000, status: 'pending', memo: '<img src=x onerror=alert(1)>' }, { id: 'b', user_id: ms[3].id, date: H.month + '-03', category: 'meal', amount: 2000, status: 'approved' }]; H.draw(); const b = document.getElementById('hq-exp-body'); const r = { pend: b.querySelectorAll('.ex2-ok').length, done: b.querySelectorAll('.ex2-st.approved').length, noXss: !b.querySelector('img') }; H.close(); return r; });
  await p.click('#btn-open-add-schedule'); await p.waitForTimeout(500);
  R.chips = await p.evaluate(() => { const c = document.querySelectorAll('#form-artist-chips button'); c[1] && c[1].click(); return { n: c.length, synced: document.getElementById('form-artist').value === c[1]?.dataset.v }; });
  await p.evaluate(() => document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')));
  // 로드톡: 오른쪽 패널 + 지연 띠 + 공지로 올리기 / 매니저 칩
  R.talk = await p.evaluate(async () => { const C = window.Chat; C.available = () => true; C.isHq = () => true; C.refreshList = async () => { }; C._ensureAllRoom = async () => { }; C._askNotifyPermission = () => { }; C.st.rooms = []; await C.open(); await new Promise(r => setTimeout(r, 200)); const root = document.getElementById('chat-root'); const r = { panel: root.classList.contains('hq-talk'), notice: !!root.querySelector('.hq-talk-notice'), late: !!root.querySelector('.hq-talk-late') }; C.close(); return r; });
  await p.evaluate(() => Admin.openManagerModal()); await p.waitForTimeout(400);
  R.mgrChips = await p.evaluate(() => document.querySelectorAll('#manager-mgmt-list .mgr2-chip').length > 0 && !!document.querySelector('#manager-mgmt-list .mgr2-st.late'));
  await p.evaluate(() => document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')));
  // 설정: 지연 판단 기준
  await p.evaluate(() => Admin.openAdminSettingsModal()); await p.waitForTimeout(300);
  R.settings = await p.evaluate(() => ({ sel: document.getElementById('setting-late-min')?.value, counts: document.getElementById('setting-count-mgr')?.textContent, push: !!document.getElementById('setting-push-late') && !!document.getElementById('setting-push-evening') && !!document.getElementById('setting-push-device') }));
  await p.selectOption('#setting-late-min', '30');
  await p.evaluate(() => { window.location.reload = () => {}; }); // 저장 후 새로고침 막기
  await p.evaluate(() => Admin.saveAdminSettings()).catch(() => {}); await p.waitForTimeout(800);
  R.saved = await p.evaluate(() => localStorage.getItem('hq_late_minutes'));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
