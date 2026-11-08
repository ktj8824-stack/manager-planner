// 경비 기록: 앱(둘러보기=기기 저장) 등록·합계·일정 카드에서 열기·복사 / 개인 매니저 무료 잠금 / 본사 '경비 정산' 모아 보기·XSS
const { chromium, devices } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch();
  const R = {}; const errs = [];
  // ── 앱 ──
  const ctx = await b.newContext({ ...devices['iPhone 14'] });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
  const p = await ctx.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(base + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.evaluate(() => localStorage.removeItem('rp_expenses_local'));
  await p.tap('#bottom-nav [data-s="profile"]'); await p.waitForTimeout(400);
  await p.tap('text=경비 기록'); await p.waitForTimeout(500);
  R.screen = await p.evaluate(() => document.getElementById('screen-expenses').classList.contains('active') && document.querySelector('.exp-total-amt').innerText);
  await p.tap('.exp-add'); await p.waitForTimeout(400);
  await p.tap('.exp-cat-pick [data-c="fuel"]'); await p.fill('#exp-amount', '52000'); await p.fill('#exp-memo', '<img src=x onerror=alert(1)>주유');
  await p.press('#exp-memo', 'Enter'); await p.waitForTimeout(200);
  R.enterKeepsOpen = await p.evaluate(() => !!document.getElementById('exp-form'));
  await p.tap('#exp-save'); await p.waitForTimeout(600);
  await p.tap('.exp-add'); await p.waitForTimeout(400);
  await p.fill('#exp-amount', '3000'); await p.tap('#exp-save'); await p.waitForTimeout(600);
  R.total = await p.evaluate(() => document.querySelector('.exp-total-amt').innerText);
  R.cats = await p.evaluate(() => document.querySelector('.exp-cats').innerText.replace(/\s+/g, ' '));
  R.noXss = await p.evaluate(() => !document.querySelector('.exp-list img') && document.querySelector('.exp-list').innerText.includes('<img'));
  await p.tap('text=내역 복사 (청구용)'); await p.waitForTimeout(300);
  R.copy = await p.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  R.copy = /합계 55,000원 \(2건\)/.test(R.copy);
  // 수정 → 삭제
  await p.tap('.exp-item >> nth=0'); await p.waitForTimeout(400);
  await p.tap('text=삭제'); await p.waitForTimeout(500);
  R.afterDelete = await p.evaluate(() => document.querySelector('.exp-total-amt').innerText);
  // 일정 카드에서 열기 → 일정 미리 선택
  const sid = await p.evaluate(() => { const s = hqStore.getSchedules()[0]; Expenses.openForm(null, { scheduleId: s.id, date: s.date }); return s.id; });
  await p.waitForTimeout(400);
  R.fromSchedule = await p.evaluate((sid) => document.getElementById('exp-sch').value === sid, sid);
  await p.evaluate(() => App.closeModal()); await p.waitForTimeout(350);
  // 개인 매니저 무료: 잠금
  await p.evaluate(() => { localStorage.setItem('bp_account', 'indie'); localStorage.removeItem('rp_pro_until'); Expenses.open(); });
  await p.waitForTimeout(400);
  R.indieLocked = await p.evaluate(() => State.screen === 'vehicle' && !!document.querySelector('#screen-vehicle .art-add.locked') && !document.querySelector('#screen-vehicle #exp-body'));
  await ctx.close();
  // ── 본사 웹 ──
  const h = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  h.on('pageerror', e => errs.push(e.message));
  await h.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await h.goto(base + '/admin-login.html'); await h.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '테스트'); });
  await h.goto(base + '/admin.html'); await h.waitForTimeout(1500);
  await h.evaluate(() => {
    window.SupabaseClient = window.SupabaseClient || {};
    const mgr = (hqStore.getManagers() || [])[0];
    window.__m = mgr ? mgr.id : 'm1';
    SupabaseClient.expensesList = async () => [
      { id: 'e1', user_id: window.__m, date: '2026-11-03', category: 'parking', amount: 5000, memo: '<b>KBS</b>', receipt_path: 'x/1.jpg' },
      { id: 'e2', user_id: window.__m, date: '2026-11-05', category: 'fuel', amount: 60000, memo: '', receipt_path: null },
      { id: 'e3', user_id: 'other', date: '2026-11-06', category: 'meal', amount: 12000, memo: '', receipt_path: null }];
  });
  await h.click('#btn-open-expenses'); await h.waitForTimeout(500);
  R.hq = await h.evaluate(() => { const t = document.getElementById('hq-exp-body').innerText; return { open: document.getElementById('modal-hq-expenses').classList.contains('active'), total: t.includes('77,000원'), rows: document.querySelectorAll('#hq-exp-body tbody tr').length, noXss: !document.querySelector('#hq-exp-body tbody b') }; });
  await h.evaluate(() => HqExpenses.setFilter(window.__m)); await h.waitForTimeout(200);
  R.hqFilter = await h.evaluate(() => document.querySelectorAll('#hq-exp-body tbody tr').length + ' ' + document.getElementById('hq-exp-body').innerText.includes('65,000원'));
  await h.keyboard.press('Escape'); await h.waitForTimeout(200);
  R.hqClosed = await h.evaluate(() => !document.getElementById('modal-hq-expenses').classList.contains('active'));
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
