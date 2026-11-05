// 결제: 서버가 금액·주문번호를 정하는지 / 결제 결과는 서버 승인 응답으로만 성공 / 알림 켜기 안내 카드
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.dismiss());
  const stub = (body) => (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body });
  await p.route(/^https?:\/\/(?!127\.0\.0\.1|localhost|0\.0\.0\.0)/, r => {
    const u = r.request().url();
    if (u.includes('tosspayments')) return stub(`window.__req=[];window.TossPayments=function(){return{widgets(){return{setAmount:async(a)=>{window.__amt=a.value},renderPaymentMethods:async()=>{},renderAgreement:async()=>{},requestPayment:async(o)=>{window.__req.push(o)}}}}};window.TossPayments.ANONYMOUS='A';`)(r);
    return u.endsWith('.js') || u.includes('supabase-js') ? stub('')(r) : r.abort();
  });
  const out = {};
  // 1) 결제 페이지: 주소에 금액을 1000원으로 조작해도 서버 금액으로 결제창이 열려야 함
  await p.goto(process.env.BASE_PROD + '/payment.html?addSlots=1&totalSlots=3&totalFee=1000');
  await p.waitForTimeout(400);
  out.pay = await p.evaluate(async () => {
    const calls = [];
    window.SupabaseClient.invokePayments = async (body) => { calls.push(body); return { orderId: 'RP-ENT-1', amount: 120000, orderName: '로드플래너 Enterprise (3명, 1개월)' }; };
    await startPayment();
    return { calls, amount: window.__amt, req: window.__req[0] && { orderId: window.__req[0].orderId, orderName: window.__req[0].orderName } };
  });
  // 2) 결과 페이지: 서버가 거절하면 실패 화면 (성공으로 바뀌지 않음)
  await p.addInitScript(() => { window.__fake = true; });
  await p.route('**/js/supabase-client.js*', r => r.fulfill({ status: 200, contentType: 'application/javascript',
    body: `window.SupabaseClient={isConfigured:true,init(){},invokePayments:async(b)=>{window.__conf=b; if(b.amount!==120000) throw new Error('결제 금액이 주문과 다릅니다.'); return {status:'DONE',plan:'standard',amount:120000,method:'카드',periodEnd:'2026-12-05T00:00:00Z'}}};` }));
  await p.goto(process.env.BASE_PROD + '/payment-result.html?paymentKey=pk1&orderId=RP-ENT-1&amount=5&totalFee=5&addSlots=1');
  await p.waitForTimeout(500);
  out.tampered = await p.evaluate(() => document.body.innerText.includes('결제 금액이 주문과 다릅니다') ? 'blocked' : document.body.innerText.slice(0, 80));
  await p.goto(process.env.BASE_PROD + '/payment-result.html?paymentKey=pk1&orderId=RP-ENT-1&amount=120000&totalFee=120000&addSlots=1');
  await p.waitForTimeout(500);
  out.ok = await p.evaluate(() => /결제 및 승인 완료/.test(document.body.innerText) ? 'success' : document.body.innerText.slice(0, 80));
  await p.unroute('**/js/supabase-client.js*');

  // 3) 매니저 앱 홈: 알림 꺼져 있으면 안내 카드
  const q = await ctx.newPage(); q.on('pageerror', e => errs.push(e.message));
  await q.addInitScript(() => sessionStorage.setItem('rp_splash_shown', '1'));
  await q.goto(process.env.BASE_PROD + '/index.html'); await q.waitForTimeout(800);
  out.push = await q.evaluate(async () => {
    window.SupabaseClient.currentUser = { id: 'u' };
    let enabled = 0;
    window.Chat.pushState = async () => enabled ? 'on' : 'off';
    window.Chat.enablePush = async () => { enabled = 1; return true; };
    const host = document.createElement('div'); host.innerHTML = Home.renderPushCard(); document.body.appendChild(host);
    await new Promise(r => setTimeout(r, 50));
    const shown = document.getElementById('home-push-card').innerText.includes('알림 켜기');
    await Home.enablePushFromCard(document.querySelector('#home-push-card button'));
    await new Promise(r => setTimeout(r, 50));
    const after = document.getElementById('home-push-card').innerText.trim();
    window.webkit = { messageHandlers: { roadplanner: {} } }; enabled = 0;
    await Home.fillPushCard();
    return { shown, afterOn: after === '', nativeHidden: document.getElementById('home-push-card').innerText.trim() === '' };
  });
  console.log(JSON.stringify(out), 'errs', errs.slice(0, 3));
  await b.close();
})();
