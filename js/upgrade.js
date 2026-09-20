/* =========================================
   BuddyPlanner v2 — Upgrade Screen
   ========================================= */

const Upgrade = {
  init() {
    this.render();
  },

  render() {
    const el = U.$('#screen-upgrade');
    if (!el) return;

    el.innerHTML = `
      <div class="header" style="background:transparent; border-bottom:none; position:absolute; width:100%; z-index:10;">
        <button class="header-btn" onclick="App.navigate('profile')" style="background:rgba(0,0,0,0.3); border-color:rgba(255,255,255,0.1);">
          <svg viewBox="0 0 24 24" style="stroke:#fff;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      <div class="screen-scroll" style="padding-top:0;">
        <div class="upgrade-hero">
          <div class="upg-crown">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor"><path d="M2 19h20v2H2v-2zm19-11c-.55 0-1 .45-1 1v4l-3-2-2 3-3-4-3 4-2-3-3 2v-4c0-.55-.45-1-1-1s-1 .45-1 1v7h20V9c0-.55-.45-1-1-1zM7 6c.83 0 1.5-.67 1.5-1.5S7.83 3 7 3s-1.5.67-1.5 1.5S6.17 6 7 6zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 3 17 3s-1.5.67-1.5 1.5S16.17 6 17 6zm-5-2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
          </div>
          <h2 class="upg-title">매니저플래너 PRO</h2>
          <p class="upg-subtitle">빈틈없는 아티스트 케어와 완벽한 동선 관리</p>
          <div class="upg-price-box">
            <div class="upg-price">₩4,900 <span>/ 월</span></div>
          </div>
        </div>

        <div class="upg-content">
          <h3 class="upg-feature-title">PRO 멤버십 혜택</h3>
          <div class="feat-list">
            <div class="feat-item stag">
              <div class="feat-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg></div>
              <div class="feat-text">
                <h4>무제한 아티스트 & 스케줄</h4>
                <p>등록 개수 제한 없이 담당 아티스트의 모든 스케줄을 계획하세요.</p>
              </div>
            </div>
            <div class="feat-item stag">
              <div class="feat-icon blue"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.5 19c-2.485 0-4.5-2.015-4.5-4.5v-1.043c0-1.802 1.34-3.327 3.125-3.488A4.502 4.502 0 0 1 22 14.5c0 2.485-2.015 4.5-4.5 4.5zM2 14.5c0 2.485 2.015 4.5 4.5 4.5h.5A4.5 4.5 0 0 0 11.5 14.5v-1.043C11.5 11.655 10.16 10.13 8.375 9.97A4.502 4.502 0 0 0 2 14.5z"></path></svg></div>
              <div class="feat-text">
                <h4>야외 촬영/공연 초정밀 날씨</h4>
                <p>야외 세트장, 뮤비, 페스티벌 현장의 시간대별 실시간 기상과 미세먼지 예보를 제공합니다.</p>
              </div>
            </div>
            <div class="feat-item stag">
              <div class="feat-icon purple"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></div>
              <div class="feat-text">
                <h4>단톡방 스케줄 브리핑 원클릭 생성</h4>
                <p>아티스트 및 스태프 공지용 맞춤 텍스트(시간/픽업/장소/의상)를 자동 완성합니다.</p>
              </div>
            </div>
            <div class="feat-item stag">
              <div class="feat-icon green"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg></div>
              <div class="feat-text">
                <h4>광고 완벽 제거 & 긴급 관제 알림</h4>
                <p>모든 화면에서 광고가 제거되며 본사 긴급 스케줄 및 배차 알림을 최우선 수신합니다.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="upg-action">
          <button class="btn-upg" onclick="Upgrade.startPayment()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
            월 4,900원 결제하기
          </button>
          <p style="text-align:center; font-size:var(--fs-xs); color:var(--text-400); margin-top:var(--sp-4);">결제 후 즉시 프리미엄 혜택이 적용됩니다.<br>언제든 구독을 해지할 수 있습니다.</p>
        </div>
      </div>
    `;
    
    // Trigger animations
    setTimeout(() => U.stagger(el, '.feat-item', 100), 50);
  },

  startPayment() {
    App.showModal('결제 진행', `
      <div class="pay-loader">
        <div class="pay-spinner"></div>
        <div class="pay-msg">안전하게 결제를 진행 중입니다...</div>
        <p style="font-size:var(--fs-sm); color:var(--text-400); margin-top:var(--sp-2);">창을 닫지 마세요.</p>
      </div>
    `);

    // Simulate PG payment delay (3 seconds)
    setTimeout(() => {
      this.completePayment();
    }, 2500);
  },

  completePayment() {
    // 1. Mark user as PRO in localStorage
    localStorage.setItem('bp_pro', 'true');
    State.isPro = true;

    // 2. Show Success Modal
    App.showModal('결제 완료', `
      <div class="pay-success">
        <div class="pay-success-icon">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h3>결제 성공!</h3>
        <p>이제 매니저플래너 PRO 회원이십니다.<br>모든 프리미엄 혜택을 누려보세요.</p>
        <button class="btn-primary" style="width:100%; margin-top:var(--sp-4);" onclick="App.closeModal(); App.navigate('profile');">확인</button>
      </div>
    `);
  }
};
