/* =========================================
   BuddyPlanner v2 — Profile Screen Logic
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
    const userEmail      = localStorage.getItem('bp_user_email')   || 'manager@star-ent.com';
    const userCompany    = localStorage.getItem('bp_company_name') || '스타엔터테인먼트';
    const userDept       = localStorage.getItem('bp_dept_name')    || '매니지먼트 1본부';
    const assignedArtists = JSON.parse(localStorage.getItem('bp_assigned_artists') || '["에스파","라이즈"]');

    // 이니셜 아바타
    const initials = userName.length >= 2 ? userName.slice(0, 2) : userName;

    app.innerHTML = `
      <div class="header">
        <button class="header-btn" onclick="App.navigate('home')">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="header-title">마이페이지</h1>
        <div class="header-btn" style="visibility:hidden"></div>
      </div>

      <div class="screen-scroll" style="padding-top:12px;">

        <!-- ── 프로필 히어로 ── -->
        <div style="margin:0 var(--sp-5) var(--sp-5); background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a5f 100%); border-radius:20px; padding:20px; position:relative; overflow:hidden; box-shadow:0 8px 32px rgba(99,102,241,0.25);">
          <!-- 배경 패턴 -->
          <div style="position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(255,255,255,0.05) 0%,transparent 60%);pointer-events:none;"></div>
          <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;border-radius:50%;border:1px solid rgba(255,255,255,0.06);pointer-events:none;"></div>
          <div style="position:absolute;top:10px;right:10px;width:60px;height:60px;border-radius:50%;border:1px solid rgba(255,255,255,0.04);pointer-events:none;"></div>

          <div style="display:flex;align-items:center;gap:14px;position:relative;">
            <!-- 아바타 -->
            <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);border:2px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex-shrink:0;letter-spacing:-1px;">${initials}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.4px;margin-bottom:3px;">${userName}</div>
              <div style="font-size:11.5px;color:rgba(255,255,255,0.55);margin-bottom:2px;">${userEmail}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.4);">${userCompany} · ${userDept}</div>
            </div>
          </div>

          <!-- 담당 아티스트 태그 -->
          <div style="margin-top:14px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;position:relative;">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
              <span style="font-size:11px;color:rgba(255,255,255,0.4);font-weight:500;">담당 아티스트</span>
              ${assignedArtists.map(a => `<span style="background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.9);font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;border:1px solid rgba(255,255,255,0.15);">${a}</span>`).join('')}
            </div>
            <button onclick="Profile.editArtists()" style="display:flex;align-items:center;gap:4px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;padding:5px 10px;border-radius:8px;cursor:pointer;">${ProfileIcons.edit} 변경</button>
          </div>
        </div>

        <!-- ── 인증 상태 배너 ── -->
        <div style="margin:0 var(--sp-5) var(--sp-4);background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:14px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:11px;color:var(--primary-400);font-weight:700;margin-bottom:3px;display:flex;align-items:center;gap:5px;">
              <span style="display:inline-block;width:6px;height:6px;background:#4ade80;border-radius:50%;box-shadow:0 0 6px #4ade80;"></span>
              사내 전용 매니지먼트 플래너
            </div>
            <div style="font-size:13px;font-weight:700;color:var(--text-100);">아티스트 동선 및 스케줄 최적화 가동 중</div>
          </div>
          <div style="background:rgba(34,197,94,0.12);color:#4ade80;border:1px solid rgba(34,197,94,0.25);padding:5px 11px;border-radius:var(--r-full);font-size:11px;font-weight:700;white-space:nowrap;">인증 완료</div>
        </div>

        <!-- ── 내 정보 관리 ── -->
        ${Profile._section('내 정보 관리', 'normal', [
          { icon: ProfileIcons.phone, label: '휴대폰 번호 수정',      sub: '', badge: ProfileIcons.chevron, action: 'Profile.editContact()' },
          { icon: ProfileIcons.car,   label: '배정 차량 정보 관리',   sub: '', badge: ProfileIcons.chevron, action: 'Profile.editVehicle()' },
        ])}

        <!-- ── 기본 설정 ── -->
        <div class="profile-section" style="margin:0 var(--sp-5) var(--sp-4);">
          <div class="profile-section-title" style="display:flex;align-items:center;gap:6px;margin-bottom:10px;">${ProfileIcons.moon}<span>기본 설정</span></div>
          <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:16px;overflow:hidden;">

            <!-- 테마 -->
            <div style="padding:14px 16px;border-bottom:1px solid var(--border-subtle);">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                <span style="color:var(--primary-400);">${ProfileIcons.moon}</span>
                <span style="font-size:13.5px;font-weight:700;color:var(--text-100);">화면 테마 (다크모드)</span>
              </div>
              <div class="setting-options" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
                <button class="setting-opt-btn active" onclick="Profile.setTheme('system',this)">시스템</button>
                <button class="setting-opt-btn" onclick="Profile.setTheme('light',this)">라이트</button>
                <button class="setting-opt-btn" onclick="Profile.setTheme('dark',this)">다크</button>
              </div>
            </div>

            <!-- 푸시 알림 -->
            <div onclick="Profile.togglePush()" style="padding:14px 16px;border-bottom:1px solid var(--border-subtle);display:flex;align-items:center;gap:12px;cursor:pointer;">
              <span style="color:var(--primary-400);flex-shrink:0;">${ProfileIcons.bell}</span>
              <div style="flex:1;">
                <div style="font-size:13.5px;font-weight:700;color:var(--text-100);">스케줄 변동 푸시 알림</div>
              </div>
              <span style="background:rgba(79,70,229,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);font-size:11px;font-weight:800;padding:3px 10px;border-radius:var(--r-full);">ON</span>
            </div>


          </div>
        </div>


        <!-- ── HQ 관리자 포털 (CEO/HQ만) ── -->
        ${(localStorage.getItem('bp_user_role') === 'ceo' || localStorage.getItem('bp_user_role') === 'hq_admin') ? `
        <div style="margin:0 var(--sp-5) var(--sp-4);">
          <div class="profile-section-title" style="margin-bottom:10px;">🏢 HQ 엔터테인먼트 마스터 포털</div>
          <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:16px;overflow:hidden;">
            <a href="admin.html" target="_blank" style="display:flex;align-items:center;gap:12px;padding:14px 16px;text-decoration:none;cursor:pointer;">
              <span style="color:var(--primary-400);">${ProfileIcons.building}</span>
              <span style="font-size:13.5px;font-weight:700;color:var(--text-100);flex:1;">본사 마스터 스케줄러 열기 (관리자용)</span>
              ${ProfileIcons.chevron}
            </a>
          </div>
        </div>` : ''}

        <!-- ── 고객지원 / 앱 정보 ── -->
        ${Profile._section('고객지원 / 앱 정보', 'normal', [
          { icon: ProfileIcons.info,        label: '앱 버전 정보',             sub: '', badge: '<span style="font-size:11.5px;color:var(--text-400);">v1.0.0 (최신)</span>', action: 'Profile.showVersion()' },
          { icon: ProfileIcons.file,        label: '이용약관 및 개인정보처리방침', sub: '', badge: ProfileIcons.chevron, action: "U.toast('이용약관 페이지로 이동합니다.')" },
          { icon: ProfileIcons.headphones,  label: '고객센터 문의하기',        sub: '', badge: ProfileIcons.chevron, action: "U.toast('고객센터 문의 폼이 열립니다.')" },
        ])}

        <!-- ── 로그아웃 ── -->
        <div style="margin:var(--sp-2) var(--sp-5) var(--sp-8);">
          <button onclick="Profile.logout()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:14px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);color:#f87171;font-size:14px;font-weight:700;cursor:pointer;transition:background 0.15s;">
            ${ProfileIcons.logOut}
            로그아웃
          </button>
        </div>

      </div>
    `;
  },

  /* ── 헬퍼: 섹션 블록 생성 ── */
  _section(title, type, items) {
    const titleColor = type === 'red' ? 'color:#f87171;' : '';
    const rows = items.map((item, i) => {
      const border = i < items.length - 1 ? 'border-bottom:1px solid var(--border-subtle);' : '';
      return `
        <div onclick="${item.action}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;${border}cursor:pointer;">
          <span style="color:${type==='red'?'#f87171':'var(--primary-400)'};flex-shrink:0;">${item.icon}</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13.5px;font-weight:700;color:var(--text-100);">${item.label}</div>
            ${item.sub ? `<div style="font-size:11.5px;color:var(--text-400);margin-top:2px;">${item.sub}</div>` : ''}
          </div>
          <div style="flex-shrink:0;color:var(--text-400);">${item.badge}</div>
        </div>`;
    }).join('');
    return `
      <div style="margin:0 var(--sp-5) var(--sp-4);">
        <div class="profile-section-title" style="margin-bottom:10px;${titleColor}">${title}</div>
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
          <div style="font-size:11px;color:var(--text-400);margin-bottom:2px;">${label}</div>
          <div style="font-size:13px;font-weight:${value?'600':'400'};color:${value?'var(--text-100)':'var(--text-400)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${value || placeholder}</div>
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
    U.toast(`선호 네비게이션이 '${label}'(으)로 설정되었습니다.`);
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

  togglePush() {
    U.toast('알림 설정 화면으로 이동합니다.');
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
      Profile.render();
    });
  },

  async logout() {
    if (confirm('정말 로그아웃 하시겠습니까?')) {
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
      localStorage.removeItem('bp_manager_filter');
      localStorage.removeItem('bp_onboarded');
      U.toast('로그아웃 되었습니다.');
      App.navigate('login');
    }
  },

  editArtists() {
    const current = JSON.parse(localStorage.getItem('bp_assigned_artists') || '["에스파","라이즈"]');
    const artistList = ['에스파','라이즈','NCT 127','NCT DREAM','아이브','르세라핌','뉴진스','보이넥스트도어','투어스','플레이브'];
    const html = `
      <div class="modal-bg open" id="artist-select-modal" onclick="if(event.target===this)this.remove()">
        <div class="modal-panel" style="padding:20px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:10px;">
            <div style="font-size:16px;font-weight:800;color:var(--text-100);">🎤 담당 아티스트 설정</div>
            <button onclick="document.getElementById('artist-select-modal').remove()" style="background:none;border:none;color:var(--text-400);font-size:20px;cursor:pointer;">✕</button>
          </div>
          <p style="font-size:12.5px;color:var(--text-400);margin-bottom:14px;">현재 배정되어 스케줄을 관리할 아티스트를 선택해 주세요.</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;" id="artist-chip-group">
            ${artistList.map(a => {
              const sel = current.includes(a);
              return `<button type="button" class="artist-select-chip ${sel?'selected':''}" onclick="this.classList.toggle('selected')" data-name="${a}" style="padding:8px 14px;border-radius:var(--r-full);font-size:13px;font-weight:700;border:1px solid ${sel?'var(--primary-400)':'var(--border-subtle)'};background:${sel?'rgba(34,201,135,0.15)':'var(--bg-card)'};color:${sel?'var(--primary-400)':'var(--text-200)'};cursor:pointer;">${sel?'✓ ':''}${a}</button>`;
            }).join('')}
          </div>
          <div style="display:flex;gap:8px;">
            <button onclick="document.getElementById('artist-select-modal').remove()" class="btn btn-secondary" style="flex:1;">취소</button>
            <button onclick="Profile.saveArtists()" class="btn btn-primary" style="flex:1.5;">저장 완료</button>
          </div>
        </div>
      </div>`;
    const old = document.getElementById('artist-select-modal');
    if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
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
            <div style="font-size:16px;font-weight:800;color:var(--text-100);">🛡️ 사내 비상 연락망</div>
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
                  <div style="font-weight:700;color:${c.accent||'var(--text-100)'};font-size:13.5px;">${c.label}</div>
                  <div style="font-size:12px;color:var(--text-400);margin-top:2px;">${c.sub}</div>
                </div>
                <a href="tel:${c.tel}" style="background:${c.accent||'var(--bg-elevated)'};border:1px solid ${c.accent?'transparent':'var(--border-subtle)'};color:${c.accent?'#fff':'var(--text-100)'};padding:6px 14px;border-radius:var(--r-md);text-decoration:none;font-size:12px;font-weight:700;">전화</a>
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
            <div style="font-size:16px;font-weight:800;color:#f87171;">⚡ 현장 긴급 상황 보고</div>
            <button onclick="document.getElementById('emergency-report-modal').remove()" style="background:none;border:none;color:var(--text-400);font-size:20px;cursor:pointer;">✕</button>
          </div>
          <p style="font-size:12px;color:var(--text-400);margin-bottom:12px;">작성 즉시 본사 HQ 마스터 관제 포털에 긴급 경보로 전송됩니다.</p>
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
          </div>
          <div class="field">
            <label class="field-label">상세 상황 내용 <span class="req">*</span></label>
            <textarea id="em-desc" rows="3" placeholder="현장 상황 및 필요한 본사 지원 내용을 기재해 주세요." style="width:100%;padding:10px 12px;border-radius:var(--r-lg);background:var(--bg-card);border:1px solid var(--border-subtle);color:var(--text-100);font-size:13.5px;"></textarea>
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

  submitEmergencyReport() {
    const type = document.getElementById('em-type').value;
    const loc  = document.getElementById('em-location').value.trim();
    const desc = document.getElementById('em-desc').value.trim();
    if (!loc || !desc) { U.toast('위치와 상세 내용을 입력해 주세요.'); return; }
    const userName = localStorage.getItem('bp_user_name') || '현장 매니저';
    try {
      if (window.AdminData?.addBroadcast) {
        AdminData.addBroadcast({ title:`🚨 [현장 긴급보고] ${type} (${userName})`, content:`위치: ${loc}\n내용: ${desc}`, isUrgent:true, targetId:'ALL' });
      }
    } catch(e) {}
    document.getElementById('emergency-report-modal').remove();
    U.toast('🚨 본사 상황실로 긴급 보고가 성공적으로 전송되었습니다.');
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

  editContact() {
    const current = localStorage.getItem('bp_user_phone') || '010-1234-5678';
    const phone = prompt('수정할 휴대폰 번호를 입력해 주세요:', current);
    if (phone?.trim()) {
      localStorage.setItem('bp_user_phone', phone.trim());
      U.toast(`휴대폰 번호가 '${phone.trim()}'(으)로 수정되었습니다.`);
      U.haptic();
      Profile.render();
    }
  },

  editVehicle() {
    const currentVeh = localStorage.getItem('bp_user_vehicle') || '카니발 하이리무진 (12가 3456)';
    const veh = prompt('배정 차량 정보를 입력해 주세요 (차종 및 차량번호):', currentVeh);
    if (veh?.trim()) {
      localStorage.setItem('bp_user_vehicle', veh.trim());
      U.toast(`배정 차량이 '${veh.trim()}'(으)로 등록되었습니다.`);
      U.haptic();
      Profile.render();
    }
  },

  showVersion() {
    U.toast('현재 최신 버전을 사용 중입니다. (v1.0.0)');
  }
};
