/* =========================================
   ManagerPlanner — App Router
   ========================================= */

const App = {
  screens: ['home','register','timeline','login','onboarding','profile','upgrade'],

  async init() {
    if (!State.loadSchedules()) {
      State.initDemo();
    }
    this.loadPreferences();
    this.renderNav();
    this.renderAdBanner();
    
    // 1. HQ 실시간 알림 수신 (BroadcastChannel - 로컬/크로스탭)
    // 1. HQ 실시간 알림 수신 (BroadcastChannel - 로컬/크로스탭)
    this.hqBc = new BroadcastChannel('HQ_PLANNER_CHANNEL');
    this.hqBc.onmessage = (e) => {
      if (e.data && e.data.type === 'NEW_HQ_MESSAGE') {
        const noti = e.data.payload;
        this.showHqToast(noti);
      } else if (e.data && (e.data.type === 'SCHEDULES_SAVED' || e.data.type === 'SCHEDULE_UPDATE' || e.data.type === 'SCHEDULE_DELETE' || e.data.type === 'MANAGER_ASSIGNED' || e.data.type === 'ARTISTS_SAVED' || e.data.type === 'VEHICLES_SAVED')) {
        this.refreshActiveScreens();
      }
    };

    // 로컬 창 및 탭 간 커스텀 이벤트/스토리지 이벤트 즉시 수신
    window.addEventListener('hq-store-change', (event) => {
      const type = event.detail?.type;
      if (type === 'SERVER_WRITE_FAILED') U.toast('서버에 저장하지 못했습니다. 기기에는 저장되어 있어요.');
      if (type === 'SCHEDULE_SYNC_FAILED' || type === 'SUPABASE_SYNC_FAILED') U.toast('기기에 저장되어 있습니다. 서버 동기화에 실패해 재시도가 필요합니다.');
      else if (type === 'SCHEDULE_SYNC_PENDING') U.toast('기기에 저장됨 · 서버 동기화 대기 중');
      this.refreshActiveScreens();
    });
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key.startsWith('HQ_') || e.key.startsWith('bp_')) {
        this.refreshActiveScreens();
      }
    });

    // 2. Supabase Cloud Realtime 구독 (기기 간 실시간 동기화)
    // Realtime subscriptions start only after a verified session.

    // 3. 네트워크 온라인/오프라인 상태 감지
    window.addEventListener('online', async () => {
      U.toast('네트워크 연결 복구 · 동기화 확인 중');
      try {
        const session = await window.SupabaseClient?.getCurrentSession();
        if (!session) return;
        const result = await window.hqStore?.flushPendingSchedules();
        await window.hqStore?.syncFromSupabase();
        if (result?.pending || result?.deferred) U.toast('기기에 저장됨 · 아직 동기화 대기 중인 일정이 있습니다.');
        else U.toast('서버 동기화를 확인했습니다.');
        this.refreshActiveScreens();
      } catch (error) {
        U.toast('기기에 저장된 일정을 유지합니다. 서버 동기화를 다시 시도해주세요.');
      }
    });
    window.addEventListener('offline', () => {
      U.toast('📶 오프라인 모드 전환 (로컬 데이터 보관)');
    });
    
    State.isPro = localStorage.getItem('bp_pro') === 'true';
    this.navigate('login');
    try {
      const session = await window.SupabaseClient?.getCurrentSession();
      if (session?.user && session.profile) {
        Login.finishLogin('supabase', { ...session.profile, id: session.user.id, email: session.user.email });
      } else {
        localStorage.removeItem('bp_logged_in');
        localStorage.removeItem('bp_user_role');
      }
    } catch (error) {
      localStorage.removeItem('bp_logged_in');
      localStorage.removeItem('bp_user_role');
      U.toast('로그인 권한을 확인할 수 없습니다. 다시 로그인해주세요.');
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
    this.startAutoSync();
    if (window.Chat) {
      window.Chat.onUnreadChange = () => { try { this.updateNoticeBadge(); } catch (e) { } };
      window.Chat.onIncoming = (m, room, name) => {
        this.showHqToast({ id: 'chat_' + m.id, title: (m.is_urgent ? '🚨 ' : '💬 ') + (name || '본사'), content: m.body || '(사진)', isUrgent: !!m.is_urgent, targetId: 'ALL' });
      };
      window.Chat.init();
    }
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
          if (window.hqStore) window.hqStore.syncFromSupabase().then(() => this.updateNoticeBadge()).catch(() => { });
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
    U.$('#top-header')?.remove();
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
        <span>🎬</span><span class="top-brand-text">로디플래너</span>
      </div>
      <div class="top-nav-right" style="display:flex; align-items:center; gap:6px; padding-right:10px;">
        <button class="notice-bell" onclick="App.openEmergencyModal()" aria-label="긴급 지원" style="color:#ef4444;font-size:17px;">🚨</button>
        <button id="notice-bell" class="notice-bell" onclick="App.openMessages()" aria-label="로디톡">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span id="notice-badge" class="notice-badge" hidden>0</span>
        </button>
        <span class="top-user">
          <span class="top-user-icon" style="font-size:13px;">👤</span><span class="top-user-name">${esc((localStorage.getItem('bp_user_name') || '김태현').replace(/본부장|팀장|매니저/g, '').trim())}</span><span class="top-user-suffix">님</span>
        </span>
        <button onclick="if(typeof Home !== 'undefined' && Home.logout) Home.logout(); else if(typeof App !== 'undefined' && App.logout) App.logout();" style="background:#fee2e2; color:#ef4444; border:1px solid #fecaca; padding:3px 6px; border-radius:6px; font-size:10px; font-weight:900; line-height:1.15; cursor:pointer; text-align:center; transition:all 0.15s; white-space:nowrap; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <span>로그</span>
          <span>아웃</span>
        </button>
      </div>
    `;
    // Prepend to app instead of append so it's logically first
    U.$('#app').prepend(nav);
    try { this.updateNoticeBadge(); } catch (e) { }
  },

  // 카카오 AdFit 광고 단위 ID (발급 후 교체)
  ADFIT_UNIT_ID: 'DAN-XXXXXXXXXXXXXXXX',

  renderAdBanner() {
    // 광고 번호가 임시값(DAN-XXXX...)이면 빈 검은 막대만 화면을 가리므로 만들지 않음
    if (!this.ADFIT_UNIT_ID || /X{4,}/.test(this.ADFIT_UNIT_ID)) return;
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
    bg.innerHTML = `<div class="modal-panel"><div class="modal-handle"></div><h3 class="modal-title">${esc(title)}</h3><div class="modal-list">${content}</div></div>`;
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
    bg.innerHTML = `<div class="modal-panel" style="padding-bottom:env(safe-area-inset-bottom); border-radius: 20px 20px 0 0;"><div class="modal-handle"></div><h3 class="modal-title" style="text-align:left; font-size:20px; font-weight:800; margin-bottom:16px;">${esc(title)}</h3><div class="modal-list">${content}</div></div>`;
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
          <div class="item-title">${esc(p.name || p.place_name)}</div>
          ${(p.address || p.address_name) ? `<div class="item-sub">${esc(p.address || p.address_name)}</div>` : ''}
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
        <h3 class="modal-title">${esc(title)}</h3>
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
    if (!noti || !noti.content) return;
    this._toasted = this._toasted || new Set();
    if (noti.id) { if (this._toasted.has(noti.id)) return; this._toasted.add(noti.id); }
    setTimeout(() => { try { this.updateNoticeBadge(); } catch (e) { } }, 0);
    const container = document.getElementById('hq-toast-container');
    if (!container) return;

    // 수신 대상 필터링: 전체 공지거나 본인 ID가 일치할 때만 표시
    if (noti.targetId && noti.targetId !== 'ALL') {
      const currentMgrId = localStorage.getItem('bp_user_id') || localStorage.getItem('bp_manager_id');
      if (currentMgrId && noti.targetId !== currentMgrId) return;
    }

    // 진동 알림
    if (navigator.vibrate) {
      try {
        navigator.vibrate(noti.isUrgent ? [200, 100, 200, 100, 300] : [150, 100, 150]);
      } catch (e) {}
    }
    
    const toast = document.createElement('div');
    toast.className = 'hq-toast' + (noti.isUrgent ? ' urgent' : '');
    
    const timeStr = noti.createdAt ? new Date(noti.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '방금 전';
    const safeContent = (noti.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

    toast.innerHTML = `
      <div style="font-size:22px; flex-shrink:0;">${noti.isUrgent ? '🚨' : '📢'}</div>
      <div style="flex:1; min-width:0;">
        <div style="font-weight:800; font-size:13.5px; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
          <span>${noti.isUrgent ? '본사 긴급 공지' : '본사 알림'}</span>
          <span style="font-size:10.5px; font-weight:700; padding:1px 6px; border-radius:10px; ${noti.isUrgent ? 'background:#ef4444; color:#fff;' : 'background:#3b82f6; color:#fff;'}">${noti.isUrgent ? 'URGENT' : 'NOTICE'}</span>
        </div>
        <div style="line-height:1.45; font-size:13px; color:#f1f5f9; word-break:break-word;">${safeContent}</div>
        <div style="font-size:11px; color:#94a3b8; margin-top:6px;">${esc(timeStr)}</div>
      </div>
      <button style="background:transparent; border:none; color:#94a3b8; font-size:16px; cursor:pointer; padding:2px 4px; line-height:1;" onclick="this.parentElement.remove()" title="닫기">✕</button>
    `;
    
    container.appendChild(toast);
    
    // 10초 후 자동 닫기 (긴급이 아닐 경우)
    if (!noti.isUrgent) {
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 10000);
    }
  },

  // ── 공지 읽음 표시 / 자동 갱신 ──
  _myNoticeTarget() {
    return localStorage.getItem('bp_user_id') || localStorage.getItem('bp_manager_id') || window.SupabaseClient?.currentUser?.id || '';
  },

  _myNotices() {
    let list = [];
    try { list = window.hqStore?.getBroadcasts?.() || []; } catch (e) { }
    const me = this._myNoticeTarget();
    return list.filter(n => !n.targetId || n.targetId === 'ALL' || !me || n.targetId === me);
  },

  _seenNotices() {
    try { return new Set(JSON.parse(localStorage.getItem('bp_seen_notices') || '[]')); } catch (e) { return new Set(); }
  },

  updateNoticeBadge() {
    const badge = document.getElementById('notice-badge');
    if (!badge) return;
    const chatOn = !!(window.Chat && window.Chat.available());
    const seen = this._seenNotices();
    const unread = chatOn ? window.Chat.totalUnread() : this._myNotices().filter(n => !seen.has(n.id)).length;
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.hidden = unread === 0;
  },

  markNoticesSeen() {
    const seen = this._seenNotices();
    this._myNotices().forEach(n => seen.add(n.id));
    try { localStorage.setItem('bp_seen_notices', JSON.stringify([...seen].slice(-200))); } catch (e) { }
    this.updateNoticeBadge();
  },

  // 서버에서 새 자료를 주기적으로 받아온다 (앱이 화면에 보일 때만, 45초마다)
  startAutoSync() {
    if (this._autoSyncStarted) return;
    this._autoSyncStarted = true;
    this._knownNotices = new Set(this._myNotices().map(n => n.id));
    this._toasted = this._toasted || new Set();
    const run = async () => {
      if (document.hidden || this._autoSyncBusy || navigator.onLine === false) return;
      if (!window.SupabaseClient?.currentUser) return;
      this._autoSyncBusy = true;
      try {
        await window.hqStore.syncFromSupabase();
        for (const n of this._myNotices()) {
          if (this._knownNotices.has(n.id)) continue;
          this._knownNotices.add(n.id);
          if (!this._toasted.has(n.id)) this.showHqToast({ id: n.id, title: n.title, content: n.content, isUrgent: n.urgent, targetId: n.targetId });
        }
        this.refreshActiveScreens();
        this.updateNoticeBadge();
      } catch (e) { /* 실패해도 다음 주기에 다시 시도 */ }
      finally { this._autoSyncBusy = false; }
    };
    this._autoSyncTimer = setInterval(run, 45000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
    this.updateNoticeBadge();
  },

  // 종 버튼: 서버 연결 시 대화창, 아니면 기존 공지함
  openMessages() {
    if (window.Chat && window.Chat.available()) window.Chat.open();
    else this.openNoticeModal();
  },

  openNoticeModal() {
    let notices = [];
    try {
      if (window.hqStore && window.hqStore.getBroadcasts) {
        notices = window.hqStore.getBroadcasts();
      }
    } catch(e) {}
    
    const isDevHost = ['localhost', '127.0.0.1', ''].includes(location.hostname) || location.protocol === 'file:';
    if ((!notices || notices.length === 0) && isDevHost) {
      notices = [
        { id: 'n1', title: '📢 [전사 공지] 아티스트 해외 투어 스케줄 및 의전 동선 지침', content: '공항 출입국 및 현지 의전 차량 동선 사전 점검 필수입니다. 비상 연락망을 항시 유지해 주세요.', date: '2025-10-15', urgent: true },
        { id: 'n2', title: '🚗 [운영] 법인 차량 가을철 정기 점검 및 소모품 교체 안내', content: '지정 정비소(성수/강남) 방문 후 영수증 정산 등록 부탁드립니다.', date: '2025-10-12', urgent: false },
        { id: 'n3', title: '🎬 [방송] 음악방송 사전녹화 인원 출입 비표 발급 공지', content: 'KBS 뮤직뱅크 및 SBS 인기가요 출입 비표 명단이 본사 관제 포털에 업데이트되었습니다.', date: '2025-10-10', urgent: false }
      ];
    }

    this.markNoticesSeen();
    const html = `
      <div class="modal-bg center open" id="hq-notice-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-panel" style="max-height:85vh; padding: 20px 16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              </div>
              <h2 style="font-size:17px; font-weight:800; color:var(--text-100); margin:0;">HQ 본사 공지 & 알림함</h2>
            </div>
            <button onclick="document.getElementById('hq-notice-modal').remove()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:50%;cursor:pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-400)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          
          <div style="display:flex; flex-direction:column; gap:12px; overflow-y:auto; max-height:65vh;">
            ${(!notices || notices.length === 0) ? '<div style="text-align:center;padding:36px 12px;color:var(--text-400);font-size:14px;">등록된 공지가 없습니다.</div>' : ''}
            ${notices.map(n => `
              <div style="background:var(--bg-card); border:1px solid ${n.urgent ? 'rgba(239,68,68,0.35)' : 'var(--border-subtle)'}; border-radius:var(--r-lg); padding:14px; position:relative;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                  <span style="font-size:11px; font-weight:800; padding:2px 8px; border-radius:6px; ${n.urgent ? 'background:#ef4444; color:#fff;' : 'background:var(--primary-500); color:#fff;'}">${n.urgent ? '긴급 공지' : '본사 공지'}</span>
                  <span style="font-size:11px; color:var(--text-400);">${esc(n.date || '최신')}</span>
                </div>
                <div style="font-size:14px; font-weight:700; color:var(--text-100); margin-bottom:6px;">${esc(n.title)}</div>
                <div style="font-size:12.5px; color:var(--text-300); line-height:1.5;">${esc(n.content)}</div>
              </div>
            `).join('')}
          </div>
          <button onclick="document.getElementById('hq-notice-modal').remove()" class="btn btn-primary" style="width:100%; margin-top:16px;">확인 완료</button>
        </div>
      </div>
    `;
    const old = document.getElementById('hq-notice-modal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  },

  openEmergencyModal() {
    const html = `
      <div class="modal-bg center open" id="hq-emergency-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-panel" style="padding:20px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <h2 style="font-size:17px;font-weight:800;color:#f87171;margin:0;">HQ 본사 긴급 지원</h2>
            </div>
            <button onclick="document.getElementById('hq-emergency-modal').remove()" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:50%;cursor:pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-400)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;">
            <!-- 본사 연락처 (우리 회사 본사 계정에 등록된 실제 전화번호) -->
            <div id="em-hq-contacts" style="display:flex;flex-direction:column;gap:10px;">
              <div style="font-size:12px;color:var(--text-400);padding:6px 4px;">본사 연락처를 불러오는 중...</div>
            </div>

            <!-- 긴급 보고 -->
            <div onclick="if(typeof Profile!=='undefined'){document.getElementById('hq-emergency-modal').remove();Profile.reportEmergency();}"
              style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;">
              <div style="width:40px;height:40px;border-radius:50%;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <div style="flex:1;">
                <div style="font-size:14px;font-weight:700;color:var(--text-100);">현장 돌발상황 / 사고 긴급 보고</div>
                <div style="font-size:11.5px;color:var(--text-400);margin-top:2px;">본사 관제 포털로 실시간 긴급 푸시 전송</div>
              </div>
              <span style="background:rgba(245,158,11,0.12);color:#f59e0b;font-size:11px;font-weight:800;padding:3px 9px;border-radius:6px;white-space:nowrap;">보고서</span>
            </div>
          </div>

          <button onclick="document.getElementById('hq-emergency-modal').remove()" class="btn btn-secondary" style="width:100%;margin-top:16px;">닫기</button>
        </div>
      </div>
    `;
    const old = document.getElementById('hq-emergency-modal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    this._loadEmergencyContacts();
  },

  // 우리 회사 본사 계정(대표/관리자)에 등록된 실제 전화번호를 보여준다 (샘플 번호는 쓰지 않음)
  async _loadEmergencyContacts() {
    const box = document.getElementById('em-hq-contacts'); if (!box) return;
    const note = (t) => { box.innerHTML = `<div style="font-size:12.5px;line-height:1.55;color:var(--text-400);background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:14px;padding:12px 14px;">${esc(t)}</div>`; };
    try {
      const sc = window.SupabaseClient;
      if (!sc?.client || !sc.currentUser) { note('서버에 연결되면 본사 연락처가 표시됩니다. 아래 "긴급 보고"로 먼저 알릴 수 있습니다.'); return; }
      const { data, error } = await sc.client.from('profiles').select('name, phone, role').in('role', ['ceo', 'hq_admin']);
      if (error) throw error;
      const rows = (data || []).filter(p => p.phone && String(p.phone).replace(/[^0-9+]/g, '').length >= 8);
      if (!rows.length) { note('본사 연락처가 아직 등록되지 않았습니다. 본사 관리자에게 프로필에 전화번호를 등록해 달라고 요청하세요. 지금은 아래 "긴급 보고"로 알릴 수 있습니다.'); return; }
      box.innerHTML = rows.map(p => {
        const tel = String(p.phone).replace(/[^0-9+]/g, '');
        return `<a href="tel:${esc(tel)}" style="text-decoration:none;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:14px;padding:14px 16px;display:flex;align-items:center;gap:12px;">
          <div style="flex:1;"><div style="font-size:14px;font-weight:800;color:#f87171;">📞 ${esc(p.name || '본사')} ${p.role === 'ceo' ? '(대표)' : '(관리자)'}</div>
          <div style="font-size:12px;color:var(--text-400);margin-top:2px;">${esc(p.phone)} · 누르면 전화 연결</div></div></a>`;
      }).join('');
    } catch (e) { note('본사 연락처를 불러오지 못했습니다. 아래 "긴급 보고"를 이용해 주세요.'); }
  }
};


document.addEventListener('DOMContentLoaded', () => App.init());
