const { chromium } = require('playwright');
(async () => { const base=process.argv[2];
 const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1440, height: 940 } })).newPage();
 const errs=[]; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept().catch(()=>{}));
 await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
 await p.goto(base + '/admin-login.html'); await p.evaluate(() => { localStorage.setItem('admin_bp_logged_in', 'true'); localStorage.setItem('admin_bp_user_role', 'ceo'); localStorage.setItem('admin_bp_user_name', '공진문'); });
 await p.goto(base + '/admin.html'); await p.waitForTimeout(1500);
 await p.evaluate(async () => { await hqStore.seedDemoData(); }); await p.reload(); await p.waitForTimeout(1800);
 // 교통 예측 흉내: 카카오 좌표 + 티맵 52분
 await p.evaluate(() => { window.__calls = 0; KakaoAPI.geocode = async () => ({ x: 127, y: 37.5 }); TmapAPI.getRouteTimeAt = async () => { window.__calls++; await new Promise(r => setTimeout(r, 600)); return 52; }; });
 await p.click('#btn-open-add-schedule'); await p.waitForTimeout(600);
 await p.evaluate(() => { const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
   const d = new Date(Date.now() + 3 * 864e5); set('form-date', d.toISOString().slice(0, 10)); set('form-title', '음악중심 사전녹화'); set('form-start-time', '14:00'); set('form-end-time', '18:00');
   set('form-location', 'MBC 상암'); set('form-location-address', '서울 마포구 성암로 267'); set('form-departure-place', '청담동 숙소'); });
 await p.waitForTimeout(700); const busy = await p.evaluate(() => document.querySelector('.sr-basis')?.className);
 await p.waitForTimeout(1800);
 const r = await p.evaluate(() => ({ basis: document.querySelector('.sr-basis')?.innerText, lead: document.querySelector('.sr-lead b')?.innerText, calls: window.__calls, btn: document.getElementById('sch-side-submit')?.innerText }));

 // 오른쪽 등록 버튼으로 저장 → 미리보기 동선 그대로 (추가 교통 조회 없음)
 const before = await p.evaluate(() => window.__calls);
 await p.evaluate(() => { const ch = document.querySelector('#form-artist-chips button:not(.all)'); ch && ch.click(); });
 await p.click('#sch-side-submit'); await p.waitForTimeout(2500);
 const saved = await p.evaluate((b0) => { const s = hqStore.getSchedules().find(x => x.title === '음악중심 사전녹화'); return { ok: !!s, move: s?.timeline?.find(t => /현장 이동/.test(t.label))?.desc?.slice(0, 12), extraCalls: window.__calls - b0, closed: !document.getElementById('modal-schedule-form').classList.contains('active') }; }, before);
 console.log(JSON.stringify({ busy, ...r, saved }), errs.slice(0, 3)); await b.close(); })();
