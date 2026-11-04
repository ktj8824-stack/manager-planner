// node app-test.cjs <baseUrl> <label>
const { chromium } = require('playwright');
const base = process.argv[2];
const label = process.argv[3];

const PAYLOAD = '<img src=x onerror="window.__xss=(window.__xss||0)+1">';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e.message).slice(0, 160)));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  // external hosts are not reachable here; keep the app offline-capable
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (r) => {
    const u = r.request().url();
    if (u.endsWith('.js') || u.includes('supabase-js')) return r.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    return r.abort();
  });
  await page.addInitScript(() => { window.__xss = 0; });
  await page.goto(base + '/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(800);

  const result = await page.evaluate(async (PAYLOAD) => {
    const out = { steps: [] };
    const step = async (name, fn) => { try { await fn(); out.steps.push(name + ': ok'); } catch (e) { out.steps.push(name + ': ERR ' + String(e && e.message).slice(0, 120)); } };
    await step('demoLogin', async () => { Login.demoLogin('ceo'); });
    await step('seed', async () => {
      await hqStore.seedDemoData();
      const sch = hqStore.getSchedules();
      sch.forEach((s) => {
        ['title', 'location', 'notes', 'outfit', 'artistName', 'managerName', 'vehicleName'].forEach((k) => { s[k] = PAYLOAD; });
        s.shopLocation = PAYLOAD;
      });
      hqStore.saveSchedules(sch);
      const ar = hqStore.getArtists(); ar.forEach((a) => { a.name = PAYLOAD; }); hqStore.saveArtists(ar);
      const mg = hqStore.getManagers(); mg.forEach((m) => { m.name = PAYLOAD; }); hqStore.saveManagers(mg);
      const ve = hqStore.getVehicles(); ve.forEach((v) => { v.name = PAYLOAD; v.notes = PAYLOAD; }); hqStore.saveVehicles(ve);
      out.counts = { schedules: sch.length, artists: ar.length, managers: mg.length, vehicles: ve.length };
    });
    const shots = {};
    const grab = (name) => {
      const el = document.querySelector('#screen-' + name);
      shots[name] = el ? { len: el.innerHTML.length, text: el.innerText.slice(0, 4000) } : null;
    };
    await step('home', async () => { App.navigate('home'); await new Promise((r) => setTimeout(r, 400)); grab('home'); });
    await step('home-open-first', async () => {
      const card = document.querySelector('#screen-home [onclick*="Home."]');
      if (card) { card.click(); await new Promise((r) => setTimeout(r, 300)); }
      grab('home');
    });
    await step('register', async () => { App.navigate('register'); await new Promise((r) => setTimeout(r, 400)); grab('register'); });
    await step('profile', async () => { App.navigate('profile'); await new Promise((r) => setTimeout(r, 300)); grab('profile'); });
    await step('timeline', async () => {
      if (!State.schedules || !State.schedules.length) State.schedules = hqStore.getSchedules();
      State.currentScheduleIdx = 0; App.navigate('timeline'); await new Promise((r) => setTimeout(r, 400)); grab('timeline');
    });
    await step('modal', async () => { U.showCalendarSyncModal && State.schedules[0] && U.showCalendarSyncModal(State.schedules[0]); await new Promise((r) => setTimeout(r, 200)); });
    out.xss = window.__xss;
    const all = document.body.innerHTML;
    out.rawTagText = {};
    for (const [k, v] of Object.entries(shots)) {
      if (!v) { out.rawTagText[k] = 'no-screen'; continue; }
      out.rawTagText[k] = ['<span', '<div', '<svg', '<button', '</'].filter((t) => v.text.includes(t));
    }
    out.visibleCounts = Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, v ? v.len : null]));
    out.escapedPayloadVisible = Object.fromEntries(Object.entries(shots).map(([k, v]) => [k, v ? (v.text.includes('<img') ? 'shows-as-text' : 'no-payload-text') : null]));
    out.modalTextHasRawTags = (document.querySelector('.modal-bg, .modal-overlay, .modal-panel') || {}).innerText ? ['<span', '<div', '<button'].filter((t) => document.querySelector('.modal-panel').innerText.includes(t)) : 'no-modal';
    return out;
  }, PAYLOAD);

  console.log('==== ' + label + ' ====');
  console.log(JSON.stringify(result, null, 1).slice(0, 2600));
  console.log('page errors:', errors.length, errors.slice(0, 4));
  await browser.close();
})();
