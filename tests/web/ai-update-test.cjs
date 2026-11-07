// AI 비서 변경 카드: 본사는 [수정 창 열기] → 기존 스케줄 수정 창이 바뀐 시간으로 채워짐 / 매니저는 [본사에 요청] → 로드톡 열림
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  let reply = null, sentCtx = null;
  await p.route('**/functions/v1/roadplanner-ai', async r => { sentCtx = JSON.parse(r.request().postData()).context; await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(reply(sentCtx)) }); });
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(900);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  const R = {};
  // 앞으로 2주 안에 스케줄이 하나는 있도록 (데모 데이터 날짜와 무관하게)
  const target = await p.evaluate(async () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const s = { id: 'sch_ai_upd', title: 'AI변경시험 사전녹화', date: ymd, startTime: '19:00', endTime: '21:00', location: 'KBS 신관 공개홀', locationAddress: '서울 영등포구 여의공원로 13', artistId: 'ALL', artistName: '전체', category: 'music_show', status: '확정', shop: { needed: false }, departure: { place: '사옥', address: '' } };
    await window.hqStore.saveSchedule(s);
    window.SupabaseClient = window.SupabaseClient || {};
    Object.assign(window.SupabaseClient, { isConfigured: true, currentUser: { id: 'me' }, currentProfile: { name: '공진문' }, client: { auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) } } });
    localStorage.setItem('bp_user_role', 'ceo');
    App.navigate('ai'); RoadAI._ready = false; RoadAI.init();
    return ymd;
  });
  reply = (c) => { const it = c.upcoming.find(u => u.title === 'AI변경시험 사전녹화'); return { reply: '아래 카드에서 확인해 주세요.', actions: [{ type: 'update', idx: it.idx, new_start: '18:30', reason: '30분 당겨짐', before: { date: it.date, start: it.start, end: it.end, title: it.title, place: it.place } }], places: [], remaining: 8 }; };
  await p.fill('#rpai-input', '내일 사녹 6시 반으로 당겨졌어'); await p.tap('#rpai-send'); await p.waitForTimeout(700);
  R.ctxIdx = sentCtx.upcoming.every((u, i) => u.idx === i && /^\d{4}-\d\d-\d\d$/.test(u.date));
  R.card = await p.evaluate(() => { const c = document.querySelector('.rpai-card'); return c && c.innerText.includes('스케줄 변경') && c.innerText.includes('19:00') && c.innerText.includes('18:30') && c.innerText.includes('수정 창 열기'); });
  await p.tap('text=수정 창 열기'); await p.waitForTimeout(500);
  R.editForm = await p.evaluate(() => ({ title: document.getElementById('m-sch-title')?.value, start: document.getElementById('m-sch-start')?.value, submit: document.getElementById('m-sch-submit')?.textContent.trim() }));
  await p.evaluate(() => App.closeModal()); await p.waitForTimeout(300);
  R.done = await p.evaluate(() => document.querySelector('.rpai-card .rpai-btn.done')?.innerText || '');
  R.noNewSchedule = await p.evaluate(() => window.hqStore.getSchedules().filter(s => s.title === 'AI변경시험 사전녹화').length);
  // 매니저: 본사에 요청 → 로드톡 열림
  await p.evaluate(() => { localStorage.setItem('bp_user_role', 'manager'); window.__opened = 0; const o = App.openMessages; App.openMessages = function () { window.__opened++; }; });
  await p.fill('#rpai-input', '내일 사녹 6시 반'); await p.tap('#rpai-send'); await p.waitForTimeout(700);
  R.mgrBtn = await p.evaluate(() => { const cs = document.querySelectorAll('.rpai-card'); return cs[cs.length - 1].innerText.includes('본사에 요청'); });
  await p.evaluate(() => { const cs = document.querySelectorAll('.rpai-card'); cs[cs.length - 1].querySelector('.rpai-btn:not(.ghost)').click(); });
  await p.waitForTimeout(400);
  R.mgrOpened = await p.evaluate(() => window.__opened);
  console.log(JSON.stringify(R), 'errs', errs.slice(0, 3));
  await b.close();
})();
