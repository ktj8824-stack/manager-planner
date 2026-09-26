/* =========================================
   ManagerPlanner — App Router
   ========================================= */

const App = {
  screens: ['home','register','timeline','login','onboarding','profile','upgrade'],

  init() {
    if (!State.loadSchedules()) {
      State.initDemo();
    }
    this.loadPreferences();
    this.renderNav();
    this.renderAdBanner();
    
    // 1. HQ 실시간 알림 수신 (BroadcastChannel - 로컬/크로스탭)
    this.hqBc = new BroadcastChannel('HQ_PLANNER_CHANNEL');
    this.hqBc.onmessage = (e) => {
      if (e.data && e.data.type === 'NEW_HQ_MESSAGE') {
        const noti = e.data.payload;
        this.showHqToast(noti);
      } else if (e.data && (e.data.type === 'SCHEDULES_SAVED' || e.data.type === 'SCHEDULE_UPDATE' || e.data.type === 'SCHEDULE_DELETE' || e.data.type === 'MANAGER_ASSIGNED' || e.data.type === 'ARTISTS_SAVED')) {
        this.refreshActiveScreens();
      }
    };

    // 로컬 창 및 탭 간 커스텀 이벤트/스토리지 이벤트 즉시 수신
    window.addEventListener('hq-store-change', () => this.refreshActiveScreens());
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key.startsWith('HQ_') || e.key.startsWith('bp_')) {
        this.refreshActiveScreens();
      }
    });

    // 2. Supabase Cloud Realtime 구독 (기기 간 실시간 동기화)
    this.initRealtimeSync();

    // 3. 네트워크 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
      U.toast('⚡ 네트워크 연결 복구 (클라우드 동기화 완료)');
      if (window.hqStore) window.hqStore.syncFromSupabase().then(() => this.refreshActiveScreens());
    });
    window.addEventListener('offline', () => {
      U.toast('📶 오프라인 모드 전환 (로컬 데이터 보관)');
    });
    
    const isLoggedIn = localStorage.getItem('bp_logged_in') === 'true';
    const hasOnboarded = localStorage.getItem('bp_onboarded') === 'true';
    State.isPro = localStorage.getItem('bp_pro') === 'true';

    if (!isLoggedIn) {
      this.navigate('login');
    } else if (!hasOnboarded) {
      this.navigate('onboarding');
    } else {
      this.navigate('home');
      setTimeout(()=>U.toast('🎬 매니저플래너에 오신 것을 환영합니다!'), 700);
    }
    
    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker Registered!', reg.scope))
          .catch(err => console.error('Service Worker Registration Failed:', err));
      });
    }
  },

  initRealtimeSync() {
    if (typeof window.SupabaseClient !== 'undefined') {
      window.SupabaseClient.subscribeAll({
        onScheduleChange: async (payload) => {
          console.log('⚡ [App] 실시간 스케줄 변경 감지:', payload);
          if (window.hqStore) {
            await window.hqStore.syncFromSupabase();
            this.refreshActiveScreens();
          }
        },
        onAnnouncement: (noti) => {
          console.log('🚨 [App] 실시간 본사 공지 수신:', noti);
          this.showHqToast(noti);
        }
      });
    }
  },

  refreshActiveScreens() {
    if (typeof State !== 'undefined' && State.loadSchedules) {
      State.loadSchedules();
    }
    if (State.screen === 'home' && typeof Home !== 'undefined') {
      if (typeof Home.updateLeftCal === 'function') Home.updateLeftCal();
      if (typeof Home.updateRightTimeline === 'function') Home.updateRightTimeline();
    } else if (State.screen === 'timeline' && typeof Timeline !== 'undefined' && typeof Timeline.render === 'function') {
      Timeline.render();
    }
  },

  loadPreferences() {
    const font = localStorage.getItem('bp_font');
    if (font) {
      const fontStr = font === 'Pretendard' ? "'Pretendard Variable', 'Pretendard', sans-serif" : `'${font}', sans-serif`;
      document.documentElement.style.setProperty('--font-sans', fontStr);
      if (font !== 'Pretendard') {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Nanum+Myeongjo:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    }
    const size = localStorage.getItem('bp_size');
    if (size) {
      let basePx = 16;
      if (size === 'small') basePx = 14;
      if (size === 'large') basePx = 18;
      document.documentElement.style.fontSize = basePx + 'px';
    }
    const home = localStorage.getItem('bp_home');
    const office = localStorage.getItem('bp_office');
    const artist = localStorage.getItem('bp_artist');
    const shop = localStorage.getItem('bp_shop');
    if (!State.userAddresses) State.userAddresses = { home: null, office: null, artist: null, shop: null };
    
    try {
      if (home) State.userAddresses.home = home.startsWith('{') ? JSON.parse(home) : { name: home, lat: 0, lng: 0 };
    } catch(e) { State.userAddresses.home = { name: home, lat: 0, lng: 0 }; }
    
    try {
      if (office) State.userAddresses.office = office.startsWith('{') ? JSON.parse(office) : { name: office, lat: 0, lng: 0 };
    } catch(e) { State.userAddresses.office = { name: office, lat: 0, lng: 0 }; }

    try {
      if (artist) State.userAddresses.artist = artist.startsWith('{') ? JSON.parse(artist) : { name: artist, lat: 0, lng: 0 };
    } catch(e) { State.userAddresses.artist = { name: artist, lat: 0, lng: 0 }; }

    try {
      if (shop) State.userAddresses.shop = shop.startsWith('{') ? JSON.parse(shop) : { name: shop, lat: 0, lng: 0 };
    } catch(e) { State.userAddresses.shop = { name: shop, lat: 0, lng: 0 }; }
  },

  openNavi(name, lat, lng) {
    if (!lat || !lng) {
      U.toast('목적지의 위치(좌표) 정보가 없어 길안내를 시작할 수 없습니다.');
      return;
    }
    const url = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
    window.open(url, '_blank');
  },

  navigate(name) {
    if (!this.screens.includes(name)) return;
    this.screens.forEach(s => { const el=U.$(`#screen-${s}`); if(el)el.classList.remove('active'); });
    const target = U.$(`#screen-${name}`);
    if (target) {
      target.classList.add('active');
      switch(name) {
        case 'home': Home.init(); break;
        case 'register': Register.init(); break;
        case 'timeline': Timeline.init(); break;
        case 'login': Login.init(); break;
        case 'onboarding': Onboarding.init(); break;
        case 'profile': Profile.render(); break;
        case 'upgrade': Upgrade.init(); break;
      }
    }
    this.updateNav(name === 'timeline' ? 'home' : name);
    
    const nav = U.$('#top-header');
    if (nav) {
      if (name === 'login' || name === 'onboarding') {
        nav.style.display = 'none';
      } else {
        nav.style.display = 'flex';
      }
    }
    
    State.screen = name;
    window.scrollTo(0,0);
  },

  viewTimeline(idx) {
    State.currentScheduleIdx = idx;
    const target = U.$('#screen-timeline');
    if (target) {
      this.screens.forEach(s => { const el=U.$(`#screen-${s}`); if(el)el.classList.remove('active'); });
      target.classList.add('active');
      Timeline.init(idx);
    }
    this.updateNav('home');
    State.screen = 'timeline';
    window.scrollTo(0,0);
  },

  renderNav() {
    const nav = U.el('header','top-header');
    nav.id = 'top-header';
    nav.innerHTML = `
      <div class="top-nav-left">
        <button class="top-nav-item active" data-s="home" onclick="App.navigate('home')">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.8" fill="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          <span class="nav-label">홈</span>
        </button>
        <button class="top-nav-item" data-s="profile" onclick="App.navigate('profile')">
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="1.8" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span class="nav-label">내 정보</span>
        </button>
      </div>
      <div class="top-brand">
        🎬 매니저플래너
      </div>
      <div class="top-nav-right">
        <button class="top-nav-item membership-nav" data-s="upgrade" onclick="App.navigate('upgrade')">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M2 19h20v2H2v-2zm19-11c-.55 0-1 .45-1 1v4l-3-2-2 3-3-4-3 4-2-3-3 2v-4c0-.55-.45-1-1-1s-1 .45-1 1v7h20V9c0-.55-.45-1-1-1zM7 6c.83 0 1.5-.67 1.5-1.5S7.83 3 7 3s-1.5.67-1.5 1.5S6.17 6 7 6zm10 0c.83 0 1.5-.67 1.5-1.5S17.83 3 17 3s-1.5.67-1.5 1.5S16.17 6 17 6zm-5-2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
          <span class="nav-label">멤버쉽등록</span>
        </button>
      </div>
    `;
    // Prepend to app instead of append so it's logically first
    U.$('#app').prepend(nav);
  },

  // 카카오 AdFit 광고 단위 ID (발급 후 교체)
  ADFIT_UNIT_ID: 'DAN-XXXXXXXXXXXXXXXX',

  renderAdBanner() {
    // 이미 광고 있으면 중복 생성 방지
    if (U.$('#adfit-banner-wrap')) return;

    const wrap = U.el('div', '');
    wrap.id = 'adfit-banner-wrap';
    wrap.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      z-index: 999;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(10,10,15,0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,0.08);
      padding: 6px 0;
      min-height: 62px;
    `;

    // AdFit 스크립트 삽입
    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.cssText = 'display:none;';
    ins.setAttribute('data-ad-unit', this.ADFIT_UNIT_ID);
    ins.setAttribute('data-ad-width', '320');
    ins.setAttribute('data-ad-height', '50');

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;

    wrap.appendChild(ins);
    wrap.appendChild(script);
    document.body.appendChild(wrap);

    // 광고 영역만큼 하단 여백 추가
    document.documentElement.style.setProperty('--ad-banner-height', '62px');
  },


  updateNav(name) {
    U.$$('.top-nav-item').forEach(i => i.classList.toggle('active', i.dataset.s === name));
  },

  showModal(title, content) {
    this.closeModal();
    const bg = U.el('div','modal-bg');
    bg.id = 'app-modal';
    bg.innerHTML = `<div class="modal-panel"><div class="modal-handle"></div><h3 class="modal-title">${title}</h3><div class="modal-list">${content}</div></div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target===bg) this.closeModal(); });
    requestAnimationFrame(() => bg.classList.add('open'));
  },

  closeModal() {
    const bg = U.$('#app-modal');
    if (bg) {
      bg.classList.remove('open');
      setTimeout(() => bg.remove(), 300);
    }
  },

  showBottomSheet(title, content) {
    this.closeBottomSheet();
    const bg = U.el('div','modal-bg');
    bg.id = 'app-bottom-sheet';
    bg.innerHTML = `<div class="modal-panel" style="padding-bottom:env(safe-area-inset-bottom); border-radius: 20px 20px 0 0;"><div class="modal-handle"></div><h3 class="modal-title" style="text-align:left; font-size:20px; font-weight:800; margin-bottom:16px;">${title}</h3><div class="modal-list">${content}</div></div>`;
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target===bg) this.closeBottomSheet(); });
    requestAnimationFrame(() => bg.classList.add('open'));
  },

  closeBottomSheet() {
    const bg = U.$('#app-bottom-sheet');
    if (bg) {
      bg.classList.remove('open');
      setTimeout(() => bg.remove(), 300);
    }
  },

  openAddressSearch(title, onSelectCallback) {
    this.closeModal();
    const bg = U.el('div','modal-bg');
    bg.id = 'app-modal';
    
    // We attach search logic to window so HTML string buttons can call it
    window._searchAddress = async () => {
      const input = U.$('#addr-search-input');
      const keyword = input.value.trim();
      if (!keyword) { U.toast('검색어를 입력해주세요'); return; }
      
      const resContainer = U.$('#addr-search-results');
      resContainer.innerHTML = '<div style="padding:var(--sp-4);text-align:center;color:var(--text-light)">검색 중...</div>';
      
      const places = await TmapAPI.searchPlace(keyword, false);
      if (!places || places.length === 0) {
        resContainer.innerHTML = '<div style="padding:var(--sp-4);text-align:center;color:var(--text-light)">검색 결과가 없습니다.</div>';
        return;
      }
      
      // Save globally for callback reference
      window._addrSearchResults = places;
      
      resContainer.innerHTML = places.map((p, i) => `
        <div class="list-item" style="cursor:pointer" onclick="window._selectAddress(${i})">
          <div class="item-title">${p.name || p.place_name}</div>
          ${(p.address || p.address_name) ? `<div class="item-sub">${p.address || p.address_name}</div>` : ''}
        </div>
      `).join('');
    };

    window._selectAddress = (idx) => {
      const p = window._addrSearchResults[idx];
      onSelectCallback({
        name: p.name || p.place_name,
        lat: p.lat || p.y,
        lng: p.lng || p.x
      });
      App.closeModal();
    };

    bg.innerHTML = `
      <div class="modal-panel" style="display:flex; flex-direction:column; height:80vh;">
        <div class="modal-handle"></div>
        <h3 class="modal-title">${title}</h3>
        <div style="padding:0 var(--sp-4) var(--sp-4) var(--sp-4); display:flex; gap:var(--sp-2);">
          <input type="text" id="addr-search-input" class="address-input" placeholder="정확한 주소 또는 건물명" style="flex:1" onkeypress="if(event.key==='Enter') window._searchAddress()" />
          <button class="btn btn-primary" onclick="window._searchAddress()" style="width:auto; padding:0 var(--sp-4);">검색</button>
        </div>
        <div id="addr-search-results" class="modal-list" style="flex:1; overflow-y:auto;">
          <div style="padding:var(--sp-4);text-align:center;color:var(--text-light)">검색어를 입력하고 검색 버튼을 누르세요.</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(bg);
    bg.addEventListener('click', e => { if (e.target===bg) this.closeModal(); });
    requestAnimationFrame(() => {
      bg.classList.add('open');
      const input = U.$('#addr-search-input');
      if (input) setTimeout(() => input.focus(), 100);
    });
  },

  showHqToast(noti) {
    const container = document.getElementById('hq-toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'hq-toast' + (noti.isUrgent ? ' urgent' : '');
    
    toast.innerHTML = `
      <div style="font-size:20px;">${noti.isUrgent ? '🚨' : '📢'}</div>
      <div style="flex:1;">
        <div style="font-weight:700; margin-bottom:4px;">본사 공지사항</div>
        <div style="line-height:1.4;">${noti.content.replace(/\\n/g, '<br/>')}</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:6px;">${new Date(noti.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
      </div>
      <button style="background:transparent; border:none; color:#cbd5e1; font-size:16px; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(toast);
    
    // 10초 후 자동 닫기 (긴급이 아닐 경우만)
    if (!noti.isUrgent) {
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 10000);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
