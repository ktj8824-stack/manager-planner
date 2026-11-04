const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const logs = []; p.on('console', m => { if (/로그인 실패|Error|error/.test(m.text())) logs.push(m.text().slice(0, 300)); }); p.on('pageerror', e => logs.push('PE ' + e.message));
  await p.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(800);
  const ROWS = require('./fixtures/rows.json');
  const r = await p.evaluate(async (ROWS) => {
    const M = '0276e6a7-8868-4d07-b1ea-ffaf3c599815';
    const sc = window.SupabaseClient;
    Object.assign(sc, { isConfigured: true,
      async signIn() { this.currentUser = { id: M, email: 'jw.park.test@kjm-ent.com' }; this.currentProfile = { id: M, name: '박진우 팀장', role: 'manager', company_id: 'c', companies: { name: 'KJM 엔터테인먼트' } }; return { user: this.currentUser, profile: this.currentProfile }; },
      async getArtists() { return []; }, async getVehicles() { return []; }, async getManagers() { return []; }, async getSchedules() { return ROWS; }, async getAnnouncements() { return []; },
      subscribeAll() { }, client: null });
    App.navigate('login'); await new Promise(r => setTimeout(r, 300));
    document.getElementById('login-email').value = 'jw.park.test@kjm-ent.com';
    document.getElementById('login-pw').value = 'Road2026!';
    await Login.handleEmailLogin({ preventDefault() { }, target: document.getElementById('form-supabase-login') });
    await new Promise(r => setTimeout(r, 500));
    return { err: document.getElementById('login-auth-error')?.textContent, role: localStorage.getItem('bp_user_role'), screen: document.querySelector('.screen.active')?.id };
  }, ROWS);
  console.log(JSON.stringify(r)); console.log(logs.join('\n'));
  await b.close();
})();
