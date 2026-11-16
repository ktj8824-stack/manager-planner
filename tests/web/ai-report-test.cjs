// 로드비서 답변 신고 (구글 플레이 생성형 AI 정책): AI 답변마다 '신고' → 이유(선택) → rp_ai_reports 에 저장 → '신고함'
//   - 첫 인사·안내 말에는 신고 버튼 없음 (AI가 만든 답변에만)
//   - 저장할 때 질문·답변·이유만 보냄 (사진은 안 보냄)
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ ...devices['iPhone 14'] })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); window.__noAds = 1; });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.route('**/functions/v1/roadplanner-ai', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: '내일은 일정이 없어요.', actions: [], places: [], remaining: 9 }) }));
  await p.goto(process.argv[2] + '/index.html'); await p.waitForTimeout(1000);
  await p.tap('text=1초 둘러보기'); await p.waitForTimeout(1500);
  await p.tap('#bottom-nav [data-s="ai"]'); await p.waitForTimeout(300);
  await p.evaluate(() => {
    window.__ins = null; window.__toasts = []; U.toast = (m) => window.__toasts.push(m);
    Object.assign(window.SupabaseClient, { isConfigured: true, currentUser: { id: 'me-uuid' }, currentProfile: { name: '박진우 팀장' },
      client: { auth: { getSession: async () => ({ data: { session: { access_token: 'tok' } } }) },
        from: (t) => ({ insert: async (row) => { window.__ins = { t, row }; return { error: null }; } }) } });
    RoadAI._ready = false; RoadAI.init();
  });
  const R = {};
  R.welcomeBtn = await p.evaluate(() => document.querySelectorAll('.rpai-report').length);
  await p.fill('#rpai-input', '내일 일정 알려줘'); await p.tap('#rpai-send'); await p.waitForTimeout(700);
  R.btn = await p.evaluate(() => document.querySelector('.rpai-row.bot:last-child .rpai-report')?.textContent);
  await p.tap('.rpai-row.bot:last-child .rpai-report');
  await p.waitForSelector('#ask-in', { timeout: 4000 });
  R.title = await p.evaluate(() => document.querySelector('#ask-back h3')?.textContent);
  await p.fill('#ask-in', '틀린 정보예요'); await p.click('#ask-back .ask-ok'); await p.waitForTimeout(400);
  R.saved = await p.evaluate(() => window.__ins && { t: window.__ins.t, ...window.__ins.row });
  R.after = await p.evaluate(() => ({ btn: document.querySelector('.rpai-row.bot:last-child .rpai-report')?.textContent, toast: window.__toasts.join('|') }));
  await p.tap('.rpai-row.bot:last-child .rpai-report'); await p.waitForTimeout(200);
  R.again = await p.evaluate(() => window.__toasts[window.__toasts.length - 1]);
  console.log(JSON.stringify(R), 'errs', JSON.stringify(errs));
  await b.close();
})();
