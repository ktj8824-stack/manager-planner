const { chromium } = require('playwright');
const base = process.argv[2], label = process.argv[3];
const PAYLOAD = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 140)));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => r.request().url().endsWith('.js') || r.request().url().includes('supabase-js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await page.addInitScript(() => { window.__xss = 0; });
  await page.goto(base + '/admin-login.html', { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '테스트'); });
  await page.goto(base + '/admin.html', { waitUntil: 'load' }); await page.waitForTimeout(1500);
  if (!page.url().includes('admin.html')) { console.log('redirected to', page.url()); }
  // seed + inject payloads, then reload so every view renders from the poisoned data
  await page.evaluate(async (PAYLOAD) => {
    await hqStore.seedDemoData();
    const sch = hqStore.getSchedules(); sch.forEach((s) => ['title','location','notes','outfit','artistName','managerName','vehicleName'].forEach((k) => { s[k] = PAYLOAD; })); hqStore.saveSchedules(sch);
    const ar = hqStore.getArtists(); ar.forEach((a) => { a.name = PAYLOAD; }); hqStore.saveArtists(ar);
    const mg = hqStore.getManagers(); mg.forEach((m) => { m.name = PAYLOAD; }); hqStore.saveManagers(mg);
    const ve = hqStore.getVehicles(); ve.forEach((v) => { v.name = PAYLOAD; v.notes = PAYLOAD; }); hqStore.saveVehicles(ve);
  }, PAYLOAD);
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1500);
  const out = { url: page.url().split('/').pop(), views: {} };
  for (const v of ['month', 'week', 'gantt', 'kanban', 'map', 'analytics', 'month']) {
    try { await page.click(`[data-view="${v}"]`, { timeout: 3000 }); await page.waitForTimeout(500); } catch (e) { out.views[v] = 'click-ERR'; continue; }
    out.views[v] = await page.evaluate(() => {
      const t = document.body.innerText;
      return { html: document.body.innerHTML.length, rawTags: ['<span', '<div', '<svg', '<button'].filter((x) => t.includes(x)), payloadAsText: t.includes('<img') };
    });
  }
  // open detail modal of the first schedule card, then the management modals
  const tries = [
    ['openScheduleDetail', async () => { const c = await page.$('[onclick*="openScheduleDetail"]'); if (c) await c.click(); }],
    ['artistModal', async () => page.evaluate(() => Admin.openArtistModal())],
    ['managerModal', async () => page.evaluate(() => Admin.openManagerModal())],
    ['vehicleModal', async () => page.evaluate(() => Admin.openVehicleModal())],
    ['placeModal', async () => page.evaluate(() => Admin.openPlaceModal())],
    ['subscriptionModal', async () => page.evaluate(() => Admin.openSubscriptionModal())],
    ['sendMsgModal', async () => page.evaluate(() => Admin.openSendMsgModal())],
  ];
  out.modals = {};
  for (const [n, fn] of tries) {
    try { await fn(); await page.waitForTimeout(400); out.modals[n] = await page.evaluate(() => { const t = document.body.innerText; return { rawTags: ['<span', '<div', '<svg', '<button'].filter((x) => t.includes(x)) }; }); }
    catch (e) { out.modals[n] = 'ERR ' + String(e.message).slice(0, 70); }
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => document.querySelectorAll('.modal-overlay.active,.modal.active,[class*="modal"].show,[class*="modal"].open,[class*="modal"].active').forEach((e) => { e.classList.remove('active', 'show', 'open'); })).catch(() => {});
  }
  out.xss = await page.evaluate(() => window.__xss);
  out.pageErrors = errors.length; out.firstErrors = errors.slice(0, 3);
  console.log('==== ' + label + ' ====\n' + JSON.stringify(out));
  await browser.close();
})();
