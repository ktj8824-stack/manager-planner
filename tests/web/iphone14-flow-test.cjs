// 아이폰 14 크기: 아래 메뉴·주간 띠·누르는 곳 44px·글씨 13px·빠진 칸 표시·등록→이동 순서·길게 눌러 내일로 복사
const { chromium, devices } = require('playwright');
const SP = require('os').tmpdir() + '/rp_';
(async () => {
  const B = process.argv[2] || process.env.BASE_DEMO; const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 14'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('dialog', d => d.accept());
  await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.goto(B + '/index.html'); await p.waitForTimeout(1200);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1800);
  const audit = (sel) => p.evaluate((sel) => {
    const root = document.querySelector(sel) || document.body;
    const vis = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    const t = [...root.querySelectorAll('button, a[href], [onclick], input:not([type=hidden]), select, label[for], [role=switch]')].filter(vis)
      .filter(el => !(el.tagName === 'INPUT' && el.style.opacity === '0'));
    const small = t.filter(el => { const r = el.getBoundingClientRect(); const lab = el.closest('label'); const rr = lab ? lab.getBoundingClientRect() : r; return Math.max(r.height, rr.height) < 44 || Math.max(r.width, rr.width) < 44; });
    const texts = [...root.querySelectorAll('*')].filter(e => vis(e) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0));
    const fs = texts.map(e => parseFloat(getComputedStyle(e).fontSize));
    return { targets: t.length, small: small.length, smallList: small.slice(0, 10).map(e => `${(e.innerText || e.value || e.getAttribute('aria-label') || e.tagName).trim().slice(0, 12)} ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`), texts: fs.length, minFont: Math.min(...fs), under13: fs.filter(x => x < 13).length, under14pct: Math.round(100 * fs.filter(x => x < 14).length / Math.max(1, fs.length)) };
  }, sel);
  const R = {};
  R.home = await audit('#screen-home');
  R.nav = await p.evaluate(() => { const n = document.getElementById('bottom-nav'); const r = n.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), vh: innerHeight, items: [...n.querySelectorAll('.bnav-item')].map(b => b.innerText.trim() + ' ' + Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)) }; });
  R.week = await p.evaluate(() => { const w = document.getElementById('week-strip'); const t = document.getElementById('timeline-area'); return { weekDays: w.querySelectorAll('button[aria-pressed]').length, timelineWidth: Math.round(t.getBoundingClientRect().width), vw: innerWidth }; });
  await p.screenshot({ path: SP + 'e2e_1_home.png' });
  // 등록 화면(전체 화면 Register)
  await p.evaluate(() => App.navigate('register')); await p.waitForTimeout(500);
  R.register = await audit('#screen-register');
  R.secretLabel = await p.evaluate(() => /비공개 \(현장 스태프에게 안 보임\)/.test(document.getElementById('screen-register').innerText));
  await p.evaluate(() => { document.getElementById('r-search').value = ''; Register.course = null; });
  await p.tap('#r-submit'); await p.waitForTimeout(700);
  R.regErr = await p.evaluate(() => { const i = document.getElementById('r-search'); const m = document.querySelector('#screen-register .field-err-msg'); const r = i.getBoundingClientRect(); return { red: !!i.closest('.field-err'), msg: m && m.textContent, inView: r.top >= 0 && r.bottom <= innerHeight }; });
  await p.screenshot({ path: SP + 'e2e_2_register_error.png' });
  // 홈 → + 스케줄 추가 (등록 창)
  await p.evaluate(() => { Register.editIdx = null; App.navigate('home'); }); await p.waitForTimeout(500);
  await p.evaluate(() => { const t = new Date(); t.setDate(t.getDate() + 1); Home.selectDate(t.getFullYear(), t.getMonth(), t.getDate()); Home.setTab('timeline'); }); await p.waitForTimeout(400);
  await p.evaluate(() => Home.openScheduleRegisterModal()); await p.waitForTimeout(500);
  R.modal = await audit('#app-modal');
  await p.tap('#m-sch-submit'); await p.waitForTimeout(600);
  R.modalErr = await p.evaluate(() => { const i = document.getElementById('m-sch-title'); const m = document.querySelector('#app-schedule-form .field-err-msg'); return { red: i.style.borderColor, msg: m && m.textContent }; });
  await p.screenshot({ path: SP + 'e2e_3_modal_error.png' });
  await p.fill('#m-sch-title', '뮤직뱅크 사전녹화');
  await p.fill('#m-sch-start', '13:00');
  await p.fill('#m-sch-loc', 'KBS 신관');
  await p.fill('#m-sch-addr', '서울 영등포구 여의공원로 13');
  await p.fill('#m-sch-dep', '서울 강남구 압구정로79길 19');
  await p.tap('#m-sch-submit'); await p.waitForFunction(() => !document.getElementById('app-modal'), null, { timeout: 15000 });
  R.saved = await p.evaluate(() => !document.getElementById('app-modal'));
  await p.evaluate(() => Home.setTab('timeline')); await p.waitForTimeout(500);
  R.timeline = await p.evaluate(() => { const txt = document.getElementById('timeline-area').innerText; return { hasTitle: txt.includes('뮤직뱅크 사전녹화'), steps: (txt.match(/\d{2}:\d{2}/g) || []).slice(0, 8).join(' '), tab: /이동 순서/.test(document.getElementById('screen-home').innerText), future: /당일에 표시|당일에 출발/.test(txt) }; });
  await p.screenshot({ path: SP + 'e2e_4_timeline.png', fullPage: false });
  // 길게 누르기 → 내일로 복사
  const card = await p.$('[data-hold-sch]');
  R.holdCard = !!card;
  if (card) {
    await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const bb = await card.boundingBox();
    await p.mouse.move(bb.x + 30, bb.y + 20); await p.mouse.down(); await p.waitForTimeout(800); await p.mouse.up(); await p.waitForTimeout(300);
    R.holdMenu = await p.evaluate(() => /내일로 복사/.test(document.getElementById('app-modal')?.innerText || ''));
    await p.screenshot({ path: SP + 'e2e_5_hold.png' });
    if (R.holdMenu) {
      await p.tap('#app-modal button:has-text("내일로 복사")'); await p.waitForFunction(() => !document.getElementById('app-modal'), null, { timeout: 15000 }); await p.waitForTimeout(400);
      R.copied = await p.evaluate(() => document.getElementById('timeline-area').innerText.includes('뮤직뱅크 사전녹화'));
      R.copiedDate = await p.evaluate(() => `${Home.selectedDate.getMonth() + 1}/${Home.selectedDate.getDate()}`);
    }
  }
  await p.evaluate(() => App.navigate('profile')); await p.waitForTimeout(600);
  R.profile = await audit('#screen-profile');
  await p.screenshot({ path: SP + 'e2e_6_profile.png' });
  console.log(JSON.stringify(R)); console.log('errs', errs.slice(0, 5));
  await b.close();
})();
