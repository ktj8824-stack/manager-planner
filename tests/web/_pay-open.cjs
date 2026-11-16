// 출시 기념 무료 기간(js/site-config.js PROMO) 동안에도 '결제가 열린 뒤'의 무료/유료 구분을 시험하려고
// 페이지가 열리기 전에 결제 스위치를 켠 것처럼 만들어 줌. (실제 결제는 서버 payments 가 따로 막음)
//   const { payOpen } = require('./_pay-open.cjs'); await payOpen(ctx 또는 page);
async function payOpen(target) {
  await target.addInitScript(() => { window.__PAY_OPEN_TEST = true; });
}
module.exports = { payOpen };
