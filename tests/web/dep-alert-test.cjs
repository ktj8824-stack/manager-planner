const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.clock.install({ time: new Date('2026-10-25T11:12:00+09:00') }); await p.clock.resume();
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_DEMO + '/index.html'); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => {
    Login.demoLogin('ceo'); await hqStore.seedDemoData();
    localStorage.setItem('bp_user_role', 'manager'); window.SupabaseClient.currentUser = { id: 'mgr_2' };
    const native = []; window.webkit = { messageHandlers: { roadplanner: { postMessage: (m) => native.push(m) } } };
    const steps = AutoNav._myDriveSteps().map(s => s.ev.time + ' ' + s.ev.title);
    AutoNav._watchTick();
    // 미리 남겨 두는 '다음 일정' 알림: 없으면 올리고, 있으면 그대로, [출발] 누르면 지움
    const shown = [];
    const reg = { scope: location.origin + '/', showNotification: async (t, o) => shown.push({ t, tag: o.tag, url: o.data.url, close() { shown.splice(shown.indexOf(this), 1); } }), getNotifications: async () => shown.slice() };
    Object.defineProperty(navigator, 'serviceWorker', { value: { getRegistration: async () => reg }, configurable: true });
    Object.defineProperty(window, 'Notification', { value: { permission: 'granted' }, configurable: true });
    await AutoNav._keepNotice(); await AutoNav._keepNotice();
    const keep = shown.map(n => n.t + ' ' + n.tag.replace(/-[^-]+-/, '-X-') + ' ' + /go=next/.test(n.url));
    const first = AutoNav._myDriveSteps()[0];
    await AutoNav.clearNotice(first.ev.hqScheduleId || first.ev.id);
    return { keep, cleared: shown.length, steps: steps.slice(0, 3), box: document.getElementById('an-box')?.innerText.replace(/\s+/g, ' '), native: native[0] && native[0].items.slice(0, 2) };
  });
  console.log(JSON.stringify(r, null, 1), errs);
  await p.screenshot({ path: require('os').tmpdir() + '/dep-alert.png' }); await b.close();
})();
