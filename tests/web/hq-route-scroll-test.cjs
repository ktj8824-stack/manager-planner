const { chromium } = require('playwright');
(async () => { const base=process.argv[2];
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
 const errs=[]; p.on('pageerror', e => errs.push(e.message));
 await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
 await p.goto(base + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); });
 await p.goto(base + '/admin.html'); await p.waitForTimeout(1500);
 await p.evaluate(async () => { await hqStore.seedDemoData(); }); await p.reload(); await p.waitForTimeout(1800);
 await p.evaluate(() => { KakaoAPI.geocode = async () => ({ x: 127, y: 37.5 }); TmapAPI.getRouteTimeAt = async () => 52; });
 await p.click('#btn-open-add-schedule'); await p.waitForTimeout(600);
 await p.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
   set('form-date', new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10)); set('form-start-time', '14:00'); set('form-location', 'MBC 상암'); set('form-departure-place', '청담동 숙소'); });
 await p.waitForTimeout(1800);
 const btnY0 = await p.evaluate(() => Math.round(document.getElementById('sch-side-submit').getBoundingClientRect().bottom));
 await p.mouse.move(700, 600); await p.mouse.wheel(0, 1500); await p.waitForTimeout(500);
 const r = await p.evaluate(() => { const f = document.getElementById('form-schedule'), side = document.getElementById('sch-side'), btn = document.getElementById('sch-side-submit');
   return { formScrolled: f.scrollTop > 200, sideTop: Math.round(side.getBoundingClientRect().top), btnBottom: Math.round(btn.getBoundingClientRect().bottom), vh: innerHeight, oldBtnHidden: getComputedStyle(document.querySelector('#form-schedule .form-actions')).display === 'none' }; });

 console.log(JSON.stringify({ btnY0, ...r }), errs.slice(0, 2)); await b.close(); })();
