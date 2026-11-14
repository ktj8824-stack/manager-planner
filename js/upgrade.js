/* =========================================
   RoadPlanner — Upgrade Screen
   ========================================= */

const Upgrade = {
  init() {
    this.render();
  },

  render() {
    const el = U.$('#screen-upgrade');
    if (!el) return;
    const fee = Plan.FEE.toLocaleString();
    const paid = Plan.isIndie() && Plan.isPaid();
    // 회사 계정은 회사 요금제(본사 웹에서 결제)
    if (!Plan.isIndie()) {
      el.innerHTML = `<div class="header"><button class="header-btn" onclick="App.navigate('profile')"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button><h1 class="header-title">요금제</h1><div class="header-btn" style="visibility:hidden"></div></div>
        <div class="screen-scroll" style="padding:24px 20px; text-align:center; font-size:15px; color:var(--text-300); line-height:1.7;">회사 계정은 회사 요금제를 써요.<br>결제·인원 추가는 본사(대표·관리자)가 본사 웹에서 할 수 있어요.</div>`;
      return;
    }

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
          <h2 class="upg-title">개인 매니저 유료</h2>
          <p class="upg-subtitle">혼자서도 빈틈없는 동선 관리</p>
          <div class="upg-price-box">
            <div class="upg-price">₩${fee} <span>/ 월</span></div>
          </div>
          <div style="font-size:13px; color:var(--text-300); margin-top:10px; font-weight:600;">부가세 포함 · 매달 자동결제 · 언제든 해지</div>
        </div>

        <div class="upg-content">
          <h3 class="upg-feature-title">유료로 쓸 수 있는 기능</h3>
          <div class="feat-list">
            <div class="feat-item stag">
              <div class="feat-icon "><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 12h8M12 8v8"/></svg></div>
              <div class="feat-text">
                <h4>로드비서 하루 60번</h4>
                <p>말 한마디로 일정 등록·변경, 일정표 사진 읽기, 현장 주변 찾기 (무료는 하루 3번)</p>
              </div>
            </div>
            <div class="feat-item stag">
              <div class="feat-icon purple"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 17h14M6 17l1.5-6h9L18 17"/><circle cx="8" cy="19" r="1.5"/><circle cx="16" cy="19" r="1.5"/></svg></div>
              <div class="feat-text">
                <h4>차 타면 자동 길안내</h4>
                <p>CarPlay·블루투스에 연결되면 다음 일정 목적지로 내비가 바로 켜져요.</p>
              </div>
            </div>
            <div class="feat-item stag">
              <div class="feat-icon green"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div class="feat-text">
                <h4>교통 예측 출발 시간</h4>
                <p>일정 날짜·시간대의 실제 교통 예측(티맵)으로 출발·기상 시간을 계산해요. (무료는 거리 기준 추정)</p>
              </div>
            </div>
            <div class="feat-item stag">
              <div class="feat-icon "><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg></div>
              <div class="feat-text">
                <h4>아티스트 여러 명</h4>
                <p>담당 아티스트를 제한 없이 등록하세요. (무료는 1명)</p>
              </div>
            </div>
            <div class="feat-item stag">
              <div class="feat-icon green"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
              <div class="feat-text">
                <h4>경비 기록·정산</h4>
                <p>주유·주차·식비 영수증을 찍어 두면 월별 합계와 청구용 내역·엑셀이 바로 나와요.</p>
              </div>
            </div>
          </div>
          <p style="font-size:13px; color:var(--text-400); margin-top:14px; line-height:1.6;">일정 등록·동선 계산·길안내 버튼·기상·출발 알림은 무료로 계속 쓸 수 있어요.</p>
        </div>

        <div class="upg-action">
          ${paid ? `
            <div style="background:#ecfdf5; border-radius:14px; padding:14px 16px; text-align:center;">
              <div style="font-size:15px; font-weight:800; color:#047857;">유료 사용 중</div>
              <div style="font-size:13px; color:#065f46; margin-top:4px;">다음 결제일 ${esc(Plan.nextBillText())} · 매달 자동결제</div>
            </div>
            <p style="text-align:center; font-size:var(--fs-xs); color:var(--text-400); margin-top:var(--sp-4); line-height:1.6;">해지해도 ${esc(Plan.untilText())} 계속 쓸 수 있어요.</p>`
          : `
            <button class="btn-upg" onclick="Upgrade.startPayment()">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              월 ${fee}원 정기결제 시작
            </button>
            <p style="text-align:center; font-size:var(--fs-xs); color:var(--text-400); margin-top:var(--sp-4); line-height:1.6;">결제하면 바로 쓸 수 있어요. 매달 같은 날 자동으로 결제되고,<br>언제든 해지할 수 있어요. 해지해도 결제한 기간까지는 계속 쓸 수 있어요.</p>`}
        </div>
      </div>
    `;
    
    // Trigger animations
    setTimeout(() => U.stagger(el, '.feat-item', 100), 50);
  },

  // 중간 확인 창 없이 결제 페이지로 바로 이동 (동의·금액은 결제 페이지에서 확인)
  startPayment() {
    const userName = encodeURIComponent(localStorage.getItem('bp_user_name') || '');
    const userEmail = encodeURIComponent(localStorage.getItem('bp_user_email') || '');
    location.href = `payment.html?plan=pro&ceo=${userName}&email=${userEmail}&return=mobile`;
  }
};
