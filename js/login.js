/* =========================================
   RoadPlanner — Manager Login Screen
   (Supabase Auth & Multi-Manager Selection)
   ========================================= */

const Login = {
  async init() {
    this.render();
    this.initOAuth();
  },

  render() {
    const el = U.$('#screen-login');
    const isCloud = window.SupabaseClient && window.SupabaseClient.isConfigured;

    const chev = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    const back = `<button type="button" class="lg-back" onclick="Login.setTab('choose')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>다른 방법 고르기</button>`;
    const inputStyle = 'background:#efeff4; border:1px solid transparent; color:var(--text-100); height:50px; padding:0 14px; border-radius:12px; font-size:15px; width:100%; outline:none;';
    el.innerHTML = `
      <div class="login-container lg-wrap">
        <aside class="lg-side" aria-hidden="true">
          <div class="lg-side-top"><img src="icon.svg" alt=""><b>로드플래너</b></div>
          <div class="lg-side-mid">
            <h2>약속 시간에서 거꾸로,<br><em>오늘 동선이 먼저</em> 나와요</h2>
            <ul>
              <li><span>⏰</span><div><b>기상부터 철수까지 자동 계산</b>그날 교통 예측으로 출발 시각을 잡아요</div></li>
              <li><span>🚗</span><div><b>누르면 바로 길안내</b>티맵·카카오내비로 다음 장소까지</div></li>
              <li><span>🔔</span><div><b>늦을 것 같으면 먼저 알림</b>본사와 로드톡으로 바로 공유</div></li>
            </ul>
          </div>
          <div class="lg-side-foot">© 2026 로드플래너</div>
        </aside>
        <div class="lg-main">
        <div class="lg-head">
          <img src="icon.svg" alt="" class="lg-logo">
          <h1 class="login-title">로드플래너</h1>
          <p class="login-subtitle">현장 매니저를 위한 스케줄 · 동선 앱</p>
        </div>

        <!-- 1) 어떻게 쓰시나요? -->
        <div id="login-choose" class="lg-step">
          <h2 class="lg-h2">어떻게 쓰시나요?</h2>
          <button type="button" id="tab-b2b" class="lg-card" onclick="Login.setTab('b2b')">
            <span class="lg-ico" style="background:#EEF0FD; color:#3B45C4;"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10M8 7h4M8 11h4M8 15h4M2 21h20"/></svg></span>
            <span class="lg-txt"><b>회사에서 계정을 받았어요</b><small>소속 매니저 · 본사 일정과 로드톡이 연결돼요</small></span>${chev}
          </button>
          <button type="button" id="tab-b2c" class="lg-card" onclick="Login.setTab('b2c')">
            <span class="lg-ico" style="background:#ecfdf5; color:#047857;"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg></span>
            <span class="lg-txt"><b>혼자 일하는 매니저예요</b><small>개인 매니저 · 무료로 바로 시작해요</small></span>${chev}
          </button>
          <button type="button" id="demo-login-btn" ${Login.isDevHost() ? '' : 'hidden'} onclick="Login.demoLogin('ceo')" class="lg-demo">⚡ 테스트 대표 계정 1초 둘러보기 (데모)</button>
        </div>

        <!-- 2-1) 소속 매니저: 사내 계정 -->
        <div id="login-b2b-section" class="lg-step" style="display:none;">
          ${back}
          <h2 class="lg-h2">사내 계정으로 로그인</h2>
          <div class="lg-box">
            <form id="form-supabase-login" onsubmit="Login.handleEmailLogin(event)" style="display:flex; flex-direction:column; gap:12px;">
              <label class="lg-label">사내 이메일
                <input type="email" id="login-email" class="form-input" placeholder="name@company.com" autocomplete="${Login._fresh() ? 'off' : 'username'}" required style="${inputStyle}" /></label>
              <label class="lg-label">비밀번호
                <input type="password" id="login-pw" class="form-input" placeholder="비밀번호" autocomplete="${Login._fresh() ? 'new-password' : 'current-password'}" required style="${inputStyle}" /></label>
              <button type="submit" class="btn-social lg-primary">로그인</button>
            </form>
            <p id="login-auth-error" role="alert" aria-live="polite" style="display:none;color:#dc2626;font-size:14px;margin:4px 0 0;"></p>
            <div class="lg-hint">계정이 없다면 본사 담당자에게 요청하세요</div>
          </div>
        </div>

        <!-- 2-2) 개인 매니저: 카카오·구글 -->
        <div id="login-b2c-section" class="lg-step" style="display:none;">
          ${back}
          <h2 class="lg-h2">개인 매니저로 시작</h2>
          <div class="lg-box" style="gap:10px;">
            <button class="btn-social btn-kakao lg-primary" onclick="Login.doKakaoLogin()" style="background:#FEE500; color:#191600; box-shadow:none;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#191600" aria-hidden="true"><path d="M12 3C6.48 3 2 6.47 2 10.75c0 2.76 1.84 5.17 4.67 6.49-.15.54-.53 1.96-.6 2.27-.08.35.12.35.3.23.14-.09 1.94-1.32 2.75-1.89.92.26 1.88.4 2.88.4 5.52 0 10-3.47 10-7.75S17.52 3 12 3z"/></svg>
              카카오로 시작하기
            </button>
            <div id="google_btn_wrapper"></div>
            <div class="lg-hint">아티스트 1명까지 무료예요</div>
          </div>
        </div>

        <div class="lg-foot">
          <a href="${typeof U !== 'undefined' && U.getHQLoginUrl ? U.getHQLoginUrl() : 'admin-login.html'}" class="lg-hq">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>
            본사 관리자라면 관제 포털로
          </a>
          <div class="lg-legal"><a href="terms.html" target="_blank">이용약관</a> · <a href="privacy.html" target="_blank">개인정보처리방침</a> · <a href="location-terms.html" target="_blank">위치 이용약관</a></div>
        </div>
        </div>
      </div>
    `;
  },

  // 'choose' → 두 카드 / 'b2b' → 사내 계정 / 'b2c' → 카카오·구글
  setTab(tab) {
    const show = (id, on) => { const e = document.getElementById(id); if (e) e.style.display = on ? 'flex' : 'none'; };
    show('login-choose', tab === 'choose');
    show('login-b2b-section', tab === 'b2b');
    show('login-b2c-section', tab === 'b2c');
    if (tab === 'b2b') setTimeout(() => { try { document.getElementById('login-email')?.focus(); } catch (e) { } }, 50);
  },

  async handleEmailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pw').value;
    const button = e.target.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('login-auth-error');
    errorEl.textContent = '';
    button.disabled = true;
    button.textContent = '로그인 확인 중...';
    try {
      if (!window.SupabaseClient?.isConfigured) throw new Error('로그인 서버에 연결할 수 없습니다. 연결 상태를 확인해주세요.');
      const result = await window.SupabaseClient.signIn(email, password);
      this.finishLogin('supabase', { ...result.profile, id: result.user.id, email: result.user.email });
    } catch (error) {
      const raw = String(error?.message || '');
      let msg = '로그인하지 못했습니다. 이메일·비밀번호, 이메일 인증 및 계정 권한을 확인해주세요.';
      if (/email not confirmed/i.test(raw)) msg = '이메일 인증이 완료되지 않은 계정입니다. 관리자에게 문의해주세요. (이메일 인증 설정)';
      else if (/invalid login credentials/i.test(raw)) msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
      else if (/profile|프로필|권한/i.test(raw)) msg = '계정 권한 정보를 확인하지 못했습니다. 관리자에게 문의해주세요.';
      else if (/rate limit|too many/i.test(raw)) msg = '시도 횟수가 많습니다. 잠시 후 다시 시도해주세요.';
      if (navigator.onLine === false || /failed to fetch|network|load failed/i.test(raw)) msg = '인터넷 연결을 확인해 주세요.';
      console.warn('로그인 실패:', raw);
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    } finally {
      button.disabled = false;
      button.textContent = '로그인';
    }
  },

  initOAuth() {
    const wrap = document.getElementById('google_btn_wrapper');
    if (!wrap) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn-social btn-google lg-primary';
    button.style.cssText = 'background:#fff; color:#14161A; border:1px solid #d1d1d6; box-shadow:none;';
    button.textContent = 'Google로 시작하기';
    button.addEventListener('click', () => this.startOAuth('google'));
    wrap.replaceChildren(button);
  },

  async startOAuth(provider) {
    try {
      if (!window.SupabaseClient?.isConfigured || !['google', 'kakao'].includes(provider)) throw new Error('로그인 서버 연결이 필요합니다.');
      if (!['http:', 'https:'].includes(window.location.protocol)) throw new Error('소셜 로그인은 앱 서버 주소에서 이용해주세요.');
      // 서버에서 아직 켜지지 않은 로그인이면 오류 화면으로 보내지 않고 안내만
      try {
        const sc = window.SupabaseClient;
        const base = localStorage.getItem(sc.STORAGE_KEY_URL) || sc.DEFAULT_URL;
        const key = localStorage.getItem(sc.STORAGE_KEY_ANON_KEY) || sc.DEFAULT_KEY;
        const r = await fetch(base + '/auth/v1/settings', { headers: { apikey: key } });
        if (r.ok) {
          const ext = (await r.json())?.external || {};
          if (ext[provider] === false) {
            U.toast(`${provider === 'kakao' ? '카카오' : '구글'} 로그인은 아직 준비 중이에요. 곧 열어 드릴게요.`);
            return;
          }
        }
      } catch (e) { }
      const { error } = await window.SupabaseClient.client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (error) throw error;
    } catch (error) {
      console.warn('소셜 로그인 오류:', error?.message);
      U.toast('소셜 로그인을 지금 쓸 수 없어요. 잠시 후 다시 해 주세요.');
    }
  },

  doKakaoLogin() { return this.startOAuth('kakao'); },

  finishLogin(provider, user) {
    const verified = window.SupabaseClient?.currentUser;
    const profile = window.SupabaseClient?.currentProfile;
    if (provider !== 'supabase' || !verified || !profile || user.id !== verified.id) {
      throw new Error('검증된 로그인 세션이 필요합니다.');
    }
    user = { ...profile, id: verified.id, email: verified.email };
    const mgrId = user.id;
    localStorage.setItem('bp_logged_in', 'true');
    localStorage.setItem('bp_provider', provider);
    localStorage.setItem('bp_manager_id', mgrId);
    localStorage.setItem('bp_manager_filter', mgrId);
    localStorage.setItem('bp_user_name', user.name);
    localStorage.setItem('bp_user_email', user.email);
    localStorage.setItem('bp_user_role', user.role === 'indie_manager' ? 'manager' : user.role);
    // 개인 매니저(회사 없음): 로드톡·본사 연동 없이 혼자 쓰는 앱
    const indie = user.role === 'indie_manager' && !user.company_id;
    localStorage.setItem('bp_account', indie ? 'indie' : 'company');
    if (indie) { localStorage.removeItem('bp_company_name'); localStorage.removeItem('admin_bp_company_name'); }
    else localStorage.removeItem('rp_pro_until');

    // 매니저에 배정된 아티스트 목록 조회 및 세팅
    const managers = (typeof window.hqStore !== 'undefined') ? window.hqStore.getManagers() : [];
    const foundMgr = managers.find(m => m.id === mgrId || (m.email && m.email.toLowerCase() === (user.email || '').toLowerCase()));
    
    let assigned = [];
    if (user.role === 'ceo' || user.role === 'hq_admin' || indie) {
      // 본사 대표·총괄 관리자는 전사 아티스트 전체, 개인 매니저는 내가 등록한 아티스트 전체
      const allArtists = (typeof window.hqStore !== 'undefined') ? window.hqStore.getArtists() : [];
      assigned = allArtists.map(a => a.id);
    } else if (foundMgr && Array.isArray(foundMgr.assignedArtists) && foundMgr.assignedArtists.length > 0) {
      assigned = foundMgr.assignedArtists;
    } else {
      // 본사 아티스트 목록에서 기본 배정 또는 전체 조회 가능하도록 세팅
      // Unassigned managers must not inherit all artists.
      assigned = [];
    }
    
    localStorage.setItem('bp_assigned_artists', JSON.stringify(assigned));

    if (typeof State !== 'undefined') {
      State.setManagerFilter(mgrId);
    }

    try { sessionStorage.removeItem('rp_fresh_login'); } catch (e) { }
    U.toast(`✅ ${user.name}님 환영합니다!`);
    localStorage.setItem('bp_onboarded', 'true');
    if (window.hqStore) window.hqStore.flushPendingSchedules()
      .then(() => window.hqStore.syncFromSupabase())
      .then(() => {
        // 서버 최신 매니저 정보로 담당 아티스트 다시 저장
        try {
          const me = (window.hqStore.getManagers() || []).find(x => x.id === mgrId || (x.email && x.email.toLowerCase() === (user.email || '').toLowerCase()));
          if (indie) { localStorage.setItem('bp_assigned_artists', JSON.stringify((window.hqStore.getArtists() || []).map(a => a.id))); return; }
          if (user.role === 'ceo' || user.role === 'hq_admin') return;
          if (me && Array.isArray(me.assignedArtists)) localStorage.setItem('bp_assigned_artists', JSON.stringify(me.assignedArtists));
        } catch (e) { }
      })
      .then(() => indie && window.Plan ? Plan.refresh() : null)
      .then(() => App.refreshActiveScreens())
      .catch(() => U.toast('기기 저장 데이터를 유지합니다. 서버 동기화를 확인해주세요.'));
    // 화면·실시간 연결에서 오류가 나도 로그인 자체는 성공으로 처리 (로그인 화면에 오류가 남지 않게)
    try { App.renderNav(); } catch (e) { console.warn('메뉴 표시 오류', e); }
    try { App.initRealtimeSync(); } catch (e) { console.warn('실시간 연결 오류', e); }
    App.navigate('home');
  },

  // '계정 전환'으로 들어온 로그인 화면: 폰에 저장된 이전 계정 비밀번호가 자동으로 채워지지 않게
  _fresh() { try { return sessionStorage.getItem('rp_fresh_login') === '1'; } catch (e) { return false; } },

  // 개발용 PC(localhost)에서만 데모 로그인을 허용
  isDevHost() {
    return ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
  },

  demoLogin(type = 'ceo') {
    if (!this.isDevHost()) return;
    const allArtists = (typeof window.hqStore !== 'undefined') ? window.hqStore.getArtists() : [];
    const assigned = allArtists.map(a => a.id);
    localStorage.setItem('bp_logged_in', 'true');
    localStorage.setItem('bp_provider', 'demo');
    localStorage.setItem('bp_manager_id', 'mgr_ceo');
    localStorage.setItem('bp_manager_filter', 'ALL');
    localStorage.setItem('bp_user_name', '공진문 대표');
    localStorage.setItem('bp_user_email', 'ceo@kjm-ent.com');
    localStorage.setItem('bp_user_role', 'ceo');
    localStorage.setItem('bp_assigned_artists', JSON.stringify(assigned));
    localStorage.setItem('bp_onboarded', 'true');
    U.toast('✅ 공진문 대표님 테스트 모드로 진입했습니다.');
    if (typeof App !== 'undefined') {
      App.renderNav();
      App.navigate('home');
    }
  }
};
