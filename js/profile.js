/* =========================================
   BuddyPlanner v2 — Profile Screen Logic
   ========================================= */

const Profile = {
  fontMap: { 'sans': '고딕', 'serif': '명조', 'round': '둥근고딕' },
  sizeMap: { 'sm': '작게', 'md': '보통', 'lg': '크게' },

  render() {
    const app = U.$('#screen-profile');
    if (!app) return;

    // 현재 설정 불러오기
    const currentFont = localStorage.buddy_fontType || 'sans';
    const currentSize = localStorage.buddy_fontSize || 'md';
    const currentNavi = localStorage.getItem('bp_preferred_navi') || 'choice';
    
    const hData = State.userAddresses?.home || {name:''};
    const wData = State.userAddresses?.office || {name:''};
    const aData = State.userAddresses?.artist || {name:''};
    const sData = State.userAddresses?.shop || {name:''};
    const homeName = hData.name || '';
    const workName = wData.name || '';
    const artistName = aData.name || '';
    const shopName = sData.name || '';
    
    // 로그인된 사용자 정보 불러오기
    const userName = localStorage.getItem('bp_user_name') || '현장 매니저';
    const userEmail = localStorage.getItem('bp_user_email') || 'manager@star-ent.com';
    const provider = localStorage.getItem('bp_provider');
    const avatarLetter = userName.charAt(0).toUpperCase();

    app.innerHTML = `
      <div class="header">
        <button class="header-btn" onclick="App.navigate('home')">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="header-title">마이페이지</h1>
        <div class="header-btn" style="visibility:hidden"></div>
      </div>

      <div class="screen-scroll">
        <div class="profile-hero">
          <div class="profile-avatar">${avatarLetter}</div>
          <div class="profile-name">${userName} <span style="font-size:10px; color:var(--text-400); font-weight:normal;">(${provider||'mock'})</span></div>
          <div class="profile-email">${userEmail}</div>
          ${State.isPro ? '<div style="margin-top:8px; display:inline-block; padding:4px 12px; background:var(--gold-dim); color:var(--gold-500); border:1px solid rgba(217,119,6,0.3); border-radius:var(--r-full); font-size:12px; font-weight:bold;">👑 PRO 멤버</div>' : ''}
        </div>
        
        ${!State.isPro ? `
        <div style="margin: 0 var(--sp-5) var(--sp-6);">
          <div style="background:linear-gradient(135deg, #0f172a, #1e293b); border-radius:var(--r-xl); padding:var(--sp-4); color:#fff; display:flex; align-items:center; justify-content:space-between; box-shadow:var(--shadow-md);">
            <div>
              <div style="font-size:var(--fs-sm); color:var(--gold-300); font-weight:bold; margin-bottom:2px;">매니저플래너 PRO</div>
              <div style="font-size:var(--fs-lg); font-weight:800;">프리미엄 혜택 만나보기</div>
            </div>
            <button onclick="App.navigate('upgrade')" style="background:var(--gold-400); color:#fff; padding:8px 16px; border-radius:var(--r-full); font-weight:bold; font-size:var(--fs-sm); box-shadow:var(--glow-gold);">업그레이드</button>
          </div>
        </div>
        ` : ''}

        <div class="profile-section">
          <div class="profile-section-title">내 정보 관리</div>
          <div class="setting-card">
            <div class="setting-item" style="cursor:pointer" onclick="Profile.editContact()">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">📱</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:var(--text-800)">
                  휴대폰 번호 수정
                </div>
              </div>
            </div>
            <div class="setting-item" style="cursor:pointer" onclick="Profile.editVehicle()">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">🚙</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:var(--text-800)">
                  배정 차량 정보 관리
                </div>
              </div>
            </div>
          </div>
        </div>


        <div class="profile-section">
          <div class="profile-section-title">기본 설정</div>
          
          <div class="setting-card">
            <div class="setting-item">
              <div class="setting-item-header">화면 테마 (다크모드)</div>
              <div class="setting-options">
                <button class="setting-opt-btn active" onclick="Profile.setTheme('system', this)">시스템 설정</button>
                <button class="setting-opt-btn" onclick="Profile.setTheme('light', this)">라이트 모드</button>
                <button class="setting-opt-btn" onclick="Profile.setTheme('dark', this)">다크 모드</button>
              </div>
            </div>

            <div class="setting-item" style="cursor:pointer" onclick="Profile.togglePush()">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">🔔</span>
                <div class="address-input" style="display:flex; justify-content:space-between; align-items:center; width:100%; background:transparent; color:var(--text-800)">
                  <span>스케줄 변동 푸시 알림 설정</span>
                  <span style="color:#4f46e5; font-weight:800; font-size:12px;">ON</span>
                </div>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-item-header">글꼴 스타일</div>
              <div class="setting-options">
                <button class="setting-opt-btn ${currentFont==='sans'?'active':''}" onclick="Profile.setFont('sans', this)">고딕 (기본)</button>
                <button class="setting-opt-btn ${currentFont==='serif'?'active':''}" onclick="Profile.setFont('serif', this)">명조체</button>
                <button class="setting-opt-btn ${currentFont==='round'?'active':''}" onclick="Profile.setFont('round', this)">둥근고딕</button>
              </div>
            </div>
            
            <div class="setting-item">
              <div class="setting-item-header">글자 크기</div>
              <div class="setting-options">
                <button class="setting-opt-btn ${currentSize==='sm'?'active':''}" onclick="Profile.setSize('sm', this)">작게</button>
                <button class="setting-opt-btn ${currentSize==='md'?'active':''}" onclick="Profile.setSize('md', this)">보통</button>
                <button class="setting-opt-btn ${currentSize==='lg'?'active':''}" onclick="Profile.setSize('lg', this)">크게</button>
              </div>
            </div>

            <div class="setting-item">
              <div class="setting-item-header">🚗 선호 네비게이션 앱</div>
              <div class="setting-options">
                <button class="setting-opt-btn ${currentNavi==='tmap'?'active':''}" onclick="Profile.setNavi('tmap', this)">티맵 (Tmap)</button>
                <button class="setting-opt-btn ${currentNavi==='kakao'?'active':''}" onclick="Profile.setNavi('kakao', this)">카카오내비</button>
                <button class="setting-opt-btn ${currentNavi==='choice'?'active':''}" onclick="Profile.setNavi('choice', this)">매번 선택</button>
              </div>
            </div>
          </div>

          <div class="profile-section-title">자주 출발하는 장소</div>
          
          <div class="setting-card">
            <div class="setting-item" style="cursor:pointer" onclick="Profile.searchAndSaveAddress('home')">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">🏠</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:${homeName?'var(--text-800)':'var(--text-400)'}">
                  ${homeName ? homeName : '집 주소 검색하기 (터치)'}
                </div>
              </div>
            </div>
            
            <div class="setting-item" style="cursor:pointer" onclick="Profile.searchAndSaveAddress('work')">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">🏢</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:${workName?'var(--text-800)':'var(--text-400)'}">
                  ${workName ? workName : '회사 주소 검색하기 (터치)'}
                </div>
              </div>
            </div>

            <div class="setting-item" style="cursor:pointer" onclick="Profile.searchAndSaveAddress('artist')">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">🎤</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:${artistName?'var(--text-800)':'var(--text-400)'}">
                  ${artistName ? artistName : '아티스트 숙소 주소 검색하기 (터치)'}
                </div>
              </div>
            </div>

            <div class="setting-item" style="cursor:pointer" onclick="Profile.searchAndSaveAddress('shop')">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">💇</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:${shopName?'var(--text-800)':'var(--text-400)'}">
                  ${shopName ? shopName : '헤어/메이크업 샵 주소 검색하기 (터치)'}
                </div>
              </div>
            </div>
          </div>
          
          ${(localStorage.getItem('bp_user_role') === 'ceo' || localStorage.getItem('bp_user_role') === 'hq_admin') ? `
          <div class="profile-section-title">🏢 HQ 엔터테인먼트 마스터 포털</div>
          <div class="setting-card">
            <a href="admin.html" target="_blank" class="setting-item" style="text-decoration:none; cursor:pointer;">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">🏢</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:var(--text-800); font-weight:700;">
                  본사 마스터 스케줄러 열기 (관리자용) ↗
                </div>
              </div>
            </a>
          </div>
          ` : ''}

          <div class="profile-section-title">고객지원 / 앱 정보</div>
          
          <div class="setting-card">
            <div class="setting-item" style="cursor:pointer" onclick="Profile.showVersion()">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">ℹ️</span>
                <div class="address-input" style="display:flex; justify-content:space-between; align-items:center; width:100%; background:transparent; color:var(--text-800)">
                  <span>앱 버전 정보</span>
                  <span style="color:var(--text-400); font-size:12px;">v1.0.0 (최신)</span>
                </div>
              </div>
            </div>
            
            <div class="setting-item" style="cursor:pointer" onclick="U.toast('이용약관 및 개인정보처리방침 페이지로 이동합니다.')">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">📄</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:var(--text-800)">
                  이용약관 및 개인정보처리방침
                </div>
              </div>
            </div>

            <div class="setting-item" style="cursor:pointer" onclick="U.toast('고객센터 문의 폼이 열립니다.')">
              <div class="address-input-wrap" style="flex:1">
                <span class="address-icon">🎧</span>
                <div class="address-input" style="display:flex; align-items:center; background:transparent; color:var(--text-800)">
                  고객센터 문의하기
                </div>
              </div>
            </div>
          </div>
          
          <div class="logout-wrap">
            <button class="logout-btn" onclick="Profile.logout()">로그아웃</button>
          </div>
        </div>
      </div>
    `;
  },

  setFont(type, el) {
    localStorage.buddy_fontType = type;
    document.documentElement.setAttribute('data-font', type);
    
    // Update UI active state
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    
    U.toast(`글꼴이 '${this.fontMap[type]}'으로 변경되었습니다.`);
    U.haptic();
  },

  setSize(size, el) {
    localStorage.buddy_fontSize = size;
    document.documentElement.setAttribute('data-size', size);
    
    // Update UI active state
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');

    U.toast(`글자 크기가 '${this.sizeMap[size]}'로 변경되었습니다.`);
    U.haptic();
  },

  setNavi(naviType, el) {
    localStorage.setItem('bp_preferred_navi', naviType);
    
    // Update UI active state
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');

    const naviLabel = naviType === 'tmap' ? '티맵 (Tmap)' : naviType === 'kakao' ? '카카오내비' : '매번 선택';
    U.toast(`선호 네비게이션이 '${naviLabel}'(으)로 설정되었습니다.`);
    U.haptic();
  },

  searchAndSaveAddress(type) {
    const title = type === 'home' ? '🏠 집 주소 검색' : type === 'work' ? '🏢 회사 주소 검색' : type === 'artist' ? '🎤 아티스트 숙소 검색' : '💇 헤어/메이크업 샵 검색';
    App.openAddressSearch(title, (selectedPlace) => {
      if (!State.userAddresses) State.userAddresses = {};
      
      if (type === 'home') {
        State.userAddresses.home = selectedPlace;
        localStorage.setItem('bp_home', JSON.stringify(selectedPlace));
      } else if (type === 'work') {
        State.userAddresses.office = selectedPlace;
        localStorage.setItem('bp_office', JSON.stringify(selectedPlace));
      } else if (type === 'artist') {
        State.userAddresses.artist = selectedPlace;
        localStorage.setItem('bp_artist', JSON.stringify(selectedPlace));
      } else {
        State.userAddresses.shop = selectedPlace;
        localStorage.setItem('bp_shop', JSON.stringify(selectedPlace));
      }
      U.toast('✅ 주소가 좌표와 함께 정확히 저장되었습니다.');
      U.haptic();
      Profile.render(); // 화면 갱신
    });
  },

  logout() {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
      const provider = localStorage.getItem('bp_provider');
      
      if (window.SupabaseClient) {
        window.SupabaseClient.signOut();
      }

      // 카카오 로그아웃 처리
      if (provider === 'kakao' && typeof Kakao !== 'undefined' && Kakao.Auth) {
        Kakao.Auth.logout(() => {
          console.log('카카오 세션 만료');
        });
      }
      
      // 구글 로그아웃 처리
      if (provider === 'google' && typeof google !== 'undefined') {
        google.accounts.id.disableAutoSelect();
      }

      localStorage.removeItem('bp_logged_in');
      localStorage.removeItem('bp_provider');
      localStorage.removeItem('bp_manager_id');
      localStorage.removeItem('bp_assigned_artists');
      localStorage.removeItem('bp_user_name');
      localStorage.removeItem('bp_user_email');
      localStorage.removeItem('bp_user_role');
      
      U.toast('로그아웃 되었습니다.');
      App.navigate('login');
    }
  },

  editContact() {
    U.toast('휴대폰 번호 변경 기능은 준비 중입니다.');
  },

  editVehicle() {
    U.toast('차량 정보 관리 기능은 준비 중입니다.');
  },

  setTheme(theme, el) {
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    
    if(theme === 'dark') {
      document.body.style.filter = 'invert(0.9) hue-rotate(180deg)'; // 임시 다크모드 효과
    } else {
      document.body.style.filter = 'none';
    }
    
    U.toast(`화면 테마가 '${theme === 'dark' ? '다크 모드' : theme === 'light' ? '라이트 모드' : '시스템 설정'}'로 변경되었습니다.`);
    U.haptic();
  },

  togglePush() {
    U.toast('🔔 푸시 알림 설정이 토글되었습니다.');
    U.haptic();
  },

  showVersion() {
    U.toast('현재 최신 버전을 사용 중입니다. (v1.0.0)');
  }
};
