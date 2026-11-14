/* =========================================
   RoadPlanner — Profile Screen Logic
   ========================================= */

/* ── SVG 아이콘 모음 ── */
const ProfileIcons = {
  phone:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.54 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.28-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  shield:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  zap:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  user:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  car:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l4 4v6a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/><path d="M14 9h-3V5"/></svg>`,
  home:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  building: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
  mic:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  scissors: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  moon:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  type:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  textSize: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5h8v2"/><path d="M7 5v14"/><path d="M13 13v-2h6v2"/><path d="M16 11v8"/></svg>`,
  map:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
  bell:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  info:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  file:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  headphones:`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
  logOut:   `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  pin:      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  chevron:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  edit:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  tv:       `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>`,
  plane:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
};

const Profile = {
  fontMap: { 'sans': '고딕', 'serif': '명조', 'round': '둥근고딕' },
  sizeMap: { 'sm': '작게', 'md': '보통', 'lg': '크게' },

  render() {
    const app = U.$('#screen-profile');
    if (!app) return;

    const currentFont = localStorage.buddy_fontType || 'sans';
    const currentSize = localStorage.buddy_fontSize || 'md';
    const currentNavi = localStorage.getItem('bp_preferred_navi') || 'choice';

    const hData = State.userAddresses?.home || {name:''};
    const wData = State.userAddresses?.office || {name:''};
    const aData = State.userAddresses?.artist || {name:''};
    const sData = State.userAddresses?.shop || {name:''};
    const homeName   = hData.name || '';
    const workName   = wData.name || '';
    const artistName = aData.name || '';
    const shopName   = sData.name || '';

    const userName       = localStorage.getItem('bp_user_name')    || '현장 매니저';
    const userEmail      = localStorage.getItem('bp_user_email')   || '';
    const userCompany    = localStorage.getItem('bp_company_name') || '';
    const userDept       = localStorage.getItem('bp_dept_name')    || '';
    const indie = typeof Plan !== 'undefined' && Plan.isIndie();   // 개인 매니저 (본사 없음)
    const paid = !indie || Plan.isPaid();
    const lock = (f) => (indie && f === 'autonav' && !Plan.can(f) && !Plan.trialUsed()) ? '<span style="font-size:12px;font-weight:800;color:#1F7A4C;background:#E7F5EE;border:1px solid #BFE3CF;padding:3px 9px;border-radius:999px;white-space:nowrap;">7일 무료 체험</span>'
      : (indie && f === 'autonav' && !Plan.isPaid() && Plan.trialActive()) ? `<span style="font-size:12px;font-weight:800;color:#1F7A4C;background:#E7F5EE;border:1px solid #BFE3CF;padding:3px 9px;border-radius:999px;white-space:nowrap;">체험 ${Plan.trialLeftText()}</span>`
      : (indie && !Plan.can(f)) ? '<span style="font-size:12px;font-weight:800;color:#4C57D6;background:#EEF0FD;border:1px solid #D5D9F7;padding:3px 9px;border-radius:999px;white-space:nowrap;">🔒 유료</span>' : ProfileIcons.chevron;
    if (indie && !this._planChecked) { this._planChecked = true; Plan.refresh().then(() => { if (State.screen === 'profile') this.render(); }); }
    // 담당 아티스트: 본사가 지정한 아티스트 ID → 이름
    const assignedArtists = (() => {
      let ids = [];
      try { ids = JSON.parse(localStorage.getItem('bp_assigned_artists') || '[]') || []; } catch (e) { }
      const all = window.hqStore?.getArtists?.() || [];
      return ids.map(id => (all.find(a => a.id === id)?.name || '').replace(/\s*\([^)]*\)/g, '').trim()).filter(Boolean);
    })();

    const allArtists = window.hqStore?.getArtists?.() || [];
    const artistChips = (() => {
      let ids = [];
      try { ids = JSON.parse(localStorage.getItem('bp_assigned_artists') || '[]') || []; } catch (e) { }
      if (indie) ids = allArtists.map(a => a.id);
      return ids.map(id => allArtists.find(a => a.id === id)).filter(Boolean)
        .map(a => `<span class="me-chip" style="--c:${esc(a.color || '#4C57D6')}">${esc(String(a.name || '').replace(/\s*\([^)]*\)/g, '').trim())}</span>`).join('');
    })();
    const phone = window.SupabaseClient?.currentProfile?.phone || localStorage.getItem('bp_user_phone') || '';
    const vehicle = localStorage.getItem('bp_user_vehicle') || '';
    const prep = localStorage.getItem('bp_buffer_prep') ?? '60';
    const isHQ = ['ceo', 'hq_admin'].includes(localStorage.getItem('bp_user_role'));
    const chev = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
    const row = (label, sub, right, action, extra = '') => `
      <button type="button" class="me-row ${extra}" onclick="${action}">
        <span class="me-row-txt"><span class="me-row-label">${label}</span>${sub ? `<span class="me-row-sub">${sub}</span>` : ''}</span>
        <span class="me-row-right">${right}</span>
      </button>`;

    app.innerHTML = `
      <div class="header me-header">
        <h1 class="header-title">내 정보</h1>
      </div>

      <div class="screen-scroll me-wrap">

        <!-- 프로필 -->
        <section class="me-card">
          <div class="me-prof">
            <span class="me-avatar">${esc(userName.slice(0, 1) || '나')}</span>
            <span class="me-prof-txt">
              <span class="me-name">${esc(userName)}</span>
              <span class="me-sub">${indie ? `개인 매니저 · ${paid ? '유료' : '무료'}` : esc([userCompany, userDept].filter(Boolean).join(' · '))}</span>
              ${userEmail ? `<span class="me-sub" style="font-size:12px;">${esc(userEmail)}</span>` : ''}
            </span>
          </div>
          <div class="me-artists">
            <span class="me-sub">${indie ? '내 아티스트' : '담당 아티스트 · 본사에서 배정'}</span>
            <div class="me-chips">${artistChips || `<span class="me-sub">${indie ? '아직 등록한 아티스트가 없어요' : '아직 배정된 아티스트가 없어요'}</span>`}${indie ? `<button type="button" class="me-chip-add" onclick="App.navigate('artists')">관리</button>` : ''}</div>
          </div>
        </section>

        ${indie ? `
        <section class="me-plan ${paid ? 'paid' : ''}">
          <span class="me-row-txt">
            <span class="me-row-label" style="font-weight:800;">${paid ? `유료 사용 중 ${esc(Plan.untilText())}` : '무료로 쓰는 중'}</span>
            <span class="me-row-sub">${paid ? '로드비서·자동 길안내·교통 예측·아티스트 여러 명·경비 기록' : `월 ${Plan.FEE.toLocaleString()}원이면 로드비서·자동 길안내·교통 예측·경비 기록을 모두 쓸 수 있어요.`}</span>
          </span>
          <button type="button" onclick="App.navigate('upgrade')">${paid ? '연장하기' : '유료 알아보기'}</button>
        </section>` : ''}

        <!-- 업무 -->
        <section class="me-group">
          <h2>업무</h2>
          <div class="me-box">
            ${phone ? row('휴대폰 번호', esc(phone), chev, 'Profile.editContact()')
                    : row('휴대폰 번호', indie ? '아직 없어요 · 연락처로 쓰는 번호예요' : '아직 없어요 · 본사가 긴급할 때 연락할 번호예요', '<span class="me-warn-btn">등록</span>', 'Profile.editContact()', 'warn')}
            ${indie ? row('차량관리 · 경비 기록', esc(vehicle || '차량 등록 안 됨') + (Plan.can('expenses') ? ' · 영수증·월별 정산' : ' · 경비 기록은 유료'), chev, 'Vehicle.open()')
                    : row('경비 기록', '주유 · 주차 · 식비 영수증, 월별 합계 · 정산', chev, 'Expenses.open()') + row('배정 차량', esc(vehicle || '등록 안 됨'), chev, 'Profile.editVehicle()')}
            ${isHQ ? row('본사 관제 포털 열기', '관리자용 · 새 창', chev, `window.open(${escJs(typeof U !== 'undefined' && U.getHQPortalUrl ? U.getHQPortalUrl() : 'admin.html')}, '_blank', 'noopener')`) : ''}
          </div>
        </section>

        <!-- 알림 · 길안내 -->
        <section class="me-group">
          <h2>알림 · 길안내</h2>
          <div class="me-box">
            <div class="me-row me-row-static">
              <span class="me-row-txt" style="gap:8px; width:100%;">
                <span class="me-row-label">기본 내비</span>
                <span class="me-seg" role="group" aria-label="기본 내비">
                  <button class="setting-opt-btn${currentNavi === 'tmap' ? ' active' : ''}" aria-pressed="${currentNavi === 'tmap'}" onclick="Profile.setNavi('tmap',this)">티맵</button>
                  <button class="setting-opt-btn${currentNavi === 'kakao' ? ' active' : ''}" aria-pressed="${currentNavi === 'kakao'}" onclick="Profile.setNavi('kakao',this)">카카오내비</button>
                  <button class="setting-opt-btn${currentNavi === 'choice' ? ' active' : ''}" aria-pressed="${currentNavi === 'choice'}" onclick="Profile.setNavi('choice',this)">매번 선택</button>
                </span>
              </span>
            </div>
            ${row('기상 · 준비 알림', '첫 출발 전에 미리 알려 드려요', `<span class="me-val">${Number(prep) > 0 ? esc(prep) + '분 전' : '끔'}</span>`, 'Profile.editPrep()')}
            ${row('차에 타면 자동 길안내', '차와 연결되면 다음 일정으로 내비를 켜요', lock('autonav'), indie ? "Plan.require('autonav') && AutoNav.openGuide()" : 'AutoNav.openGuide()')}
            ${row('알림 받기', indie ? '기상 · 출발 15분 전 · 내일 일정(밤 9시)' : '출발 15분 전 · 내일 일정(밤 9시) · 일정 변경 · 로드톡', '<span id="push-state-badge" class="me-badge">확인 중</span>', 'Profile.togglePush()')}
          </div>
        </section>

        <!-- 계정 -->
        <section class="me-group">
          <h2>계정</h2>
          <div class="me-box">
            ${row('위치 정보', (window.Loc && Loc.ok()) ? '동의함 · 이용·제공 내역 보기' : '동의 안 함 · 위치 대신 주소를 적어요', chev, 'Loc.openSettings()')}
            ${row('계정 전환', '', chev, 'Profile.switchAccount()')}
            ${row('<span style="color:#dc2626;">로그아웃</span>', '', '', 'Profile.logout()', 'me-logout')}
          </div>
          <div class="me-foot">
            <button type="button" onclick="Profile.showVersion()">v1.0.0</button> ·
            <button type="button" onclick="window.open('./terms.html', '_blank', 'noopener')">이용약관</button> ·
            <button type="button" onclick="window.open('./privacy.html', '_blank', 'noopener')">개인정보처리방침</button> ·
            <button type="button" onclick="window.open('./location-terms.html', '_blank', 'noopener')">위치기반서비스 이용약관</button>
          </div>
        </section>
      </div>
    `;
    setTimeout(() => this._renderPushBadge(), 0);
  },

  /* ── 헬퍼: 섹션 블록 생성 ── */
  _section(title, type, items) {
    const titleColor = type === 'red' ? 'color:#f87171;' : '';
    const rows = items.map((item, i) => {
      const border = i < items.length - 1 ? 'border-bottom:1px solid var(--border-subtle);' : '';
      return `
        <div onclick="${item.action}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;${esc(border)}cursor:pointer;">
          <span style="color:${type==='red'?'#f87171':'var(--primary-400)'};flex-shrink:0;">${item.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:700;color:var(--text-100);">${esc(item.label)}</div>
            ${item.sub ? `<div style="font-size:12.5px;color:var(--text-400);margin-top:2px;">${esc(item.sub)}</div>` : ''}
          </div>
          <div style="flex-shrink:0;color:var(--text-400);">${item.badge}</div>
        </div>`;
    }).join('');
    return `
      <div style="margin:0 var(--sp-5) var(--sp-4);">
        <div class="profile-section-title" style="margin-bottom:10px;${esc(titleColor)}">${esc(title)}</div>
        <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:16px;overflow:hidden;">
          ${rows}
        </div>
      </div>`;
  },

  /* ── 헬퍼: 주소 아이템 ── */
  _addrItem(icon, label, value, placeholder, action, border) {
    return `
      <div onclick="${action}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;${border?'border-bottom:1px solid var(--border-subtle);':''}cursor:pointer;">
        <span style="color:var(--primary-400);flex-shrink:0;">${icon}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;color:var(--text-400);margin-bottom:2px;">${esc(label)}</div>
          <div style="font-size:14px;font-weight:${value?'600':'400'};color:${value?'var(--text-100)':'var(--text-400)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(value || placeholder)}</div>
        </div>
        <div style="color:var(--text-400);flex-shrink:0;">${ProfileIcons.chevron}</div>
      </div>`;
  },

  setFont(type, el) {
    localStorage.buddy_fontType = type;
    document.documentElement.setAttribute('data-font', type);
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    U.toast(`글꼴이 '${this.fontMap[type]}'으로 변경되었습니다.`);
    U.haptic();
  },

  setSize(size, el) {
    localStorage.buddy_fontSize = size;
    document.documentElement.setAttribute('data-size', size);
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    U.toast(`글자 크기가 '${this.sizeMap[size]}'로 변경되었습니다.`);
    U.haptic();
  },

  setNavi(naviType, el) {
    localStorage.setItem('bp_preferred_navi', naviType);
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    const label = naviType === 'tmap' ? '티맵' : naviType === 'kakao' ? '카카오내비' : '매번 선택';
    U.toast(naviType === 'ask' || label === '매번 선택' ? '내비를 매번 고르도록 바꿨어요' : `기본 내비를 ${label}(으)로 바꿨어요`);
    U.haptic();
  },

  setTheme(mode, el) {
    localStorage.setItem('bp_theme', mode);
    const siblings = el.parentElement.querySelectorAll('.setting-opt-btn');
    siblings.forEach(s => s.classList.remove('active'));
    el.classList.add('active');
    U.toast(`테마가 변경되었습니다.`);
    U.haptic();
  },

  async togglePush() {
    U.haptic && U.haptic();
    const C = window.Chat;
    if (!C || !C.pushState) { U.toast('잠시 후 다시 시도해 주세요.'); return; }
    const st = await C.pushState();
    if (st === 'unsupported') {
      if (window.RoadPlannerAndroid) { U.toast('안드로이드 앱은 출발 15분 전 알림이 폰에 자동으로 예약돼요. (휴대폰 설정에서 로드플래너 알림 허용)'); this._renderPushBadge(); return; }
      const inApp = !!window.webkit?.messageHandlers;
      U.toast(inApp ? '아이폰 앱 알림은 다음 앱 업데이트에서 켜집니다. 지금은 앱이 켜져 있을 때 화면으로 알려 드려요.' : '이 브라우저는 푸시를 지원하지 않습니다. 아이폰은 사파리에서 "홈 화면에 추가"한 앱에서 켤 수 있어요.');
    } else if (st === 'denied') U.toast('알림이 차단되어 있습니다. 휴대폰 설정 > 알림에서 허용해 주세요.');
    else if (st === 'on') { if (confirm('알림을 끌까요?')) await C.disablePush(); }
    else await C.enablePush();
    this._renderPushBadge();
  },

  async _renderPushBadge() {
    const b = document.getElementById('push-state-badge');
    if (!b || !window.Chat?.pushState) return;
    const st = await window.Chat.pushState();
    const map = { on: ['켜짐', '#ecfdf5', '#047857', '#a7f3d0'], off: ['켜기', '#EEF0FD', '#2B338F', '#D5D9F7'], denied: ['차단됨', '#fef2f2', '#b91c1c', '#fecaca'], unsupported: ['앱 화면 알림', '#f1f5f9', '#5B616E', '#e2e8f0'] };
    const [txt, bg, fg, bd] = (st === 'unsupported' && window.RoadPlannerAndroid) ? ['앱 알림', '#ecfdf5', '#047857', '#a7f3d0'] : (map[st] || map.off);
    b.textContent = txt; b.style.background = bg; b.style.color = fg; b.style.borderColor = bd;
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
      Profile.render();
    });
  },

  // 다른 계정으로 로그인: 지금 계정을 로그아웃하고, 폰에 저장된 비밀번호가 자동으로 채워지지 않는 빈 로그인 화면을 연다
  async switchAccount() {
    if (!confirm('다른 계정으로 로그인할까요?\n지금 계정은 로그아웃됩니다.')) return;
    try { sessionStorage.setItem('rp_fresh_login', '1'); } catch (e) { }
    await this.logout(true);
  },

  async logout(skipConfirm = false) {
    if (skipConfirm === true || confirm('정말 로그아웃 하시겠습니까?')) {
      const provider = localStorage.getItem('bp_provider');
      if (window.SupabaseClient) {
        try { await window.SupabaseClient.signOut(); } catch (e) {}
      }
      if (provider === 'kakao' && typeof Kakao !== 'undefined' && Kakao.Auth) {
        try { Kakao.Auth.logout(() => {}); } catch (e) {}
      }
      if (provider === 'google' && typeof google !== 'undefined' && google.accounts?.id) {
        try { google.accounts.id.disableAutoSelect(); } catch (e) {}
      }
      localStorage.removeItem('bp_logged_in');
      localStorage.removeItem('bp_provider');
      localStorage.removeItem('bp_manager_id');
      localStorage.removeItem('bp_assigned_artists');
      localStorage.removeItem('bp_user_name');
      localStorage.removeItem('bp_user_email');
      localStorage.removeItem('bp_user_role');
      localStorage.removeItem('bp_company_name');
      localStorage.removeItem('rp_loc_consent');
      if (window.Loc) Loc._asked = false;
      localStorage.removeItem('bp_manager_filter');
      localStorage.removeItem('bp_onboarded');
      ['rp_default_departure', 'bp_user_phone', 'bp_user_vehicle', 'rp_vehicle', 'bp_account', 'rp_pro_until', 'rp_recent_places'].forEach(k => localStorage.removeItem(k));
      try { Profile._planChecked = false; } catch (e) { }
      U.toast('로그아웃 되었습니다.');
      App.navigate('login');
    }
  },

  editArtists() {
    // 담당 아티스트는 본사(관리자 웹 > 매니저 관리)에서 지정합니다. 서버 기준이라 앱에서 직접 바꾸지 않음
    U.toast('담당 아티스트는 본사에서 지정합니다. 변경이 필요하면 본사에 요청해 주세요.');
  },

  saveArtists() {
    const modal = document.getElementById('artist-select-modal');
    if (!modal) return;
    const chips = modal.querySelectorAll('.artist-select-chip.selected');
    const selected = Array.from(chips).map(c => c.getAttribute('data-name'));
    if (selected.length === 0) { U.toast('최소 1명 이상의 아티스트를 선택해 주세요.'); return; }
    localStorage.setItem('bp_assigned_artists', JSON.stringify(selected));
    modal.remove();
    U.toast(`담당 아티스트(${selected.join(', ')})가 저장되었습니다.`);
    U.haptic();
    Profile.render();
  },

  callHQ() {
    if (confirm('🚨 [본사 24H 종합상황실]\n02-555-8282 번호로 즉시 연결하시겠습니까?')) {
      window.location.href = 'tel:025558282';
    }
  },

  openEmergencyContacts() {
    const html = `
      <div class="modal-bg open" id="emergency-contact-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-panel" style="padding:20px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;">
            <div style="font-size:16px;font-weight:700;color:var(--text-100);">🛡️ 사내 비상 연락망</div>
            <button onclick="document.getElementById('emergency-contact-modal').remove()" style="background:none;border:none;color:var(--text-400);font-size:20px;cursor:pointer;">✕</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${[
              { label:'24H 본사 종합상황실', sub:'02-555-8282 (내선 100)',  tel:'025558282',  accent:'#ef4444' },
              { label:'VIP 전담 경호팀 본부', sub:'02-555-8283 (긴급출동)', tel:'025558283',  accent:'' },
              { label:'법인 의전차량 긴급지원', sub:'080-8282-5555 (24H 견인/대차)', tel:'08082825555', accent:'' },
              { label:'대외 커뮤니케이션 / 홍보실', sub:'02-555-8285 (이슈대응)', tel:'025558285', accent:'' },
            ].map(c => `
              <div style="background:var(--bg-card);border:1px solid ${c.accent?'rgba(239,68,68,0.3)':'var(--border-subtle)'};border-radius:var(--r-lg);padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:700;color:${esc(c.accent||'var(--text-100)')};font-size:14px;">${esc(c.label)}</div>
                  <div style="font-size:13px;color:var(--text-400);margin-top:2px;">${esc(c.sub)}</div>
                </div>
                <a href="tel:${esc(c.tel)}" style="background:${esc(c.accent||'var(--bg-elevated)')};border:1px solid ${c.accent?'transparent':'var(--border-subtle)'};color:${c.accent?'#fff':'var(--text-100)'};padding:6px 14px;border-radius:var(--r-md);text-decoration:none;font-size:13px;font-weight:700;">전화</a>
              </div>`).join('')}
          </div>
          <button onclick="document.getElementById('emergency-contact-modal').remove()" class="btn btn-secondary" style="width:100%;margin-top:16px;">닫기</button>
        </div>
      </div>`;
    const old = document.getElementById('emergency-contact-modal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  },

  reportEmergency() {
    const html = `
      <div class="modal-bg open" id="emergency-report-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-panel" style="padding:20px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;">
            <div style="font-size:16px;font-weight:700;color:#f87171;">⚡ 현장 긴급 상황 보고</div>
            <button onclick="document.getElementById('emergency-report-modal').remove()" style="background:none;border:none;color:var(--text-400);font-size:20px;cursor:pointer;">✕</button>
          </div>
          <p style="font-size:13px;color:var(--text-400);margin-bottom:12px;">작성 즉시 본사 HQ 마스터 관제 포털에 긴급 경보로 전송됩니다.</p>
          <div class="field">
            <label class="field-label">유형 선택 <span class="req">*</span></label>
            <select id="em-type" style="width:100%;padding:10px 12px;border-radius:var(--r-lg);background:var(--bg-card);border:1px solid var(--border-subtle);color:var(--text-100);font-size:14px;">
              <option value="스케줄 지연/변동">⏱️ 스케줄 지연 / 동선 변동</option>
              <option value="차량 고장/사고">🚗 의전 차량 고장 / 교통사고</option>
              <option value="아티스트 컨디션/부상">🏥 아티스트 건강 / 응급 치료</option>
              <option value="현장 안전/보안">🛡️ 현장 팬 밀집 / 보안 위험</option>
              <option value="기타">⚠️ 기타 돌발 상황</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">현재 위치 / 현장명 <span class="req">*</span></label>
            <input type="text" id="em-location" placeholder="예: 상암 MBC 지하주차장 B2" style="width:100%;padding:10px 12px;border-radius:var(--r-lg);background:var(--bg-card);border:1px solid var(--border-subtle);color:var(--text-100);font-size:14px;">
            <button type="button" id="em-gps-btn" onclick="Profile.fillEmergencyGps()" class="btn btn-secondary" style="width:100%;margin-top:8px;min-height:44px;">📍 내 현재 위치 넣기 (지도 링크 첨부)</button>
          </div>
          <div class="field">
            <label class="field-label">현장 사진 (선택)</label>
            <input type="file" id="em-photo" accept="image/*" capture="environment" style="width:100%;font-size:14px;">
          </div>
          <div class="field">
            <label class="field-label">상세 상황 내용 <span class="req">*</span></label>
            <textarea id="em-desc" rows="3" placeholder="현장 상황 및 필요한 본사 지원 내용을 기재해 주세요." style="width:100%;padding:10px 12px;border-radius:var(--r-lg);background:var(--bg-card);border:1px solid var(--border-subtle);color:var(--text-100);font-size:14px;"></textarea>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <button onclick="document.getElementById('emergency-report-modal').remove()" class="btn btn-secondary" style="flex:1;">취소</button>
            <button onclick="Profile.submitEmergencyReport()" class="btn" style="flex:1.5;background:#ef4444;color:#fff;font-weight:700;">본사 긴급 전송</button>
          </div>
        </div>
      </div>`;
    const old = document.getElementById('emergency-report-modal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  },

  // 현재 위치(GPS)를 받아 입력칸에 채우고, 본사에는 지도 링크로 전달한다
  fillEmergencyGps() {
    const btn = document.getElementById('em-gps-btn');
    if (!navigator.geolocation) { U.toast('이 기기에서는 위치를 가져올 수 없습니다. 위치를 직접 입력해 주세요.'); return; }
    if (!window.Loc || !Loc.ok()) { if (window.Loc) Loc.ask('긴급보고에 지금 위치를 함께 보내려면 동의가 필요해요.').then(ok => ok && setTimeout(() => this.fillEmergencyGps(), 350)); return; }
    if (btn) { btn.disabled = true; btn.textContent = '위치 확인 중...'; }
    Loc.get({ enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }).then(pos => {
      if (!pos) { if (btn) { btn.disabled = false; btn.textContent = '📍 내 현재 위치 넣기 (지도 링크 첨부)'; } U.toast('위치를 가져오지 못했습니다. 기기의 위치 권한을 허용하거나 직접 입력해 주세요.'); return; }
      const lat = +pos.coords.latitude.toFixed(6), lng = +pos.coords.longitude.toFixed(6);
      this._emGps = { lat, lng };
      const input = document.getElementById('em-location');
      if (input && !input.value.trim()) input.value = '현재 위치 (지도 링크 첨부됨)';
      if (btn) { btn.disabled = false; btn.textContent = '✅ 현재 위치가 첨부되었습니다 (다시 누르면 갱신)'; }
    });
  },

  async submitEmergencyReport() {
    const type = document.getElementById('em-type').value;
    const loc  = document.getElementById('em-location').value.trim();
    const desc = document.getElementById('em-desc').value.trim();
    if (!loc || !desc) { U.toast('위치와 상세 내용을 입력해 주세요.'); return; }
    if (!window.Chat || !window.Chat.available()) { U.toast('서버에 연결되어 있지 않아 보내지 못했습니다. 연결 후 다시 시도하거나 전화로 연락해 주세요.'); return; }
    const userName = localStorage.getItem('bp_user_name') || '현장 매니저';
    const gps = this._emGps;
    const map = gps ? `\n지도: https://map.kakao.com/link/map/긴급위치,${gps.lat},${gps.lng}` : '';
    const photo = document.getElementById('em-photo')?.files?.[0] || null;
    const btn = document.querySelector('#emergency-report-modal button[onclick^="Profile.submitEmergencyReport"]');
    if (btn) { btn.disabled = true; btn.textContent = '전송 중...'; }
    try {
      await window.Chat.sendNotice({ targetId: 'ALL', title: `🚨 현장 긴급보고 · ${type} (${userName})`, content: `위치: ${loc}\n내용: ${desc}${map}`, isUrgent: true, imageFile: photo });
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = '본사 긴급 전송'; }
      U.toast('긴급 보고 전송 실패: ' + (err.message || '다시 시도해 주세요.'));
      return;
    }
    if (gps && window.Loc) Loc.provided('sos', '긴급보고 위치');
    this._emGps = null;
    document.getElementById('emergency-report-modal').remove();
    U.toast('🚨 본사로 긴급 보고가 전송되었습니다.');
    U.haptic();
  },

  applyStationPreset(name, address, lat, lng) {
    if (confirm(`'${name}' (${address})\n선택하신 거점을 어디에 등록하시겠습니까?\n\n[확인] ➔ 자주 가는 거점으로 자동 저장`)) {
      if (!State.userAddresses) State.userAddresses = {};
      const placeObj = { name, address, lat, lng };
      State.userAddresses.shop = placeObj;
      localStorage.setItem('bp_shop', JSON.stringify(placeObj));
      U.toast(`✅ '${name}' 주소가 거점으로 저장되었습니다.`);
      U.haptic();
      Profile.render();
    }
  },

  async editPrep() {
    const cur = localStorage.getItem('bp_buffer_prep') ?? '60';
    const v = await Ask.text({ title: '기상·준비 시간', desc: '첫 출발 몇 분 전에 기상·준비 단계를 넣을까요?\n0을 넣으면 넣지 않아요.', value: cur, kind: 'number', placeholder: '예: 60', max: 3, select: true,
      validate: (x) => { const k = parseInt(x, 10); return Number.isFinite(k) && k >= 0 && k <= 240 ? '' : '0~240 사이 숫자로 넣어 주세요.'; } });
    if (v === null) return;
    const n = parseInt(v, 10);
    localStorage.setItem('bp_buffer_prep', String(n));
    U.toast(n ? `✅ 새로 만드는 동선부터 출발 ${n}분 전 기상·준비 단계가 들어가요.` : '기상·준비 단계를 넣지 않아요.');
    Profile.render();
  },

  async editContact() {
    const current = window.SupabaseClient?.currentProfile?.phone || localStorage.getItem('bp_user_phone') || '';
    const phone = await Ask.text({ title: '휴대폰 번호', desc: '본사 긴급 연락처에도 반영돼요.', value: current, kind: 'tel', placeholder: '010-1234-5678', max: 20,
      validate: (x) => { const t = String(x).trim(); return !t || /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(t) ? '' : '번호 형식을 확인해 주세요. (예: 010-1234-5678)'; } });
    if (phone === null) return;
    const v = phone.trim();
    localStorage.setItem('bp_user_phone', v);
    const sc = window.SupabaseClient;
    if (sc?.isConfigured && sc.currentUser) {
      sc.client.from('profiles').update({ phone: v || null }).eq('id', sc.currentUser.id)
        .then(({ error }) => U.toast(error ? '기기에는 저장했지만 서버 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.' : '✅ 휴대폰 번호를 저장했습니다. 본사 긴급연락처에도 반영돼요.'));
      if (sc.currentProfile) sc.currentProfile.phone = v;
    } else U.toast('휴대폰 번호를 저장했습니다.');
    U.haptic();
    Profile.render();
  },

  async editVehicle() {
    const currentVeh = localStorage.getItem('bp_user_vehicle') || '';
    const veh = await Ask.text({ title: '배정 차량', desc: '차종과 차량 번호를 적어 주세요.', value: currentVeh, placeholder: '예: 카니발 12가 3456', max: 60 });
    if (veh?.trim()) {
      localStorage.setItem('bp_user_vehicle', veh.trim());
      U.toast(`배정 차량을 저장했어요: ${veh.trim()}`);
      U.haptic();
      Profile.render();
    }
  },

  showVersion() {
    U.toast('현재 최신 버전을 사용 중입니다. (v1.0.0)');
  }
};
