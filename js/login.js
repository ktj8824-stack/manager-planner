/* =========================================
   BuddyPlanner v2 — Manager Login Screen
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

    el.innerHTML = `
      <div class="login-container" style="max-width:420px; margin:0 auto; padding:40px 24px; min-height:100vh; display:flex; flex-direction:column; justify-content:center; background:var(--bg-app);">
        <div class="login-logo" style="text-align:center; margin-bottom:30px;">
          <img src="img/logo.jpg" alt="Logo" style="display:block; margin:0 auto 16px auto; width:80px; height:80px; border-radius:20px; box-shadow:0 8px 16px rgba(0,0,0,0.2);">
          <h1 class="login-title" style="font-size:26px; font-weight:800; margin:16px 0 8px 0; letter-spacing:-0.5px; color:var(--text-100);">매니저플래너</h1>
          <p class="login-subtitle" style="font-size:14px; color:var(--text-400);">
            현장 매니저 및 스태프 전용 앱
          </p>
        </div>

        <div style="display:flex; margin-bottom:24px; border-radius:12px; background:var(--bg-card); padding:4px; box-shadow:var(--shadow-sm); border:1px solid var(--border-default);">
          <button onclick="Login.setTab('b2b')" id="tab-b2b" style="flex:1; padding:12px 6px; white-space:nowrap; font-weight:800; font-size:13px; border-radius:10px; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:all 0.2s;">소속 매니저 로그인</button>
          <button onclick="Login.setTab('b2c')" id="tab-b2c" style="flex:1; padding:12px 6px; white-space:nowrap; font-weight:700; font-size:14px; border-radius:10px; border:none; background:transparent; color:var(--text-400); cursor:pointer; transition:all 0.2s;">개인 매니저 시작</button>
        </div>

        <!-- B2B 로그인 폼 -->
        <div id="login-b2b-section" style="background:var(--bg-card); border-radius:16px; padding:24px; margin-bottom:24px; border:1px solid var(--border-default); box-shadow:var(--shadow-md); display:block;">
          <form id="form-supabase-login" onsubmit="Login.handleEmailLogin(event)" style="display:flex; flex-direction:column; gap:14px;">
            <input type="email" id="login-email" class="form-input" placeholder="사내 이메일 (ID)" aria-label="사내 이메일" autocomplete="username" required 
              style="background:var(--bg-input); border:1px solid transparent; color:var(--text-100); padding:16px; border-radius:12px; font-size:15px; width:100%; transition:all 0.2s; outline:none;" 
              onfocus="this.style.background='var(--bg-input-focus)'; this.style.borderColor='var(--accent)';" 
              onblur="this.style.background='var(--bg-input)'; this.style.borderColor='transparent';" />
            <input type="password" id="login-pw" class="form-input" placeholder="비밀번호" aria-label="비밀번호" autocomplete="current-password" required 
              style="background:var(--bg-input); border:1px solid transparent; color:var(--text-100); padding:16px; border-radius:12px; font-size:15px; width:100%; transition:all 0.2s; outline:none;" 
              onfocus="this.style.background='var(--bg-input-focus)'; this.style.borderColor='var(--accent)';" 
              onblur="this.style.background='var(--bg-input)'; this.style.borderColor='transparent';" />
            <button type="submit" class="btn-social" 
              style="background:var(--accent); color:#fff; font-weight:800; font-size:16px; justify-content:center; padding:16px; border-radius:12px; margin-top:8px; border:none; box-shadow:0 4px 12px rgba(0,122,255,0.3); cursor:pointer;">
              로그인
            </button>
            <button type="button" id="demo-login-btn" ${Login.isDevHost() ? '' : 'hidden'} onclick="Login.demoLogin('ceo')" 
              style="width:100%; margin-top:10px; padding:13px; border-radius:12px; border:1px dashed rgba(99,102,241,0.5); background:rgba(99,102,241,0.08); color:var(--accent); font-weight:800; font-size:13px; cursor:pointer; transition:all 0.2s;">
              ⚡ 테스트 대표 계정 1초 둘러보기 (데모)
            </button>
          </form>
          <p id="login-auth-error" role="alert" aria-live="polite" style="display:none;color:#ef4444;font-size:13px;margin-top:14px;"></p>
          <div style="font-size:12px; color:var(--text-400); text-align:center; margin-top:16px;">
            ※ 본사에서 발급받은 계정으로 로그인해주세요.
          </div>
        </div>

        <!-- B2C 소셜 로그인 폼 -->
        <div id="login-b2c-section" style="display:none; background:var(--bg-card); border-radius:16px; padding:24px; margin-bottom:24px; border:1px solid var(--border-default); box-shadow:var(--shadow-md);">
          <div style="font-size:14px; color:var(--text-300); text-align:center; margin-bottom:20px; font-weight:600;">
            개인 매니저를 위한 맞춤 스케줄러를<br>간편하게 시작해보세요.
          </div>
          
          <div id="google_btn_wrapper" style="display:flex; justify-content:center; margin-bottom:12px;"></div>
          
          <button class="btn-social btn-kakao" onclick="Login.doKakaoLogin()" style="background:#FEE500; color:#000000; border-radius:12px; padding:16px; font-weight:800; font-size:15px; justify-content:center; border:none; width:100%; display:flex; align-items:center; gap:8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
              <path d="M12 3C6.48 3 2 6.47 2 10.75c0 2.76 1.84 5.17 4.67 6.49-.15.54-.53 1.96-.6 2.27-.08.35.12.35.3.23.14-.09 1.94-1.32 2.75-1.89.92.26 1.88.4 2.88.4 5.52 0 10-3.47 10-7.75S17.52 3 12 3z"/>
            </svg>
            카카오로 시작하기
          </button>
        </div>

        <div style="text-align:center; margin-top:auto;">
          <a href="${typeof U !== 'undefined' && U.getHQLoginUrl ? U.getHQLoginUrl() : 'admin-login.html'}" style="font-size:13px; color:var(--text-400); text-decoration:underline; font-weight:600;">
            🏢 본사 총괄 관리 포털(HQ) 접속
          </a>
        </div>
      </div>
    `;
  },

  setTab(tab) {
    const btnB2B = document.getElementById('tab-b2b');
    const btnB2C = document.getElementById('tab-b2c');
    const secB2B = document.getElementById('login-b2b-section');
    const secB2C = document.getElementById('login-b2c-section');
    
    if (tab === 'b2b') {
      btnB2B.style.background = 'var(--accent)';
      btnB2B.style.color = '#fff';
      btnB2B.style.fontWeight = '800';
      
      btnB2C.style.background = 'transparent';
      btnB2C.style.color = 'var(--text-400)';
      btnB2C.style.fontWeight = '700';
      
      secB2B.style.display = 'block';
      secB2C.style.display = 'none';
    } else {
      btnB2C.style.background = 'var(--accent)';
      btnB2C.style.color = '#fff';
      btnB2C.style.fontWeight = '800';
      
      btnB2B.style.background = 'transparent';
      btnB2B.style.color = 'var(--text-400)';
      btnB2B.style.fontWeight = '700';
      
      secB2C.style.display = 'block';
      secB2B.style.display = 'none';
    }
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
      errorEl.textContent = '로그인하지 못했습니다. 이메일·비밀번호, 이메일 인증 및 계정 권한을 확인해주세요.';
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
    button.className = 'btn-social';
    button.style.cssText = 'width:100%;justify-content:center;padding:16px;border-radius:12px;';
    button.textContent = 'Google로 시작하기';
    button.addEventListener('click', () => this.startOAuth('google'));
    wrap.replaceChildren(button);
  },

  async startOAuth(provider) {
    try {
      if (!window.SupabaseClient?.isConfigured || !['google', 'kakao'].includes(provider)) throw new Error('로그인 서버 연결이 필요합니다.');
      if (!['http:', 'https:'].includes(window.location.protocol)) throw new Error('소셜 로그인은 앱 서버 주소에서 이용해주세요.');
      const { error } = await window.SupabaseClient.client.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + window.location.pathname }
      });
      if (error) throw error;
    } catch (error) {
      U.toast(error.message || '소셜 로그인 설정을 확인해주세요.');
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

    // 매니저에 배정된 아티스트 목록 조회 및 세팅
    const managers = (typeof window.hqStore !== 'undefined') ? window.hqStore.getManagers() : [];
    const foundMgr = managers.find(m => m.id === mgrId || (m.email && m.email.toLowerCase() === (user.email || '').toLowerCase()));
    
    let assigned = [];
    if (user.role === 'ceo' || user.role === 'hq_admin') {
      // 본사 대표 및 총괄 관리자는 전사 소속 아티스트 전체 열람
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

    U.toast(`✅ ${user.name}님 환영합니다!`);
    localStorage.setItem('bp_onboarded', 'true');
    if (window.hqStore) window.hqStore.flushPendingSchedules()
      .then(() => window.hqStore.syncFromSupabase())
      .then(() => App.refreshActiveScreens())
      .catch(() => U.toast('기기 저장 데이터를 유지합니다. 서버 동기화를 확인해주세요.'));
    App.renderNav();
    App.initRealtimeSync();
    App.navigate('home');
  },

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
