// 본사 화면: 스케줄 상세 창이 떠 있을 때 마우스 휠로 뒤 화면이 움직이지 않음 (창 밖·창 안 끝까지 굴려도)
const { chromium } = require('playwright');
(async () => {
  const base = process.argv[2];
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1600, height: 820 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(base + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '테스트'); });
  await p.goto(base + '/admin.html'); await p.waitForTimeout(1500);
  await p.evaluate(async () => { await hqStore.seedDemoData(); });
  await p.reload(); await p.waitForTimeout(1500);
  // 모든 스크롤 가능한 요소의 위치 기록
  const snap = () => p.evaluate(() => { const o = { win: scrollY }; document.querySelectorAll('*').forEach((el, i) => { if (el.scrollTop > 0 && !el.closest('.modal-overlay')) o[(el.id || el.className || el.tagName).toString().slice(0, 30) + i] = el.scrollTop; }); return JSON.stringify(o); });
  const id = await p.evaluate(() => hqStore.getSchedules()[0].id);
  await p.evaluate(async (id) => { await openScheduleDetailModal(id); }, id); await p.waitForTimeout(500);
  const R = { open: await p.evaluate(() => !!document.querySelector('#modal-schedule-detail.active')) };
  const before = await snap();
  await p.mouse.move(150, 600); for (let i = 0; i < 8; i++) { await p.mouse.wheel(0, 400); await p.waitForTimeout(60); }   // 창 밖(왼쪽 메뉴 위)
  await p.mouse.move(800, 450); for (let i = 0; i < 15; i++) { await p.mouse.wheel(0, 400); await p.waitForTimeout(60); } // 창 안, 끝까지
  const after = await snap();
  R.bgStill = before === after;
  R.modalScrolls = await p.evaluate(() => { const m = document.querySelector('#modal-schedule-detail .modal-body'); return m ? m.scrollTop > 0 || m.scrollHeight <= m.clientHeight : false; });
  await p.evaluate(() => document.querySelector('#modal-schedule-detail [data-close]').click()); await p.waitForTimeout(400);
  const s0 = await p.evaluate(() => scrollY + (document.querySelector('.main-content')?.scrollTop || 0));
  await p.mouse.move(800, 450); await p.mouse.wheel(0, 600); await p.waitForTimeout(300);
  R.unlockedAfterClose = await p.evaluate((s0) => scrollY + (document.querySelector('.main-content')?.scrollTop || 0) !== s0 || document.documentElement.scrollHeight <= innerHeight, s0);
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
