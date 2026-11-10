/* =========================================
   RoadPlanner — 개인 매니저 요금 (무료 / 유료 월 2만원)
   - 개인 매니저(indie_manager): 본사 없이 혼자 쓰는 계정. 로드톡·본사 연동 없음
   - 무료: 일정 등록·동선 계산·길안내 버튼, 기상·출발 알림, 아티스트 1명, AI 하루 3번
   - 유료: AI 하루 60번, 차 타면 자동 길안내, 교통 예측 출발시간(아침 재계산 포함), 아티스트 여러 명, 경비 기록
   - 회사 계정(대표·본사·매니저)은 회사 요금제를 따르므로 여기서 막지 않음
   - 실제 막는 곳: 아티스트 수·AI 횟수는 서버가 막고, 자동 길안내·교통 예측은 앱에서, 아침 교통 재계산은 서버(reminders)에서 막음
   ========================================= */

const Plan = {
  FEE: 20000,
  FREE_ARTISTS: 1,
  FREE_AI: 3,
  FEATURES: {
    ai: '로드비서 하루 60번',
    autonav: '차 타면 자동 길안내',
    traffic: '교통 예측 출발 시간',
    artists: '아티스트 여러 명',
    expenses: '경비 기록·정산',
  },

  isIndie() {
    try { return localStorage.getItem('bp_account') === 'indie'; } catch (e) { return false; }
  },

  proUntil() {
    try { return localStorage.getItem('rp_pro_until') || ''; } catch (e) { return ''; }
  },

  // 개인 매니저가 아니면 항상 true (회사 계정은 여기서 막지 않음)
  isPaid() {
    if (!this.isIndie()) return true;
    const t = Date.parse(this.proUntil());
    return Number.isFinite(t) && t > Date.now();
  },

  can(feature) { return this.isPaid() || !this.FEATURES[feature]; },

  // 서버(결제 서버)에서 유료 기간을 다시 받아 옴
  async refresh() {
    if (!this.isIndie()) return;
    try {
      const s = await window.SupabaseClient.invokePayments({ action: 'status' });
      if (s && s.proUntil) localStorage.setItem('rp_pro_until', s.proUntil);
      else localStorage.removeItem('rp_pro_until');
    } catch (e) { /* 연결이 안 되면 마지막으로 받은 값 유지 */ }
    try { window.Ads && Ads.sync(); } catch (e) { }   // 유료로 바뀌면 광고 바로 끄기
  },

  untilText() {
    const t = Date.parse(this.proUntil());
    if (!Number.isFinite(t) || t <= Date.now()) return '';
    const d = new Date(t);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}까지`;
  },

  // 다음 자동결제일 (유료 기간이 끝나는 날)
  nextBillText() {
    const t = Date.parse(this.proUntil());
    if (!Number.isFinite(t) || t <= Date.now()) return '';
    const d = new Date(t);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  },

  // 유료 기능을 눌렀을 때 안내 창
  upsell(feature) {
    const what = this.FEATURES[feature] || '이 기능';
    const list = Object.values(this.FEATURES).map(t => `<li style="margin:4px 0;">${t}</li>`).join('');
    App.showModal('유료 기능이에요', `
      <div style="padding:4px 2px; text-align:left;">
        <p style="font-size:15px; font-weight:700; color:var(--text-100); margin-bottom:10px;">‘${what}’은(는) 유료에서 쓸 수 있어요.</p>
        <div style="background:var(--bg-input); border-radius:12px; padding:12px 14px; margin-bottom:14px;">
          <div style="font-size:13px; font-weight:800; color:var(--accent); margin-bottom:4px;">월 ${this.FEE.toLocaleString()}원 · 부가세 포함 · 매달 자동결제</div>
          <ul style="font-size:14px; color:var(--text-200); padding-left:18px; margin:0;">${list}</ul>
        </div>
        <button class="btn-primary" style="width:100%; padding:14px; font-weight:800;" onclick="App.closeModal(); App.navigate('upgrade');">유료 알아보기</button>
        <button class="btn-secondary" style="width:100%; padding:12px; margin-top:8px;" onclick="App.closeModal()">나중에</button>
      </div>`);
  },

  // 유료 기능을 쓰기 전에 확인: 쓸 수 있으면 true, 아니면 안내 창을 띄우고 false
  require(feature) {
    if (this.can(feature)) return true;
    this.upsell(feature);
    return false;
  },
};
window.Plan = Plan;
