// =========================================
// 로드플래너 주소 설정 — 도메인을 바꿀 때 여기 두 줄만 고치면 됩니다.
//   APP : 매니저 앱 주소 (manager-planner-app 저장소가 열리는 주소, 끝에 / 포함)
//   HQ  : 본사 관리자 주소 (manager-planner-web 저장소가 열리는 주소, 끝에 / 포함)
// 도메인 전환 때 함께 바꿀 곳은 DOMAIN_SWITCH.md 를 보세요.
// =========================================
window.SITE = Object.freeze({
  APP: 'https://app.roadplanner.kr/',
  HQ: 'https://hq.roadplanner.kr/',
  // 개발용 PC(localhost)에서는 같은 폴더의 파일을 씀
  isDev: ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:',
  app(path = '') { return this.isDev ? path || './' : this.APP + path; },
  hq(path = '') { return this.isDev ? (path || 'admin.html') : this.HQ + path; },
});

// =========================================
// 출시 기념 무료 기간 (마이·버디·CEO 플래너와 같은 날)
//   PAY_OPEN 이 false 인 동안은 결제를 받지 않고 회사·개인 매니저 모두 모든 기능을 씀.
//   날짜(UNTIL)는 안내용 — 날짜가 지나도 결제를 열기 전까지는 계속 무료이고, 안내는 '지금은 무료'로 바뀜.
//   결제를 열 때: 여기 PAY_OPEN 을 true 로 + 서버 app_settings 'pay_open' 을 'true' 로 (둘 다)
// =========================================
window.PROMO = Object.freeze({
  // 자동 시험에서 '결제가 열린 뒤'를 흉내낼 때만 window.__PAY_OPEN_TEST = true (실제 결제는 서버가 따로 막음)
  PAY_OPEN: window.__PAY_OPEN_TEST === true,
  UNTIL: '2027-03-31T23:59:59+09:00',
  FREE_EXTRA_SLOTS: 50,   // 무료 기간 매니저 인원: 기본 2 + 50 (유료 최대와 같음, 서버 manage-users 와 같은 숫자)
  isFree() { return !this.PAY_OPEN; },
  dated() { return Date.now() < Date.parse(this.UNTIL); },
  dateText() { const d = new Date(this.UNTIL); return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`; },
  // '2027년 3월 31일까지 무료' (날짜가 지났는데 결제를 아직 안 열었으면 '지금은 무료')
  text() { return this.dated() ? `${this.dateText()}까지 무료` : '지금은 무료'; },
  // 한 줄 안내
  line() { return this.dated() ? `출시 기념으로 ${this.dateText()}까지 모든 기능을 무료로 쓸 수 있어요.` : '지금은 모든 기능을 무료로 쓸 수 있어요.'; },
});
