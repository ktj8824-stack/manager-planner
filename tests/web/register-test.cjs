// 앱 스케줄 등록: 가짜 출발지·샵 없음 / 담당 매니저 기본값 = 나 / 연타해도 1건 / 겹침 경고 / 결제 결과 주소
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const dialogs = []; p.on('dialog', d => { dialogs.push(d.message().split('\n')[0]); d.accept(); });
  await p.addInitScript(() => { sessionStorage.setItem('rp_splash_shown', '1'); localStorage.setItem('bp_user_role', 'manager'); });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().endsWith('.js') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await p.goto(process.env.BASE_PROD + '/index.html'); await p.waitForTimeout(700);
  const out = await p.evaluate(async () => {
    const R = {}; const ME = 'me-uuid';
    const saved = [];
    window.SupabaseClient.currentUser = { id: ME };
    const hq = window.hqStore;
    hq.getManagers = () => [{ id: 'boss', name: '대표', role: 'ceo' }, { id: ME, name: '박매니저', role: 'manager', assignedArtists: ['a2'] }];
    hq.getArtists = () => [{ id: 'a1', name: '루나스' }, { id: 'a2', name: '에이펙스' }];
    hq.getVehicles = () => [{ id: 'v1', name: '카니발 1호', number: '12가3456' }];
    hq.getSchedules = () => [{ id: 'x1', date: '2030-01-05', startTime: '10:00', endTime: '12:00', title: '기존 촬영', vehicleId: 'v1', managerId: 'boss' }];
    hq.saveSchedule = async (s) => { saved.push(JSON.parse(JSON.stringify(s))); await new Promise(r => setTimeout(r, 300)); return s; };
    Home.selectedDate = new Date(2030, 0, 5);
    Home.openScheduleRegisterModal();
    const g = (id) => document.getElementById(id);
    R.mgrDefault = g('m-sch-mgr').value;
    R.artistOpts = [...g('m-sch-artist').options].map(o => o.textContent).join(',');
    R.shopDefault = g('m-sch-shop-name').value;
    g('m-sch-title').value = '음악중심'; g('m-sch-loc').value = 'MBC 상암';
    g('m-sch-start').value = '10:30'; Home._autoEnd('10:30'); R.autoEnd = g('m-sch-end').value;
    g('m-sch-veh').value = 'v1';
    const p1 = Home.submitScheduleFromModal(null), p2 = Home.submitScheduleFromModal(null);
    await Promise.all([p1, p2]);
    R.savedCount = saved.length;
    R.departure = saved[0] && saved[0].departure.place; R.shop = saved[0] && saved[0].shop.needed;
    R.mgrSaved = saved[0] && saved[0].managerId;
    return R;
  });
  out.dialogs = dialogs;
  // 결제 주소: ?가 두 번 들어가지 않는지
  const q = await ctx.newPage();
  await q.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => r.request().url().includes('tosspayments') ? r.fulfill({ status: 200, contentType: 'application/javascript', body: `window.__req=[];window.TossPayments=function(){return{widgets(){return{setAmount:async()=>{},renderPaymentMethods:async()=>{},renderAgreement:async()=>{},requestPayment:async(o)=>{window.__req.push(o)}}}}};window.TossPayments.ANONYMOUS='A';` }) : (r.request().url().endsWith('.js') || r.request().url().includes('supabase-js')) ? r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }) : r.abort());
  await q.goto(process.env.BASE_PROD + '/payment.html?plan=pro&totalFee=4900&company=100%25%EC%97%94%ED%84%B0&return=mobile');
  await q.waitForTimeout(400);
  out.pay = await q.evaluate(async () => {
    window.SupabaseClient.invokePayments = async () => ({ orderId: 'RP-PRO-1', amount: 4900, orderName: 'PRO' });
    await startPayment();
    const u = window.__req[0] && window.__req[0].successUrl;
    return { company: document.getElementById('pay-company-name').textContent, qmarks: (u.match(/\?/g) || []).length, phone: document.getElementById('buyer-phone').value };
  });
  console.log(JSON.stringify(out), 'errs', errs.slice(0, 3));
  await b.close();
})();
