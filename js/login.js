/* =========================================
   BuddyPlanner v2 — Manager Login Screen
   (Supabase Auth & Multi-Manager Selection)
   ========================================= */

const Login = {
  KAKAO_JS_KEY: '5729341d219d8cb6f0a189fa86c91456',
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  async init() {
    this.render();
    this.initOAuth();
    if (window.SupabaseClient) {
      const session = await window.SupabaseClient.getCurrentSession();
      if (session && session.user) {
        this.finishLogin('supabase', {
          id: session.user.id,
          name: session.profile?.name || session.user.email,
          email: session.user.email,
          role: session.profile?.role || 'manager'
        });
      }
    }
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
          <button onclick="Login.setTab('b2b')" id="tab-b2b" style="flex:1; padding:12px; font-weight:800; font-size:14px; border-radius:10px; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:all 0.2s;">소속 매니저 로그인</button>
          <button onclick="Login.setTab('b2c')" id="tab-b2c" style="flex:1; padding:12px; font-weight:700; font-size:14px; border-radius:10px; border:none; background:transparent; color:var(--text-400); cursor:pointer; transition:all 0.2s;">개인 매니저 시작</button>
        </div>

        <!-- B2B 로그인 폼 -->
        <div id="login-b2b-section" style="background:var(--bg-card); border-radius:16px; padding:24px; margin-bottom:24px; border:1px solid var(--border-default); box-shadow:var(--shadow-md); display:block;">
          <form id="form-supabase-login" onsubmit="Login.handleEmailLogin(event)" style="display:flex; flex-direction:column; gap:14px;">
            <input type="email" id="login-email" class="form-input" placeholder="사내 이메일 (ID)" required 
              style="background:var(--bg-input); border:1px solid transparent; color:var(--text-100); padding:16px; border-radius:12px; font-size:15px; width:100%; transition:all 0.2s; outline:none;" 
              onfocus="this.style.background='var(--bg-input-focus)'; this.style.borderColor='var(--accent)';" 
              onblur="this.style.background='var(--bg-input)'; this.style.borderColor='transparent';" />
            <input type="password" id="login-pw" class="form-input" placeholder="비밀번호" required 
              style="background:var(--bg-input); border:1px solid transparent; color:var(--text-100); padding:16px; border-radius:12px; font-size:15px; width:100%; transition:all 0.2s; outline:none;" 
              onfocus="this.style.background='var(--bg-input-focus)'; this.style.borderColor='var(--accent)';" 
              onblur="this.style.background='var(--bg-input)'; this.style.borderColor='transparent';" />
            <button type="submit" class="btn-social" 
              style="background:var(--accent); color:#fff; font-weight:800; font-size:16px; justify-content:center; padding:16px; border-radius:12px; margin-top:8px; border:none; box-shadow:0 4px 12px rgba(0,122,255,0.3); cursor:pointer;">
              시작하기 (Sign In)
            </button>
          </form>
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
          <a href="admin-login.html" style="font-size:13px; color:var(--text-400); text-decoration:underline; font-weight:600;">
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

  selectManager(id, name, email, artistName, assignedArtists) {
    localStorage.setItem('bp_logged_in', 'true');
    localStorage.setItem('bp_manager_id', id);
    localStorage.setItem('bp_manager_filter', id);
    localStorage.setItem('bp_user_name', name);
    localStorage.setItem('bp_user_email', email);
    localStorage.setItem('bp_user_role', 'manager');
    localStorage.setItem('bp_assigned_artists', JSON.stringify(assignedArtists));
    localStorage.setItem('bp_onboarded', 'true');

    if (typeof State !== 'undefined') {
      State.setManagerFilter(id);
    }

    U.toast(`✅ ${name} (${artistName} 담당) 로그인 완료!`);
    App.navigate('home');
  },

  async handleEmailLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-pw').value.trim();

    // 1. Supabase가 연결되어 있으면 우선 클라우드 인증 시도
    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        const res = await window.SupabaseClient.signIn(email, pw);
        if (res.error) throw res.error;
        const profile = res.user.profile || {};
        this.finishLogin('supabase', {
          id: res.user.id,
          name: profile.name || email,
          email: email,
          role: profile.role || 'manager'
        });
        return;
      } catch (e) {
        alert('Supabase 로그인 실패: ' + e.message);
        return;
      }
    }

    // 2. 로컬 모드 (AuthPersona 활용한 하드코딩 검증)
    if (window.AuthPersona) {
      const result = window.AuthPersona.login(email, pw);
      if (result.success) {
        U.toast(`✅ 환영합니다! [${result.user.name}] 로그인 성공`);
        if (typeof State !== 'undefined') State.setManagerFilter(result.user.id);
        
        // 권한에 따른 라우팅
        if (result.user.role === 'ceo' || result.user.role === 'hq_admin') {
          // HQ 권한이면 admin.html 이동 여부를 물어보거나 홈으로 이동
          if (confirm('본사 관리자 계정입니다. 마스터 관제 포털(PC)로 이동하시겠습니까?')) {
            window.location.href = 'admin.html';
            return;
          }
        }
        
        App.navigate('home');
      } else {
        alert(result.message);
      }
    } else {
      alert('인증 시스템이 초기화되지 않았습니다.');
    }
  },

  initOAuth() {
    if (typeof Kakao !== 'undefined' && !Kakao.isInitialized()) {
      if (this.KAKAO_JS_KEY !== 'YOUR_KAKAO_JS_KEY') {
        Kakao.init(this.KAKAO_JS_KEY);
      }
    }

    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: this.GOOGLE_CLIENT_ID,
        callback: this.handleGoogleResponse.bind(this)
      });
      const wrap = document.getElementById('google_btn_wrapper');
      if (wrap) {
        google.accounts.id.renderButton(
          wrap,
          { theme: 'outline', size: 'large', type: 'standard', width: 300 }
        );
      }
    }
  },

  doKakaoLogin() {
    if (typeof Kakao === 'undefined') {
      U.toast('⚠️ 카카오 SDK 로드 대기중');
      return;
    }
    Kakao.Auth.login({
      success: () => {
        Kakao.API.request({
          url: '/v2/user/me',
          success: (res) => {
            const name = res.properties?.nickname || '카카오 매니저';
            const email = res.kakao_account?.email || 'kakao@manager.com';
            this.finishLogin('kakao', { name, email });
          }
        });
      },
      fail: () => {
        this.selectManager('mgr_2', '카카오 매니저', 'kakao@manager.com', '루나스', ['art_1']);
      }
    });
  },

  handleGoogleResponse(response) {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const name = payload.name || '구글 매니저';
      const email = payload.email || '';
      this.finishLogin('google', { name, email });
    } catch (e) {
      console.error(e);
      U.toast('구글 로그인 오류');
    }
  },

  finishLogin(provider, user) {
    const mgrId = user.id || 'mgr_2';
    localStorage.setItem('bp_logged_in', 'true');
    localStorage.setItem('bp_provider', provider);
    localStorage.setItem('bp_manager_id', mgrId);
    localStorage.setItem('bp_manager_filter', mgrId);
    localStorage.setItem('bp_user_name', user.name);
    localStorage.setItem('bp_user_email', user.email);
    localStorage.setItem('bp_user_role', user.role || 'manager');

    // 매니저에 배정된 아티스트 목록 조회 및 세팅
    const managers = (typeof window.hqStore !== 'undefined') ? window.hqStore.getManagers() : [];
    const foundMgr = managers.find(m => m.id === mgrId || m.email === user.email);
    const assigned = foundMgr?.assignedArtists || (mgrId === 'mgr_2' ? ['art_1'] : mgrId === 'mgr_3' ? ['art_2'] : mgrId === 'mgr_4' ? ['art_3'] : ['art_1']);
    localStorage.setItem('bp_assigned_artists', JSON.stringify(assigned));

    if (typeof State !== 'undefined') {
      State.setManagerFilter(mgrId);
    }

    U.toast(`✅ ${user.name}님 환영합니다!`);
    App.navigate('home');
  }
};
