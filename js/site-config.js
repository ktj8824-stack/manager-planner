// =========================================
// 로드플래너 주소 설정 — 도메인을 바꿀 때 여기 두 줄만 고치면 됩니다.
//   APP : 매니저 앱 주소 (manager-planner-app 저장소가 열리는 주소, 끝에 / 포함)
//   HQ  : 본사 관리자 주소 (manager-planner-web 저장소가 열리는 주소, 끝에 / 포함)
// 도메인 전환 때 함께 바꿀 곳은 DOMAIN_SWITCH.md 를 보세요.
// =========================================
window.SITE = Object.freeze({
  APP: 'https://ktj8824-stack.github.io/manager-planner-app/',
  HQ: 'https://ktj8824-stack.github.io/manager-planner-web/',
  // 개발용 PC(localhost)에서는 같은 폴더의 파일을 씀
  isDev: ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:',
  app(path = '') { return this.isDev ? path || './' : this.APP + path; },
  hq(path = '') { return this.isDev ? (path || 'admin.html') : this.HQ + path; },
});
