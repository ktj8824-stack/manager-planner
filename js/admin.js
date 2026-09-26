/* ===================================================
   HQ Enterprise Master Scheduler — Interactive Controller
   =================================================== */

const ARTIST_ICON_SVGS = {
  star: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  zap: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  mic: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`,
  film: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m4 4 3 4"/><path d="m11 4 3 4"/><path d="m18 4 3 4"/><line x1="2" y1="8" x2="22" y2="8"/></svg>`,
  crown: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>`,
  music: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
  heart: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  sparkle: (s) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>`
};

// ── 🎨 아티스트 고유 활동 유형별 라인 SVG 아이콘 헬퍼 ──
function getArtistTypeIcon(art, size = 14) {
  if (!art) return ARTIST_ICON_SVGS.star(size);
  if (art.icon && ARTIST_ICON_SVGS[art.icon]) {
    return ARTIST_ICON_SVGS[art.icon](size);
  }
  const nameStr = (art.name || '').toLowerCase();
  const typeStr = (art.type || '').toLowerCase();
  
  // 배우 / 드라마 / 차은호
  if (typeStr.includes('배우') || typeStr.includes('actor') || nameStr.includes('은호') || nameStr.includes('eunho')) {
    return ARTIST_ICON_SVGS.film(size);
  }
  // 솔로 / 보컬 / 유나
  if (typeStr.includes('솔로') || typeStr.includes('solo') || typeStr.includes('보컬') || nameStr.includes('유나') || nameStr.includes('yuna')) {
    return ARTIST_ICON_SVGS.mic(size);
  }
  // 보이그룹 / 밴드 / 에이펙스
  if (typeStr.includes('보이') || typeStr.includes('boy') || nameStr.includes('에이펙스') || nameStr.includes('apex')) {
    return ARTIST_ICON_SVGS.zap(size);
  }
  // 밴드 / 음악
  if (typeStr.includes('밴드') || typeStr.includes('band')) {
    return ARTIST_ICON_SVGS.music(size);
  }
  // MC / 방송인
  if (typeStr.includes('mc') || typeStr.includes('방송')) {
    return ARTIST_ICON_SVGS.crown(size);
  }
  // 걸그룹 / 아이돌 / 루나스 / 기본
  return ARTIST_ICON_SVGS.star(size);
}

const ARTIST_TYPE_COLORS = {
  star: '#ec4899',    // 별/걸그룹 (핑크)
  zap: '#3b82f6',     // 번개/보이 (블루)
  mic: '#f59e0b',     // 마이크/솔로 (앰버)
  film: '#8b5cf6',    // 슬레이트/배우 (퍼플)
  crown: '#10b981',   // 왕관/MC (에메랄드)
  music: '#06b6d4',   // 음표/밴드 (시안)
  heart: '#f43f5e',   // 하트 (로즈)
  sparkle: '#6366f1'  // 스파클 (인디고)
};

// Global Admin Interface
window.Admin = {
  getArtistTypeIcon(art, size = 14) {
    return getArtistTypeIcon(art, size);
  },

  selectArtistIcon(iconKey) {
    const iconInput = document.getElementById('new-artist-icon');
    if (iconInput) iconInput.value = iconKey;

    const assignedColor = ARTIST_TYPE_COLORS[iconKey] || '#6366f1';
    const colorInput = document.getElementById('new-artist-color');
    if (colorInput) colorInput.value = assignedColor;

    const picker = document.getElementById('artist-icon-picker');
    if (picker) {
      picker.querySelectorAll('.artist-icon-opt').forEach(opt => {
        if (opt.dataset.icon === iconKey) {
          opt.style.borderColor = assignedColor;
          opt.style.borderWidth = '1.5px';
          opt.style.color = assignedColor;
          opt.style.boxShadow = `0 2px 8px ${assignedColor}33`;
          opt.classList.add('active');
        } else {
          opt.style.borderColor = '#cbd5e1';
          opt.style.borderWidth = '1px';
          opt.style.color = '#64748b';
          opt.style.boxShadow = 'none';
          opt.classList.remove('active');
        }
      });
    }
  },

  selectArtistColor(colorHex) {
    const colorInput = document.getElementById('new-artist-color');
    if (colorInput) {
      colorInput.value = colorHex;
    }
  },

  onMemberListInput(val) {
    if (!val) return;
    const list = val.split(/[,，\n]/).map(s => s.trim()).filter(Boolean);
    const membersInput = document.getElementById('new-artist-members');
    if (membersInput && list.length > 0) {
      membersInput.value = list.length;
    }
  },

  renderScheduleMemberSelector(artistId, targetMembers = 'ALL') {
    const wrap = document.getElementById('form-member-select-group');
    const container = document.getElementById('form-member-chips');
    const hiddenInput = document.getElementById('form-selected-members');
    if (!wrap || !container || !hiddenInput) return;

    const artists = window.hqStore ? window.hqStore.getArtists() : [];
    const art = artists.find(a => a.id === artistId);

    if (!art || !art.memberList || art.memberList.length <= 1) {
      wrap.style.display = 'none';
      hiddenInput.value = 'ALL';
      return;
    }

    wrap.style.display = 'block';
    let currentSelected = targetMembers;
    if (typeof currentSelected === 'string' && currentSelected.startsWith('[')) {
      try { currentSelected = JSON.parse(currentSelected); } catch(e) {}
    }

    const isAll = !currentSelected || currentSelected === 'ALL' || (Array.isArray(currentSelected) && currentSelected.length === art.memberList.length);
    let selectedArr = isAll ? [] : (Array.isArray(currentSelected) ? currentSelected : [currentSelected]);

    let html = `
      <button type="button" class="member-chip-btn ${isAll ? 'active' : ''}" data-member="ALL"
        style="padding:5px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s; border:1px solid ${isAll ? '#6366f1' : '#cbd5e1'}; background:${isAll ? '#6366f1' : '#ffffff'}; color:${isAll ? '#ffffff' : '#475569'};">
        ✨ 전체 (완전체)
      </button>
    `;

    art.memberList.forEach(m => {
      const sel = !isAll && selectedArr.includes(m);
      html += `
        <button type="button" class="member-chip-btn ${sel ? 'active' : ''}" data-member="${m}"
          style="padding:5px 12px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.15s; border:1px solid ${sel ? '#6366f1' : '#cbd5e1'}; background:${sel ? 'rgba(99,102,241,0.15)' : '#ffffff'}; color:${sel ? '#4338ca' : '#475569'};">
          👤 ${m}
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.member-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.member;
        if (m === 'ALL') {
          hiddenInput.value = 'ALL';
          Admin.renderScheduleMemberSelector(artistId, 'ALL');
        } else {
          let nextArr = isAll ? [m] : [...selectedArr];
          if (!isAll) {
            if (nextArr.includes(m)) {
              nextArr = nextArr.filter(x => x !== m);
            } else {
              nextArr.push(m);
            }
          }
          if (nextArr.length === 0 || nextArr.length === art.memberList.length) {
            hiddenInput.value = 'ALL';
            Admin.renderScheduleMemberSelector(artistId, 'ALL');
          } else {
            hiddenInput.value = JSON.stringify(nextArr);
            Admin.renderScheduleMemberSelector(artistId, nextArr);
          }
        }
      });
    });
  },

  openAdminSettingsModal() {
    const modal = document.getElementById('modal-admin-settings');
    if (!modal) return;
    
    // 1. 소속사 & 대표자명 로드
    const compName = localStorage.getItem('bp_company_name') || localStorage.getItem('reg_company_name') || '';
    const ceoName = localStorage.getItem('bp_user_name') || '';
    const compInput = document.getElementById('setting-company-name');
    const ceoInput = document.getElementById('setting-ceo-name');
    if (compInput) compInput.value = compName;
    if (ceoInput) ceoInput.value = ceoName;

    // 2. Supabase 설정 로드
    const cfg = window.SupabaseClient ? window.SupabaseClient.getConfig() : { url: '', anonKey: '' };
    const urlInput = document.getElementById('cfg-supabase-url');
    const keyInput = document.getElementById('cfg-supabase-key');
    if (urlInput) urlInput.value = cfg.url || 'https://gohxflsyhogyxantnlig.supabase.co';
    if (keyInput) keyInput.value = cfg.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaHhmbHN5aG9neXhhbnRubGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4ODY5NDUsImV4cCI6MjEwNTQ2Mjk0NX0.imGAcwKc26zLXnXeYqNuqWmomMEyL2xz0wI5MpsK0a0';

    // 3. 버퍼 기본값 로드
    const shopBuf = localStorage.getItem('bp_buffer_shop') || '120';
    const travelBuf = localStorage.getItem('bp_buffer_travel') || '30';
    const waitBuf = localStorage.getItem('bp_buffer_wait') || '10';
    const shopInput = document.getElementById('setting-buffer-shop');
    const travelInput = document.getElementById('setting-buffer-travel');
    const waitInput = document.getElementById('setting-buffer-wait');
    if (shopInput) shopInput.value = shopBuf;
    if (travelInput) travelInput.value = travelBuf;
    if (waitInput) waitInput.value = waitBuf;

    modal.classList.add('active');
  },

  closeAdminSettingsModal() {
    const modal = document.getElementById('modal-admin-settings');
    if (modal) modal.classList.remove('active');
  },

  saveAdminSettings() {
    const compInput = document.getElementById('setting-company-name');
    const ceoInput = document.getElementById('setting-ceo-name');
    const urlInput = document.getElementById('cfg-supabase-url');
    const keyInput = document.getElementById('cfg-supabase-key');
    const shopInput = document.getElementById('setting-buffer-shop');
    const travelInput = document.getElementById('setting-buffer-travel');
    const waitInput = document.getElementById('setting-buffer-wait');

    if (compInput && compInput.value.trim()) {
      const comp = compInput.value.trim();
      localStorage.setItem('bp_company_name', comp);
      localStorage.setItem('reg_company_name', comp);
      const brandEl = document.getElementById('hq-brand-title');
      if (brandEl) brandEl.textContent = comp;
      const compSubEl = document.getElementById('header-company-sub');
      if (compSubEl) compSubEl.textContent = `${comp} 통합 스케줄 관리`;
      const dropComp = document.getElementById('dropdown-user-company');
      if (dropComp) dropComp.textContent = comp;
    }

    if (ceoInput && ceoInput.value.trim()) {
      const ceo = ceoInput.value.trim();
      localStorage.setItem('bp_user_name', ceo);
      const headerNameEl = document.getElementById('header-user-name');
      if (headerNameEl) headerNameEl.textContent = `${ceo} 대표님`;
      const dropNameEl = document.getElementById('dropdown-user-name');
      if (dropNameEl) dropNameEl.textContent = `${ceo} 대표님`;
    }

    if (shopInput) localStorage.setItem('bp_buffer_shop', shopInput.value);
    if (travelInput) localStorage.setItem('bp_buffer_travel', travelInput.value);
    if (waitInput) localStorage.setItem('bp_buffer_wait', waitInput.value);

    if (urlInput && keyInput && urlInput.value.trim() && keyInput.value.trim()) {
      if (window.SupabaseClient && typeof window.SupabaseClient.setConfig === 'function') {
        window.SupabaseClient.setConfig(urlInput.value.trim(), keyInput.value.trim());
      }
    }

    alert('✅ 관리자 설정이 성공적으로 저장 및 적용되었습니다!');
    this.closeAdminSettingsModal();
  },

  async exportAllDataBackup() {
    try {
      const artists = await window.hqStore.getArtists();
      const managers = await window.hqStore.getManagers();
      const vehicles = await window.hqStore.getVehicles();
      const schedules = await window.hqStore.getSchedules();

      const backupData = {
        exportDate: new Date().toISOString(),
        companyName: localStorage.getItem('bp_company_name') || 'STAR',
        artists,
        managers,
        vehicles,
        schedules
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      downloadAnchor.setAttribute("download", `manager_planner_backup_${todayStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert('백업 파일 생성 중 오류가 발생했습니다: ' + e.message);
    }
  },

  async importAllDataBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('현재 등록된 데이터를 백업 파일 데이터로 교체 및 복원하시겠습니까?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (Array.isArray(data.artists)) await window.hqStore.saveArtists(data.artists);
        if (Array.isArray(data.managers)) await window.hqStore.saveManagers(data.managers);
        if (Array.isArray(data.vehicles)) await window.hqStore.saveVehicles(data.vehicles);
        if (Array.isArray(data.schedules)) await window.hqStore.saveSchedules(data.schedules);

        if (data.companyName) {
          localStorage.setItem('bp_company_name', data.companyName);
        }

        alert('✅ 데이터 백업 복원이 완료되었습니다! 화면을 새로고침합니다.');
        window.location.reload();
      } catch (err) {
        alert('❌ 백업 파일 복원 실패: JSON 형식이 올바르지 않습니다.');
      }
    };
    reader.readAsText(file);
  },

  openSupabaseModal() {
    this.openAdminSettingsModal();
  },

  saveSupabaseConfig() {
    this.saveAdminSettings();
  },

  resetSupabaseConfig() {
    if (confirm('Supabase 설정을 초기화하고 브라우저 로컬 데이터 모드로 전환하시겠습니까?')) {
      window.SupabaseClient.clearConfig();
      document.getElementById('modal-supabase-config').classList.remove('active');
      window.Admin.updateSupabaseBadge();
      window.location.reload();
    }
  },

  updateSupabaseBadge() {
    const badge = document.getElementById('supabase-status-badge');
    const dot = document.getElementById('supabase-status-dot');
    const text = document.getElementById('supabase-status-text');
    if (!badge || !dot || !text) return;

    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      dot.style.background = '#10b981';
      dot.style.boxShadow = '0 0 8px #10b981';
      text.textContent = '클라우드 동기화 중 (Supabase)';
      text.style.color = '#34d399';
      badge.style.borderColor = '#059669';
    } else {
      dot.style.background = '#94a3b8';
      dot.style.boxShadow = 'none';
      text.textContent = '로컬 모드 (설정)';
      text.style.color = '#94a3b8';
      badge.style.borderColor = '#334155';
    }
  },

  // ── 📍 거점 및 샵/숙소/사옥 관리 ──
  currentPlaceFilter: 'ALL',

  openPlaceModal() {
    const modal = document.getElementById('modal-place-management');
    if (modal) {
      modal.classList.add('active');
      window.Admin.renderPlaceList();
    }
  },

  getPlaces() {
    const defaultPlaces = [
      { id: 'p_1', type: 'shop', name: '순수 청담본점', address: '서울 강남구 도산대로67길 14', contact: '02-515-5575' },
      { id: 'p_2', type: 'shop', name: '빗앤붓 (Bit&Boot)', address: '서울 강남구 압구정로79길 37-3', contact: '02-514-1005' },
      { id: 'p_3', type: 'shop', name: '제니하우스 청담힐', address: '서울 강남구 선릉로146길 56', contact: '02-541-7774' },
      { id: 'p_4', type: 'shop', name: '알루 청담점 (ALUU)', address: '서울 강남구 도산대로61길 4', contact: '02-542-8885' },
      { id: 'p_5', type: 'shop', name: '정샘물 인스피레이션 청담EAST', address: '서울 강남구 도산대로81길 14', contact: '02-518-8100' },
      { id: 'p_6', type: 'shop', name: '멥시 (MEPCI)', address: '서울 강남구 도산대로55길 26', contact: '02-514-7858' },
      { id: 'p_7', type: 'dorm', name: '아티스트 한남 숙소', address: '서울 용산구 독서당로 00', contact: '비번: 1004*' },
      { id: 'p_8', type: 'dorm', name: '청담 서브 숙소', address: '서울 강남구 압구정로 00', contact: '101호' },
      { id: 'p_9', type: 'office', name: '본사 사옥 지하 주차장', address: '서울 강남구 테헤란로 00', contact: 'B1 픽업존' },
      { id: 'p_10', type: 'office', name: '논현동 전용 안무연습실', address: '서울 강남구 학동로 00', contact: '지하 1층' }
    ];

    try {
      const stored = localStorage.getItem('HQ_SAVED_PLACES_V1');
      if (!stored) {
        localStorage.setItem('HQ_SAVED_PLACES_V1', JSON.stringify(defaultPlaces));
        return defaultPlaces;
      }
      return JSON.parse(stored);
    } catch (e) {
      return defaultPlaces;
    }
  },

  savePlaces(places) {
    localStorage.setItem('HQ_SAVED_PLACES_V1', JSON.stringify(places));
    window.Admin.updatePlaceDatalists();
  },

  filterPlaces(type, btn) {
    window.Admin.currentPlaceFilter = type;
    const tabs = document.querySelectorAll('#place-filter-tabs button');
    tabs.forEach(b => {
      b.classList.remove('active');
      b.style.fontWeight = 'normal';
    });
    if (btn) {
      btn.classList.add('active');
      btn.style.fontWeight = '700';
    }
    window.Admin.renderPlaceList();
  },

  renderPlaceList() {
    const listEl = document.getElementById('place-management-list');
    const countEl = document.getElementById('place-total-count');
    if (!listEl) return;

    let places = window.Admin.getPlaces();
    const totalCount = places.length;
    if (countEl) countEl.textContent = `총 ${totalCount}개 등록됨`;

    if (window.Admin.currentPlaceFilter !== 'ALL') {
      places = places.filter(p => p.type === window.Admin.currentPlaceFilter);
    }

    if (places.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-dim); font-size: 13px; background: rgba(0,0,0,0.02); border-radius: 8px;">
          등록된 거점이 없습니다. 위 폼에서 새로운 거점을 등록해 보세요!
        </div>
      `;
      return;
    }

    const typeMeta = {
      shop: { label: '샵', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
      dorm: { label: '숙소', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
      office: { label: '사옥/연습실', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
      etc: { label: '기타', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)' }
    };

    listEl.innerHTML = places.map(p => {
      const meta = typeMeta[p.type] || typeMeta.etc;
      return `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; transition: all 0.15s;">
          <div style="flex: 1; min-width: 0; padding-right: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
              <span style="font-size: 11px; font-weight: 700; color: ${meta.color}; background: ${meta.bg}; padding: 2px 8px; border-radius: 4px;">
                ${meta.label}
              </span>
              <strong style="font-size: 13px; color: var(--text-main);">${p.name}</strong>
              ${p.contact ? `<span style="font-size: 11px; color: var(--text-dim);">(${p.contact})</span>` : ''}
            </div>
            <div style="font-size: 12px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              ${p.address}
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button type="button" onclick="Admin.editPlace('${p.id}')" 
              style="background: transparent; border: 1px solid rgba(99, 102, 241, 0.4); color: #6366f1; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: all 0.15s;"
              onmouseover="this.style.background='#6366f1'; this.style.color='#fff';"
              onmouseout="this.style.background='transparent'; this.style.color='#6366f1';">
              수정
            </button>
            <button type="button" onclick="Admin.deletePlace('${p.id}')" 
              style="background: transparent; border: 1px solid rgba(239, 68, 68, 0.25); color: #ef4444; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: all 0.15s;"
              onmouseover="this.style.background='#ef4444'; this.style.color='#fff';"
              onmouseout="this.style.background='transparent'; this.style.color='#ef4444';">
              삭제
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  editPlace(id) {
    const places = window.Admin.getPlaces();
    const target = places.find(p => p.id === id);
    if (!target) return;

    const editIdEl = document.getElementById('edit-place-id');
    const titleEl = document.getElementById('place-form-title');
    const typeEl = document.getElementById('new-place-type');
    const nameEl = document.getElementById('new-place-name');
    const contactEl = document.getElementById('new-place-contact');
    const addressEl = document.getElementById('new-place-address');
    const btnCancel = document.getElementById('btn-cancel-edit-place');
    const btnSubmit = document.getElementById('btn-submit-place');

    if (editIdEl) editIdEl.value = target.id;
    if (titleEl) titleEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 거점 정보 수정: <strong style="color:var(--primary); margin-left:4px;">${target.name}</strong>`;
    if (typeEl) typeEl.value = target.type || 'etc';
    if (nameEl) nameEl.value = target.name || '';
    if (contactEl) contactEl.value = target.contact || '';
    if (addressEl) addressEl.value = target.address || '';
    if (btnCancel) btnCancel.style.display = 'inline-block';
    if (btnSubmit) btnSubmit.textContent = '수정 완료';

    nameEl?.focus();
  },

  cancelEditPlace() {
    const editIdEl = document.getElementById('edit-place-id');
    const titleEl = document.getElementById('place-form-title');
    const nameEl = document.getElementById('new-place-name');
    const contactEl = document.getElementById('new-place-contact');
    const addressEl = document.getElementById('new-place-address');
    const btnCancel = document.getElementById('btn-cancel-edit-place');
    const btnSubmit = document.getElementById('btn-submit-place');

    if (editIdEl) editIdEl.value = '';
    if (titleEl) titleEl.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> 신규 거점 (샵 / 숙소 / 사옥) 등록`;
    if (nameEl) nameEl.value = '';
    if (contactEl) contactEl.value = '';
    if (addressEl) addressEl.value = '';
    if (btnCancel) btnCancel.style.display = 'none';
    if (btnSubmit) btnSubmit.textContent = '등록하기';
  },

  handleSavePlace(e) {
    e.preventDefault();
    const editId = document.getElementById('edit-place-id')?.value;
    const type = document.getElementById('new-place-type').value;
    const name = document.getElementById('new-place-name').value.trim();
    const address = document.getElementById('new-place-address').value.trim();
    const contact = document.getElementById('new-place-contact').value.trim();

    if (!name || !address) {
      alert('거점 이름과 주소를 입력해주세요.');
      return;
    }

    let places = window.Admin.getPlaces();

    if (editId) {
      // 수정 모드
      const idx = places.findIndex(p => p.id === editId);
      if (idx !== -1) {
        places[idx] = {
          ...places[idx],
          type,
          name,
          address,
          contact
        };
      }
      window.Admin.savePlaces(places);
      window.Admin.cancelEditPlace();
      window.Admin.renderPlaceList();
      alert(`✅ [${name}] 거점 정보가 수정되었습니다!`);
    } else {
      // 신규 등록 모드
      const newPlace = {
        id: 'p_' + Date.now(),
        type,
        name,
        address,
        contact
      };
      places.unshift(newPlace);
      window.Admin.savePlaces(places);

      document.getElementById('new-place-name').value = '';
      document.getElementById('new-place-address').value = '';
      document.getElementById('new-place-contact').value = '';

      window.Admin.renderPlaceList();
      alert(`✅ [${name}] 거점이 등록되었습니다! 스케줄 등록에서 바로 검색할 수 있습니다.`);
    }
  },

  deletePlace(id) {
    if (!confirm('해당 거점을 삭제하시겠습니까?')) return;
    let places = window.Admin.getPlaces();
    places = places.filter(p => p.id !== id);
    window.Admin.savePlaces(places);
    window.Admin.renderPlaceList();
  },

  updatePlaceDatalists() {
    const places = window.Admin.getPlaces();
    
    // 1. 샵 datalist (preset-shops-list)
    const shopListEl = document.getElementById('preset-shops-list');
    if (shopListEl) {
      const shops = places.filter(p => p.type === 'shop');
      shopListEl.innerHTML = shops.map(s => `
        <option value="${s.name}" data-address="${s.address}"></option>
      `).join('');
    }

    // 2. 출발지 datalist (preset-places-list)
    const placeListEl = document.getElementById('preset-places-list');
    if (placeListEl) {
      placeListEl.innerHTML = places.map(p => `
        <option value="${p.name}" data-address="${p.address}"></option>
      `).join('');
    }
  },

  updateRoleBadge() {
    // ── 사이드바 역할 브랜드 (hq-role-switcher-badge) ──
    const persona = window.AuthPersona ? window.AuthPersona.getCurrentUser() : { name: '', shortBadge: 'CEO', color: '#f59e0b', badge: '👑 CEO' };
    const iconEl  = document.getElementById('hq-role-badge-icon');
    const textEl  = document.getElementById('hq-role-badge-text');
    const badgeEl = document.getElementById('hq-role-switcher-badge');
    if (iconEl && textEl && badgeEl) {
      iconEl.textContent = persona.badge.split(' ')[0];
      badgeEl.style.color       = persona.color;
      badgeEl.style.borderColor = persona.color + '60';
      badgeEl.style.background  = persona.color + '15';
    }

    // ── 회사명 브랜드 타이틀 ──
    const brandTitleEl = document.getElementById('hq-brand-title');
    if (brandTitleEl) {
      const companyName = localStorage.getItem('bp_company_name');
      if (companyName && companyName !== 'STAR') {
        brandTitleEl.textContent = companyName + ' SCHEDULER';
      } else {
        brandTitleEl.textContent = 'SCHEDULER';
        (async () => {
          try {
            if (SupabaseClient.isConfigured && SupabaseClient.client) {
              const session = await SupabaseClient.client.auth.getSession();
              const userId  = session?.data?.session?.user?.id;
              if (userId) {
                const { data } = await SupabaseClient.client
                  .from('profiles').select('companies(name)').eq('id', userId).single();
                const name = data?.companies?.name;
                if (name) {
                  localStorage.setItem('bp_company_name', name);
                  brandTitleEl.textContent = name + ' SCHEDULER';
                }
              }
            }
          } catch (e) {}
        })();
      }
    }

    // ── 헤더 사용자 칩 및 회사명 업데이트 ──
    const chipNameEl  = document.getElementById('header-user-name');
    const chipRoleEl  = document.getElementById('header-user-role');
    const dropNameEl  = document.getElementById('dropdown-user-name');
    const dropEmailEl = document.getElementById('dropdown-user-email');
    const brandEl     = document.getElementById('hq-brand-title');
    const compSubEl   = document.getElementById('header-company-sub');

    const role = localStorage.getItem('bp_user_role') || 'ceo';
    const cachedEmail = localStorage.getItem('bp_user_email') || '';
    if (chipRoleEl) chipRoleEl.textContent = ''; // 불필요한 고정 태그 제거
    if (dropEmailEl && cachedEmail) dropEmailEl.textContent = cachedEmail;

    const cachedCompany = localStorage.getItem('bp_company_name');
    const dropCompEl = document.getElementById('dropdown-user-company');
    if (cachedCompany) {
      if (brandEl) brandEl.textContent = cachedCompany;
      if (compSubEl) compSubEl.textContent = `${cachedCompany} 통합 스케줄 관리`;
      if (dropCompEl) dropCompEl.textContent = cachedCompany;
    }

    const cachedName = localStorage.getItem('bp_user_name') || '';
    function formatHonorificName(rawName) {
      if (!rawName || rawName.includes('@')) return role === 'ceo' ? '대표님' : '관리자님';
      const clean = rawName.replace(/대표님|대표|님$/, '').trim();
      if (role === 'ceo') return `${clean} 대표님`;
      if (role === 'hq_admin') return `${clean} 총괄팀장님`;
      return `${clean} 관리자님`;
    }

    if (cachedName && !cachedName.includes('@')) {
      const formatted = formatHonorificName(cachedName);
      if (chipNameEl) chipNameEl.textContent = formatted;
      if (dropNameEl) dropNameEl.textContent = formatted;
    }

    // Supabase 세션에서 최신 이름 및 회사명 실시간 동기화
    (async () => {
      try {
        if (SupabaseClient.isConfigured && SupabaseClient.client) {
          const session = await SupabaseClient.client.auth.getSession();
          const user = session?.data?.session?.user;
          if (user) {
            const meta = user.user_metadata || {};
            const realName = meta.name || '';
            const companyName = meta.company_name || '';

            if (companyName) {
              localStorage.setItem('bp_company_name', companyName);
              if (brandEl) brandEl.textContent = companyName;
              if (compSubEl) compSubEl.textContent = `${companyName} 통합 스케줄 관리`;
              if (dropCompEl) dropCompEl.textContent = companyName;
            }

            if (realName && !realName.includes('@')) {
              localStorage.setItem('bp_user_name', realName);
              const formatted = formatHonorificName(realName);
              if (chipNameEl) chipNameEl.textContent = formatted;
              if (dropNameEl) dropNameEl.textContent = formatted;
            }
          }
        }
      } catch (e) {
        console.warn('사용자 프로필 동기화:', e);
      }
    })();
  },

  toggleUserDropdown(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('header-user-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  },

  async logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      // 세션 정보 완전 제거
      localStorage.removeItem('bp_user_name');
      localStorage.removeItem('bp_user_email');
      localStorage.removeItem('bp_user_role');
      localStorage.removeItem('bp_company_name');
      localStorage.removeItem('bp_logged_in');
      if (window.SupabaseClient) {
        try {
          await window.SupabaseClient.signOut();
        } catch (e) {}
      }
      window.location.href = 'admin-login.html';
    }
  },

  openRoleModal() {
    const modal = document.getElementById('modal-role-selector');
    const list = document.getElementById('role-selector-list');
    if (!modal || !list) return;

    const currentRole = window.AuthPersona ? window.AuthPersona.getCurrentRole() : 'ceo';
    const roles = window.AuthPersona ? window.AuthPersona.ROLES : {};

    list.innerHTML = Object.values(roles).map(r => {
      const isActive = currentRole === r.role;
      return `
        <div onclick="AuthPersona.switchRole('${r.key}'); Admin.closeRoleModal(); Admin.updateRoleBadge();"
             style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:10px; border:2px solid ${isActive ? r.color : '#334155'}; background:#0f172a; cursor:pointer; transition:all 0.2s;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:38px; height:38px; border-radius:10px; background:${r.color}20; color:${r.color}; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800;">
              ${r.badge.split(' ')[0]}
            </div>
            <div>
              <div style="font-size:14px; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:8px;">
                <span>${r.name}</span>
                <span style="font-size:11px; background:${r.color}25; color:${r.color}; padding:1px 6px; border-radius:4px; font-weight:700;">${r.shortBadge}</span>
              </div>
              <div style="font-size:12px; color:#94a3b8; margin-top:2px;">${r.desc}</div>
            </div>
          </div>
          <div>
            ${isActive
          ? `<span style="background:${r.color}; color:#fff; font-size:11px; font-weight:800; padding:5px 10px; border-radius:20px;">선택됨 ✓</span>`
          : '<span style="color:#64748b; font-size:12px; font-weight:700;">전환 ➔</span>'}
          </div>
        </div>
      `;
    }).join('');

    modal.classList.add('active');
  },

  closeRoleModal() {
    const modal = document.getElementById('modal-role-selector');
    if (modal) modal.classList.remove('active');
  },

  async openSendMsgModal() {
    const managers = await window.hqStore.getManagers();
    const selectEl = document.getElementById('msg-target-manager');
    if (selectEl) {
      selectEl.innerHTML = '<option value="ALL">전체 매니저 공지</option>';
      managers.forEach(m => {
        selectEl.innerHTML += `<option value="${m.id}">${m.name} (${m.phone})</option>`;
      });
    }
    const form = document.getElementById('form-send-message');
    if (form) form.reset();
    const modal = document.getElementById('modal-send-message');
    if (modal) modal.classList.add('active'); // modal.style.display = 'flex' 대신 active 클래스 사용
  },

  closeSendMsgModal() {
    const modal = document.getElementById('modal-send-message');
    if (modal) modal.classList.remove('active');
  },

  async openManagerModal() {
    const modal = document.getElementById('modal-manager-management');
    if (!modal) return;
    this.updateManagerSlotUI();

    // 대표자(로그인 유저) 도메인 추출하여 폼에 반영
    const ceoEmail = localStorage.getItem('bp_user_email') || '';
    let domain = '@star-ent.com';
    if (ceoEmail.includes('@')) {
      domain = '@' + ceoEmail.split('@')[1];
    }
    const domainEl = document.getElementById('new-mgr-email-domain');
    if (domainEl) {
      domainEl.textContent = domain;
    }

    await this.renderManagerManagementList();
    modal.classList.add('active');
  },

  async openArtistModal() {
    const modal = document.getElementById('modal-artist-management');
    if (!modal) return;
    await this.renderArtistManagementList();
    modal.classList.add('active');
  },

  async renderArtistManagementList() {
    const container = document.getElementById('artist-management-list');
    if (!container) return;

    const artists = await window.hqStore.getArtists();
    const schedules = await window.hqStore.getSchedules();

    if (!artists || artists.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:35px 20px; color:#64748b; font-size:13px; background:#e2e8f0; border-radius:8px; border:1px dashed #cbd5e1;">
          <div style="display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:12px; background:rgba(99,102,241,0.1); color:#6366f1; margin-bottom:8px;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>
          </div>
          <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">등록된 소속 아티스트가 없습니다.</div>
          <div style="font-size:12px; color:#475569;">우측 상단의 <strong>[+ 신규 아티스트 등록]</strong> 버튼을 눌러 추가해보세요.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = artists.map(art => {
      const artSchedules = schedules.filter(s => s.artistId === art.id);
      const rawCare = art.care || art.careInfo || art.care_info;
      let careText = '';
      if (typeof rawCare === 'string') {
        careText = rawCare;
      } else if (rawCare && typeof rawCare === 'object') {
        const parts = [];
        if (rawCare.allergies) parts.push(`🚨 ${rawCare.allergies}`);
        if (rawCare.beverages) parts.push(`☕ ${rawCare.beverages}`);
        if (rawCare.vehicle_pref) parts.push(`🚐 ${rawCare.vehicle_pref}`);
        if (rawCare.emergency) parts.push(`💊 ${rawCare.emergency}`);
        if (rawCare.notes) parts.push(rawCare.notes);
        careText = parts.length > 0 ? parts.join(' · ') : (rawCare.notes || JSON.stringify(rawCare));
      }
      const initials = (art.name || 'A').slice(0, 2).toUpperCase();
      return `
        <div style="background:#e2e8f0; border-radius:10px; padding:12px 16px; border:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
            <div style="width:40px; height:40px; border-radius:10px; background:${art.color || '#6366f1'}; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#fff; box-shadow:0 2px 6px ${art.color || '#6366f1'}40;">
              ${getArtistTypeIcon(art, 20)}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <strong style="color:#0f172a; font-size:15px; font-weight:800;">${art.name}</strong>
                <span style="font-size:11px; background:#e0e7ff; color:#4338ca; border:1px solid #c7d2fe; padding:2px 8px; border-radius:4px; font-weight:700;">${art.type || '그룹'} · ${art.members || 1}명</span>
                <span style="font-size:11px; background:${art.status === '활동중' ? '#ecfdf5' : art.status === '컴백준비' ? '#fdf4ff' : '#f1f5f9'}; color:${art.status === '활동중' ? '#059669' : art.status === '컴백준비' ? '#c026d3' : '#475569'}; border:1px solid ${art.status === '활동중' ? '#a7f3d0' : art.status === '컴백준비' ? '#f5d0fe' : '#cbd5e1'}; padding:2px 8px; border-radius:4px; font-weight:700;">${art.status || '활동중'}</span>
                <span style="font-size:11px; background:#ffffff; color:#475569; border:1px solid #cbd5e1; padding:2px 8px; border-radius:4px; font-weight:600;">스케줄 ${artSchedules.length}건</span>
              </div>
              ${careText ? `<div style="font-size:12px; color:#475569; margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:4px; font-weight:500;" title="${careText}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2"><path d="M10.5 20.5l10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg> 케어: ${careText}</div>` : `<div style="font-size:12px; color:#64748b; margin-top:4px;">케어 정보 미등록</div>`}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <button type="button" onclick="Admin.openArtistFormModal('${art.id}')" style="background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer; transition:all 0.15s; box-shadow:0 1px 2px rgba(0,0,0,0.03);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">수정</button>
            <button type="button" onclick="Admin.deleteArtist('${art.id}', '${art.name}')" style="background:#fee2e2; border:1px solid #fca5a5; color:#dc2626; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer; transition:all 0.15s;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async openArtistFormModal(artistId = null) {
    const modal = document.getElementById('modal-artist-form');
    const form = document.getElementById('form-artist-add');
    const titleEl = document.getElementById('modal-artist-form-title');
    const submitBtn = document.getElementById('btn-submit-artist-save');
    if (!modal || !form) return;

    form.reset();

    if (artistId) {
      const artists = await window.hqStore.getArtists();
      const art = artists.find(a => a.id === artistId);
      if (art) {
        document.getElementById('edit-artist-id').value = art.id;
        document.getElementById('new-artist-name').value = art.name || '';
        
        // 활동 유형 정규화 매핑
        const rawType = (art.type || '').trim();
        let matchedType = '아이돌/걸그룹';
        if (rawType.includes('보이') || rawType.includes('boy')) matchedType = '보이그룹';
        else if (rawType.includes('솔로') || rawType.includes('solo') || rawType.includes('보컬')) matchedType = '솔로가수';
        else if (rawType.includes('배우') || rawType.includes('actor')) matchedType = '배우';
        else if (rawType.includes('MC') || rawType.includes('방송')) matchedType = 'MC/방송인';
        else if (rawType.includes('밴드') || rawType.includes('band')) matchedType = '밴드/기타';
        else if (rawType.includes('걸그룹') || rawType.includes('아이돌') || rawType.includes('그룹')) matchedType = '아이돌/걸그룹';

        document.getElementById('new-artist-type').value = matchedType;
        document.getElementById('new-artist-members').value = art.members || 1;
        document.getElementById('new-artist-color').value = art.color || '#ec4899';
        
        // 활동 상태 복원
        const statusSelect = document.getElementById('new-artist-status');
        if (statusSelect) {
          statusSelect.value = art.status || '활동중';
        }

        // 아이콘 복원
        let iconKey = art.icon;
        if (!iconKey || !ARTIST_ICON_SVGS[iconKey]) {
          if (matchedType === '보이그룹') iconKey = 'zap';
          else if (matchedType === '솔로가수') iconKey = 'mic';
          else if (matchedType === '배우') iconKey = 'film';
          else if (matchedType === 'MC/방송인') iconKey = 'crown';
          else if (matchedType === '밴드/기타') iconKey = 'music';
          else iconKey = 'star';
        }
        this.selectArtistIcon(iconKey);

        const rawModalCare = art.care || art.careInfo || art.care_info;
        let modalCareText = '';
        if (typeof rawModalCare === 'string') {
          modalCareText = rawModalCare;
        } else if (rawModalCare && typeof rawModalCare === 'object') {
          const parts = [];
          if (rawModalCare.allergies) parts.push(`[알러지] ${rawModalCare.allergies}`);
          if (rawModalCare.beverages) parts.push(`[음료/식단] ${rawModalCare.beverages}`);
          if (rawModalCare.vehicle_pref) parts.push(`[차량] ${rawModalCare.vehicle_pref}`);
          if (rawModalCare.emergency) parts.push(`[비상] ${rawModalCare.emergency}`);
          modalCareText = parts.length > 0 ? parts.join(' / ') : (rawModalCare.notes || JSON.stringify(rawModalCare));
        }
        document.getElementById('new-artist-care').value = modalCareText;
        const memberListInput = document.getElementById('new-artist-member-list');
        if (memberListInput) {
          memberListInput.value = (art.memberList && Array.isArray(art.memberList)) ? art.memberList.join(', ') : '';
        }
        
        if (titleEl) titleEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 소속 아티스트 수정';
        if (submitBtn) submitBtn.textContent = '수정 완료';
      }
    } else {
      document.getElementById('edit-artist-id').value = '';
      document.getElementById('new-artist-type').value = '아이돌/걸그룹';
      document.getElementById('new-artist-color').value = '#ec4899';
      const statusSelect = document.getElementById('new-artist-status');
      if (statusSelect) statusSelect.value = '활동중';
      const memberListInput = document.getElementById('new-artist-member-list');
      if (memberListInput) memberListInput.value = '';
      this.selectArtistIcon('star');
      if (titleEl) titleEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg> 소속 아티스트 추가';
      if (submitBtn) submitBtn.textContent = '아티스트 등록';
    }

    modal.classList.add('active');
  },

  async deleteArtist(id, name) {
    if (confirm(`'${name || '해당'}' 아티스트를 정말 삭제하시겠습니까?\n\n소속 스케줄 및 매니저 배정에 영향을 줄 수 있습니다.`)) {
      await window.hqStore.deleteArtist(id);
      await this.renderArtistManagementList();
      const selectPop = document.querySelector('#form-artist');
      if (selectPop) {
        const artists = await window.hqStore.getArtists();
        selectPop.innerHTML = artists.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
      }
      const filterList = document.querySelector('#artist-filter-list');
      if (filterList) {
        const artists = await window.hqStore.getArtists();
        const schedules = await window.hqStore.getSchedules();
        let artistHtml = `
          <div class="artist-chip active" data-artist-id="ALL">
            <div class="artist-avatar" style="background:#6366f1;">🏢</div>
            <div class="artist-meta">
              <div class="name">전체 소속 아티스트</div>
              <div class="sub">통합 캘린더 모드</div>
            </div>
            <span class="count-badge">${schedules.length}</span>
          </div>
        `;
        artists.forEach(art => {
          const count = schedules.filter(s => s.artistId === art.id).length;
          artistHtml += `
            <div class="artist-chip" data-artist-id="${art.id}">
              <div class="artist-avatar" style="background:${art.color}; color:#fff; display:flex; align-items:center; justify-content:center;">${getArtistTypeIcon(art, 15)}</div>
              <div class="artist-meta">
                <div class="name">${art.name}</div>
                <div class="sub">${art.type} · ${art.status || '활동중'}</div>
              </div>
              <span class="count-badge">${count}</span>
            </div>
          `;
        });
        filterList.innerHTML = artistHtml;
      }
      const kpiArtist = document.getElementById('kpi-artist-count');
      if (kpiArtist) {
        const artists = await window.hqStore.getArtists();
        kpiArtist.textContent = `${artists.length}팀`;
      }
      alert(`✅ ${name || '아티스트'} 정보가 삭제되었습니다.`);
    }
  },

  async openScheduleDetail(schId) {
    if (typeof openScheduleDetailModal === 'function') {
      await openScheduleDetailModal(schId);
    }
  },

  async openScheduleDetailModal(schId) {
    if (typeof openScheduleDetailModal === 'function') {
      await openScheduleDetailModal(schId);
    }
  },

  updateManagerSlotUI() {
    const sub = window.hqStore.getSubscription();
    const badge = document.getElementById('mgr-modal-slot-badge');
    const warning = document.getElementById('mgr-form-slot-warning');
    const submitBtn = document.getElementById('btn-submit-mgr-create');

    if (badge) {
      badge.textContent = `슬롯: ${sub.activeManagerCount} / ${sub.totalSlots}석 (${sub.availableSlots}석 잔여)`;
      badge.style.background = sub.isFull ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)';
      badge.style.color = sub.isFull ? '#fca5a5' : '#c7d2fe';
    }

    if (warning) {
      warning.style.display = sub.isFull ? 'inline' : 'none';
    }

    if (submitBtn) {
      if (sub.isFull) {
        submitBtn.textContent = '💳 슬롯 추가 결제 후 생성';
        submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #f59e0b)';
      } else {
        submitBtn.textContent = '매니저 계정 생성';
        submitBtn.style.background = '#6366f1';
      }
    }

    this.updateHeaderSubscriptionBadge();
  },

  updateHeaderSubscriptionBadge() {
    const sub = window.hqStore.getSubscription();
    // 헤더 슬롯 텍스트 업데이트
    const slotText = document.getElementById('header-slot-text');
    if (slotText) {
      const color = sub.isFull ? '#fca5a5' : '#a5f3fc';
      slotText.style.color = color;
      slotText.textContent = `(${sub.activeManagerCount} / ${sub.totalSlots}명)`;
    }
    // 레거시 sub-badge-text (모달 내부용)
    const badgeText = document.getElementById('sub-badge-text');
    if (badgeText) {
      badgeText.textContent = `구독: ${sub.planName || 'Standard'} (${sub.activeManagerCount}/${sub.totalSlots}명 · 월 ${(sub.monthlyFee / 10000).toLocaleString()}만)`;
    }
  },

  // ── 💳 회사 구독 모달 컨트롤러 ──
  tempAdditionalSlots: 0,

  openSubscriptionModal() {
    const sub = window.hqStore.getSubscription();
    this.tempAdditionalSlots = sub.additionalSlots || 0;
    this.renderSubscriptionModalContent();
    const modal = document.getElementById('modal-company-subscription');
    if (modal) {
      modal.classList.add('active');
      const adjustEl = document.getElementById('sub-slot-adjust-count');
      if (adjustEl) adjustEl.textContent = this.tempAdditionalSlots;
    }
  },

  closeSubscriptionModal() {
    const modal = document.getElementById('modal-company-subscription');
    if (modal) modal.classList.remove('active');
  },

  renderSubscriptionModalContent() {
    const sub = window.hqStore.getSubscription();
    const addSlots = this.tempAdditionalSlots;
    const totalSlots = (sub.baseSlots || 2) + addSlots;
    const addFee = addSlots * (sub.additionalSlotFee || 20000);
    const totalFee = (sub.baseFee || 100000) + addFee;
    const usedPct = Math.min(100, Math.round((sub.activeManagerCount / totalSlots) * 100));

    const companyNameEl = document.getElementById('sub-company-name');
    const bizInfoEl = document.getElementById('sub-biz-info');
    const monthlyTotalEl = document.getElementById('sub-monthly-total');
    const slotProgressText = document.getElementById('sub-slot-progress-text');
    const slotProgressBar = document.getElementById('sub-slot-progress-bar');
    const additionalSlotCount = document.getElementById('sub-additional-slot-count');
    const calcAdditionalFee = document.getElementById('sub-calc-additional-fee');
    const calcTotalFee = document.getElementById('sub-calc-total-fee');
    const adjustEl = document.getElementById('sub-slot-adjust-count');

    // ── 실제 회사명/대표자 우선 사용 ──
    const realCompanyName = localStorage.getItem('bp_company_name') || sub.companyName || '회사명 미등록';
    const realCeoName = localStorage.getItem('bp_user_name') || sub.ceoName || '대표자';
    const realEmail = localStorage.getItem('bp_user_email') || '';

    if (companyNameEl) companyNameEl.textContent = realCompanyName;
    if (bizInfoEl) bizInfoEl.textContent = `사업자번호: ${sub.bizNumber || '-'} | 대표자: ${realCeoName}${realEmail ? ' (' + realEmail + ')' : ''}`;
    if (monthlyTotalEl) monthlyTotalEl.textContent = `월 ${totalFee.toLocaleString()}원`;
    if (slotProgressText) {
      slotProgressText.textContent = `${sub.activeManagerCount} / ${totalSlots}명 (${Math.max(0, totalSlots - sub.activeManagerCount)}명 잔여)`;
      slotProgressText.style.color = sub.isFull ? '#fca5a5' : '#a5f3fc';
    }
    if (slotProgressBar) slotProgressBar.style.width = `${usedPct}%`;
    if (additionalSlotCount) additionalSlotCount.textContent = `${addSlots}`;
    if (calcAdditionalFee) calcAdditionalFee.textContent = `+ ${addFee.toLocaleString()}원 / 월`;
    if (calcTotalFee) calcTotalFee.textContent = `월 ${totalFee.toLocaleString()}원 (VAT 별도)`;
    if (adjustEl) adjustEl.textContent = addSlots;
  },

  changeSlotCount(delta) {
    this.tempAdditionalSlots = Math.max(0, this.tempAdditionalSlots + delta);
    this.renderSubscriptionModalContent();
  },

  confirmSlotPayment() {
    const sub       = window.hqStore.getSubscription();
    const addSlots  = this.tempAdditionalSlots;
    const totalSlots = (sub.baseSlots || 2) + addSlots;
    const totalFee   = (sub.baseFee || 100000) + (addSlots * (sub.additionalSlotFee || 20000));

    const company = encodeURIComponent(localStorage.getItem('bp_company_name') || 'My Entertainment');
    const ceo     = encodeURIComponent(localStorage.getItem('bp_user_name') || '대표자');
    const email   = encodeURIComponent(localStorage.getItem('bp_user_email') || '');

    // 임시로 슬롯 저장 (결제 완료 후 payment-result.html에서 최종 확정)
    sub.additionalSlots = addSlots;
    window.hqStore.saveSubscription(sub);

    this.closeSubscriptionModal();

    // 결제 전용 페이지로 이동
    window.location.href =
      `payment.html?addSlots=${addSlots}&totalSlots=${totalSlots}&totalFee=${totalFee}&company=${company}&ceo=${ceo}&email=${email}`;
  },

  async renderManagerManagementList() {
    const container = document.getElementById('manager-mgmt-list');
    if (!container) return;

    const managers = await window.hqStore.getManagers();
    const artists = await window.hqStore.getArtists();

    container.innerHTML = managers.map(mgr => {
      const assigned = mgr.assignedArtists || [];
      const emailDisplay = mgr.email || mgr.id || '아이디 없음';
      return `
        <div style="background:#e2e8f0; border-radius:10px; padding:14px; border:1px solid #cbd5e1; margin-bottom:10px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${mgr.color || '#6366f1'}; box-shadow:0 0 6px ${mgr.color || '#6366f1'}60;"></span>
              <strong style="color:#0f172a; font-size:15px; font-weight:800;">${mgr.name}</strong>
              <span style="font-size:11px; background:#ffffff; color:#475569; border:1px solid #cbd5e1; padding:2px 8px; border-radius:4px; font-weight:700;">${mgr.role === 'hq_admin' ? '본사 관리자' : '현장 매니저'}</span>
            </div>
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
              <span style="font-size:12px; color:#2563eb; font-family:monospace; background:#eff6ff; padding:3px 8px; border-radius:4px; border:1px solid #bfdbfe; font-weight:700;">🆔 ${emailDisplay}</span>
              <span style="font-size:12px; color:#475569; font-weight:600;">📱 ${mgr.phone || '연락처 없음'}</span>
              <div style="display:flex; align-items:center; gap:6px;">
                <button type="button" onclick="Admin.openEditManagerModal('${mgr.id}')" style="background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; font-size:12px; font-weight:700; padding:5px 12px; border-radius:6px; cursor:pointer; transition:all 0.15s; box-shadow:0 1px 2px rgba(0,0,0,0.03);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">수정</button>
                ${mgr.role !== 'hq_admin' ? `<button type="button" onclick="Admin.deleteManager('${mgr.id}')" style="background:#fee2e2; border:1px solid #fca5a5; color:#dc2626; font-size:12px; font-weight:700; padding:5px 12px; border-radius:6px; cursor:pointer; transition:all 0.15s;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">삭제</button>` : ''}
              </div>
            </div>
          </div>
          <div style="font-size:12px; color:#475569; margin-bottom:6px; font-weight:700;">담당 아티스트 선택:</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${artists.map(art => {
        const isChecked = assigned.includes(art.id);
        return `
                <button type="button" 
                  onclick="Admin.toggleArtistAssignment('${mgr.id}', '${art.id}')"
                  style="padding:4px 10px; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s; border:1px solid ${isChecked ? art.color : '#cbd5e1'}; background:${isChecked ? art.color : '#ffffff'}; color:${isChecked ? '#ffffff' : '#475569'}; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                  ${art.name} ${isChecked ? '✓' : '+'}
                </button>
              `;
      }).join('')}
          </div>
        </div>
      `;
    }).join('');
  },

  async openEditManagerModal(id) {
    const managers = await window.hqStore.getManagers();
    const mgr = managers.find(m => m.id === id);
    if (!mgr) return;

    document.getElementById('edit-mgr-id').value = mgr.id;
    document.getElementById('edit-mgr-name').value = mgr.name || '';
    document.getElementById('edit-mgr-email').value = mgr.email || mgr.id;
    document.getElementById('edit-mgr-phone').value = mgr.phone || '';
    const pwEl = document.getElementById('edit-mgr-pw');
    if (pwEl) pwEl.value = '';

    const modal = document.getElementById('modal-manager-edit');
    if (modal) modal.classList.add('active');
  },

  async toggleArtistAssignment(managerId, artistId) {
    const managers = await window.hqStore.getManagers();
    const mgr = managers.find(m => m.id === managerId);
    if (!mgr) return;

    let assigned = [...(mgr.assignedArtists || [])];
    if (assigned.includes(artistId)) {
      assigned = assigned.filter(id => id !== artistId);
    } else {
      assigned.push(artistId);
    }

    await window.hqStore.updateManagerAssignment(managerId, assigned);
    await this.renderManagerManagementList();
  },

  async deleteManager(id) {
    if (confirm('해당 매니저를 삭제하시겠습니까?\n매니저가 삭제되면 앱 로그인이 차단되며 담당 배차 내역에도 영향을 줄 수 있습니다.')) {
      await window.hqStore.deleteManager(id);
      this.updateManagerSlotUI();
      await this.renderManagerManagementList();
      await populateSelectOptions();
      await renderSidebar();
      alert('매니저 계정이 삭제되었습니다.');
    }
  },

  async openScheduleDetail(schId) {
    const popover = document.getElementById('hover-schedule-popover');
    if (popover) {
      popover.style.display = 'none';
      popover.style.opacity = '0';
    }
    const kpiPop = document.getElementById('kpi-hover-popover');
    if (kpiPop) {
      kpiPop.style.display = 'none';
      kpiPop.style.opacity = '0';
    }
    if (typeof window.openScheduleDetailModal === 'function') {
      await window.openScheduleDetailModal(schId);
    }
  },

  async openVehicleModal() {
    const modal = document.getElementById('modal-vehicle-management');
    if (!modal) return;
    await this.renderVehicleManagementList();
    modal.classList.add('active');
  },

  async renderVehicleManagementList() {
    const container = document.getElementById('vehicle-management-list');
    if (!container) return;

    const vehicles = await window.hqStore.getVehicles();
    const schedules = await window.hqStore.getSchedules();
    const todayStr = (d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)(new Date());

    if (!vehicles || vehicles.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:35px 20px; color:#64748b; font-size:13px; background:#e2e8f0; border-radius:8px; border:1px dashed #cbd5e1;">
          <div style="display:inline-flex; align-items:center; justify-content:center; width:44px; height:44px; border-radius:12px; background:rgba(37,99,235,0.1); color:#2563eb; margin-bottom:8px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 7.5 C8.2 4.5 15.8 4.5 16.5 7.5 L17.5 10.8 C19.5 10.5 20.5 11.2 20.5 12.2 C20.5 13.2 19.5 13.8 18 13.8 V18 C18 18.8 17.5 19.5 16.5 19.5 H15.2 C14.5 19.5 14.2 19 14.2 18.2 V16.2 H9.8 V18.2 C9.8 19 9.5 19.5 8.8 19.5 H7.5 C6.5 19.5 6 18.8 6 18 V13.8 C4.5 13.8 3.5 13.2 3.5 12.2 C3.5 11.2 4.5 10.5 6.5 10.8 Z"/><path d="M6.2 11.8 C9 12.6 15 12.6 17.8 11.8"/><path d="M7.2 14.2 C8.6 13.8 9.8 14.3 9.8 15.4 C9.8 16.5 8.5 16.8 7.2 16.2 C6.8 15.6 6.8 14.8 7.2 14.2 Z"/><path d="M16.8 14.2 C15.4 13.8 14.2 14.3 14.2 15.4 C14.2 16.5 15.5 16.8 16.8 16.2 C17.2 15.6 17.2 14.8 16.8 14.2 Z"/></svg>
          </div>
          <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">등록된 지원 차량이 없습니다.</div>
          <div style="font-size:12px; color:#475569;">우측 상단의 <strong>[+ 신규 차량 등록]</strong> 버튼을 눌러 차량을 추가해보세요.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = vehicles.map(veh => {
      const todayDispatches = schedules.filter(s => s.vehicleId === veh.id && s.date === todayStr);
      const isDispatchedToday = todayDispatches.length > 0;
      
      let statusColor = '#047857';
      let statusBg = '#d1fae5';
      let statusBorder = '#a7f3d0';
      if (veh.status === '운행중' || isDispatchedToday) {
        statusColor = '#1d4ed8';
        statusBg = '#dbeafe';
        statusBorder = '#bfdbfe';
      } else if (veh.status === '정비중') {
        statusColor = '#dc2626';
        statusBg = '#fee2e2';
        statusBorder = '#fca5a5';
      }

      return `
        <div style="background:#e2e8f0; border-radius:10px; padding:14px 16px; border:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center; gap:12px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
            <div style="width:42px; height:42px; border-radius:10px; background:#eff6ff; display:flex; align-items:center; justify-content:center; flex-shrink:0; color:#2563eb; border:1px solid #bfdbfe;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 7.5 C8.2 4.5 15.8 4.5 16.5 7.5 L17.5 10.8 C19.5 10.5 20.5 11.2 20.5 12.2 C20.5 13.2 19.5 13.8 18 13.8 V18 C18 18.8 17.5 19.5 16.5 19.5 H15.2 C14.5 19.5 14.2 19 14.2 18.2 V16.2 H9.8 V18.2 C9.8 19 9.5 19.5 8.8 19.5 H7.5 C6.5 19.5 6 18.8 6 18 V13.8 C4.5 13.8 3.5 13.2 3.5 12.2 C3.5 11.2 4.5 10.5 6.5 10.8 Z"/><path d="M6.2 11.8 C9 12.6 15 12.6 17.8 11.8"/><path d="M7.2 14.2 C8.6 13.8 9.8 14.3 9.8 15.4 C9.8 16.5 8.5 16.8 7.2 16.2 C6.8 15.6 6.8 14.8 7.2 14.2 Z"/><path d="M16.8 14.2 C15.4 13.8 14.2 14.3 14.2 15.4 C14.2 16.5 15.5 16.8 16.8 16.2 C17.2 15.6 17.2 14.8 16.8 14.2 Z"/></svg>
            </div>
            <div style="flex:1; min-width:0;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <strong style="color:#0f172a; font-size:15px; font-weight:800;">${veh.name}</strong>
                <span style="font-size:11px; background:#ffffff; color:#0f172a; padding:2px 8px; border-radius:4px; font-weight:800; border:1px solid #cbd5e1;">${veh.number || '번호미등록'}</span>
                <span style="font-size:11px; background:${statusBg}; color:${statusColor}; border:1px solid ${statusBorder}; padding:2px 8px; border-radius:4px; font-weight:700;">${isDispatchedToday ? '오늘 배차 ' + todayDispatches.length + '건' : (veh.status || '운행가능')}</span>
                <span style="font-size:11px; background:#ffffff; color:#475569; border:1px solid #cbd5e1; padding:2px 8px; border-radius:4px; font-weight:600;">${veh.type || '밴'} · ${veh.seats || 7}인승</span>
              </div>
              <div style="font-size:12px; color:#475569; margin-top:4px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-weight:500;">
                ${veh.defaultArtist ? `<span>⭐ 전담: <strong style="color:#0f172a;">${veh.defaultArtist}</strong></span>` : `<span>공용 차량</span>`}
                ${veh.driver ? `<span>👤 담당: <strong style="color:#0f172a;">${veh.driver}</strong></span>` : ''}
                ${veh.notes ? `<span style="color:#64748b;">📝 ${veh.notes}</span>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <button type="button" onclick="Admin.openVehicleFormModal('${veh.id}')" style="background:#ffffff; border:1px solid #cbd5e1; color:#0f172a; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer; transition:all 0.15s; box-shadow:0 1px 2px rgba(0,0,0,0.03);" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='#ffffff'">수정</button>
            <button type="button" onclick="Admin.deleteVehicle('${veh.id}', '${veh.name}')" style="background:#fee2e2; border:1px solid #fca5a5; color:#dc2626; font-size:12px; font-weight:700; padding:6px 12px; border-radius:6px; cursor:pointer; transition:all 0.15s;" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">삭제</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async openVehicleFormModal(vehicleId = null) {
    const modal = document.getElementById('modal-vehicle-form');
    const form = document.getElementById('form-vehicle-add');
    const titleEl = document.getElementById('modal-vehicle-form-title');
    const submitBtn = document.getElementById('btn-submit-vehicle-save');
    const artistSelect = document.getElementById('new-vehicle-artist');
    if (!modal || !form) return;

    form.reset();

    if (artistSelect) {
      const artists = await window.hqStore.getArtists();
      artistSelect.innerHTML = '<option value="">공용 / 미지정</option>' + artists.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
    }

    if (vehicleId) {
      const vehicles = await window.hqStore.getVehicles();
      const veh = vehicles.find(v => v.id === vehicleId);
      if (veh) {
        document.getElementById('edit-vehicle-id').value = veh.id;
        document.getElementById('new-vehicle-name').value = veh.name || '';
        document.getElementById('new-vehicle-number').value = veh.number || '';
        document.getElementById('new-vehicle-type').value = veh.type || '밴/리무진';
        document.getElementById('new-vehicle-seats').value = veh.seats || 7;
        document.getElementById('new-vehicle-status').value = veh.status || '운행가능';
        if (artistSelect) artistSelect.value = veh.defaultArtist || '';
        document.getElementById('new-vehicle-driver').value = veh.driver || '';
        document.getElementById('new-vehicle-notes').value = veh.notes || '';

        if (titleEl) titleEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 7.5 C8.2 4.5 15.8 4.5 16.5 7.5 L17.5 10.8 C19.5 10.5 20.5 11.2 20.5 12.2 C20.5 13.2 19.5 13.8 18 13.8 V18 C18 18.8 17.5 19.5 16.5 19.5 H15.2 C14.5 19.5 14.2 19 14.2 18.2 V16.2 H9.8 V18.2 C9.8 19 9.5 19.5 8.8 19.5 H7.5 C6.5 19.5 6 18.8 6 18 V13.8 C4.5 13.8 3.5 13.2 3.5 12.2 C3.5 11.2 4.5 10.5 6.5 10.8 Z"/><path d="M6.2 11.8 C9 12.6 15 12.6 17.8 11.8"/><path d="M7.2 14.2 C8.6 13.8 9.8 14.3 9.8 15.4 C9.8 16.5 8.5 16.8 7.2 16.2 C6.8 15.6 6.8 14.8 7.2 14.2 Z"/><path d="M16.8 14.2 C15.4 13.8 14.2 14.3 14.2 15.4 C14.2 16.5 15.5 16.8 16.8 16.2 C17.2 15.6 17.2 14.8 16.8 14.2 Z"/></svg> 지원 차량 정보 수정';
        if (submitBtn) submitBtn.textContent = '수정 완료';
      }
    } else {
      document.getElementById('edit-vehicle-id').value = '';
      if (titleEl) titleEl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 7.5 C8.2 4.5 15.8 4.5 16.5 7.5 L17.5 10.8 C19.5 10.5 20.5 11.2 20.5 12.2 C20.5 13.2 19.5 13.8 18 13.8 V18 C18 18.8 17.5 19.5 16.5 19.5 H15.2 C14.5 19.5 14.2 19 14.2 18.2 V16.2 H9.8 V18.2 C9.8 19 9.5 19.5 8.8 19.5 H7.5 C6.5 19.5 6 18.8 6 18 V13.8 C4.5 13.8 3.5 13.2 3.5 12.2 C3.5 11.2 4.5 10.5 6.5 10.8 Z"/><path d="M6.2 11.8 C9 12.6 15 12.6 17.8 11.8"/><path d="M7.2 14.2 C8.6 13.8 9.8 14.3 9.8 15.4 C9.8 16.5 8.5 16.8 7.2 16.2 C6.8 15.6 6.8 14.8 7.2 14.2 Z"/><path d="M16.8 14.2 C15.4 13.8 14.2 14.3 14.2 15.4 C14.2 16.5 15.5 16.8 16.8 16.2 C17.2 15.6 17.2 14.8 16.8 14.2 Z"/></svg> 지원 차량 등록';
      if (submitBtn) submitBtn.textContent = '차량 등록';
    }

    modal.classList.add('active');
  },

  async deleteVehicle(id, name) {
    if (confirm(`'${name || '해당'}' 차량을 정말 삭제하시겠습니까?\n스케줄 배차 내역에 영향을 줄 수 있습니다.`)) {
      await window.hqStore.deleteVehicle(id);
      await this.renderVehicleManagementList();
      const vehSelect = document.getElementById('form-vehicle');
      if (vehSelect) {
        const vehicles = await window.hqStore.getVehicles();
        vehSelect.innerHTML = '<option value="">차량 미지정 / 도보·대중교통</option>' + vehicles.map(v => `<option value="${v.id}">${v.name} (${v.number || v.type || ''})</option>`).join('');
      }
      alert(`✅ [${name || '차량'}]이 정상적으로 삭제되었습니다.`);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // App State
  const state = {
    currentDate: new Date(),
    selectedArtistFilter: 'ALL',
    currentView: 'month', // 'month', 'week', 'gantt'
    activeScheduleId: null
  };

  const kpiDataCache = {
    today: [],
    active: [],
    shop: []
  };

  // Elements
  const el = {
    calendarTitle: document.getElementById('calendar-title'),
    scheduleViewport: document.getElementById('schedule-viewport'),
    artistFilterList: document.getElementById('artist-filter-list'),
    managerStatusList: document.getElementById('manager-status-list'),
    currentDateText: document.getElementById('current-date-text'),

    // KPI
    kpiTodayCount: document.getElementById('kpi-today-count'),
    kpiActiveCount: document.getElementById('kpi-active-count'),
    kpiShopCount: document.getElementById('kpi-shop-count'),
    kpiArtistCount: document.getElementById('kpi-artist-count'),

    // Nav
    btnPrev: document.getElementById('btn-nav-prev'),
    btnToday: document.getElementById('btn-nav-today'),
    btnNext: document.getElementById('btn-nav-next'),
    viewTabs: document.querySelectorAll('.view-tab-btn'),

    // Buttons
    btnOpenAddSchedule: document.getElementById('btn-open-add-schedule'),
    btnOpenAddArtist: document.getElementById('btn-open-add-artist'),
    btnOpenAddManager: document.getElementById('btn-open-add-manager'),
    btnExportExcel: document.getElementById('btn-export-excel'),

    // Modals
    modalScheduleForm: document.getElementById('modal-schedule-form'),
    formSchedule: document.getElementById('form-schedule'),
    scheduleFormTitle: document.getElementById('schedule-form-title'),
    formSchId: document.getElementById('form-sch-id'),
    formTitle: document.getElementById('form-title'),
    formArtist: document.getElementById('form-artist'),
    formCategory: document.getElementById('form-category'),
    formDate: document.getElementById('form-date'),
    formStartTime: document.getElementById('form-start-time'),
    formEndTime: document.getElementById('form-end-time'),
    formManager: document.getElementById('form-manager'),
    formVehicle: document.getElementById('form-vehicle'),
    formLocation: document.getElementById('form-location'),
    formEventDuration: document.getElementById('form-event-duration'),
    formLocationAddress: document.getElementById('form-location-address'),
    formLocationLat: document.getElementById('form-location-lat'),
    formLocationLng: document.getElementById('form-location-lng'),
    btnSearchLocation: document.getElementById('btn-search-location'),
    locationSearchResults: document.getElementById('location-search-results'),
    formShopNeeded: document.getElementById('form-shop-needed'),
    shopFields: document.getElementById('shop-fields'),
    formShopName: document.getElementById('form-shop-name'),
    btnSearchShop: document.getElementById('btn-search-shop'),
    formShopDuration: document.getElementById('form-shop-duration'),
    formShopAddress: document.getElementById('form-shop-address'),
    formDeparturePlace: document.getElementById('form-departure-place'),
    formDepartureAddress: document.getElementById('form-departure-address'),
    formStatus: document.getElementById('form-status'),
    formIsSecret: document.getElementById('form-is-secret'),
    formOutfit: document.getElementById('form-outfit'),
    formContactName: document.getElementById('form-contact-name'),
    formContactPhone: document.getElementById('form-contact-phone'),
    formNotes: document.getElementById('form-notes'),

    modalScheduleDetail: document.getElementById('modal-schedule-detail'),
    detailBodyContent: document.getElementById('detail-body-content'),
    btnEditSchedule: document.getElementById('btn-edit-schedule'),
    btnDeleteSchedule: document.getElementById('btn-delete-schedule'),

    modalArtistForm: document.getElementById('modal-artist-form'),
    formArtistAdd: document.getElementById('form-artist-add'),
    formCreateManager: document.getElementById('form-create-manager')
  };

  // ── Helper Utilities ──
  const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getStatusBadge = (status) => {
    let cls = 'ready';
    if (status === '이동중' || status === 'in_progress') cls = 'moving';
    if (status === '샵진행') cls = 'shop';
    if (status === '완료' || status === 'completed') cls = 'done';
    return `<span class="badge-status ${cls}">${status}</span>`;
  };

  function bindKPIHoverEvents() {
    const kpiPopover = document.getElementById('kpi-hover-popover');
    if (!kpiPopover) return;

    let kpiHideTimer = null;

    // 팝오버 자체로 마우스가 넘어갔을 때 닫히지 않도록 타이머 취소
    kpiPopover.addEventListener('mouseenter', () => {
      if (kpiHideTimer) clearTimeout(kpiHideTimer);
    });

    // 팝오버에서 마우스가 나가면 닫기
    kpiPopover.addEventListener('mouseleave', () => {
      kpiHideTimer = setTimeout(() => {
        kpiPopover.style.opacity = '0';
        setTimeout(() => { if (kpiPopover.style.opacity === '0') kpiPopover.style.display = 'none'; }, 150);
      }, 100);
    });

    const cards = [
      { id: 'kpi-card-today', key: 'today', title: '오늘 총 스케줄', color: '#6366f1', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' },
      { id: 'kpi-card-shop', key: 'shop', title: '헤메샵 경유 스케줄', color: '#be185d', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#be185d" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M6 2.5 L6.8 4.8 L9 5.5 L6.8 6.2 L6 8.5 L5.2 6.2 L3 5.5 L5.2 4.8 Z" fill="#be185d" stroke="none"/><path d="m11.5 12.5-6 6a1.77 1.77 0 1 0 2.5 2.5l6-6"/><path d="m9.5 10.5 4 4"/><path d="M13.5 10.5c-.8-3.2 1-6 4.5-6s4.5 2 4 5.5c-.6 3.2-3.5 4.5-5.5 3.5"/></svg>' },
      { id: 'kpi-card-active', key: 'active', title: '현재 가동중인 차량/팀', color: '#0891b2', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M7.5 7.5 C8.2 4.5 15.8 4.5 16.5 7.5 L17.5 10.8 C19.5 10.5 20.5 11.2 20.5 12.2 C20.5 13.2 19.5 13.8 18 13.8 V18 C18 18.8 17.5 19.5 16.5 19.5 H15.2 C14.5 19.5 14.2 19 14.2 18.2 V16.2 H9.8 V18.2 C9.8 19 9.5 19.5 8.8 19.5 H7.5 C6.5 19.5 6 18.8 6 18 V13.8 C4.5 13.8 3.5 13.2 3.5 12.2 C3.5 11.2 4.5 10.5 6.5 10.8 Z"/><path d="M6.2 11.8 C9 12.6 15 12.6 17.8 11.8"/><path d="M7.2 14.2 C8.6 13.8 9.8 14.3 9.8 15.4 C9.8 16.5 8.5 16.8 7.2 16.2 C6.8 15.6 6.8 14.8 7.2 14.2 Z"/><path d="M16.8 14.2 C15.4 13.8 14.2 14.3 14.2 15.4 C14.2 16.5 15.5 16.8 16.8 16.2 C17.2 15.6 17.2 14.8 16.8 14.2 Z"/></svg>' },
      { id: 'kpi-card-artist', key: 'artist', title: '등록된 소속 아티스트', color: '#10b981', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' }
    ];

    cards.forEach(c => {
      const cardEl = document.getElementById(c.id);
      if (!cardEl) return;

      cardEl.addEventListener('mouseenter', () => {
        if (kpiHideTimer) clearTimeout(kpiHideTimer);
        const dataList = kpiDataCache[c.key] || [];

        let popHtml = `
          <div style="font-size:13px; font-weight:800; border-bottom:1px solid #cbd5e1; padding-bottom:8px; margin-bottom:10px; color:#0f172a; display:flex; justify-content:space-between; align-items:center;">
            <span style="display:flex; align-items:center;">${c.iconSvg} ${c.title}</span>
            <span style="background:${c.color}; color:#fff; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:800;">${dataList.length}${c.key === 'artist' ? '팀' : '건'}</span>
          </div>
        `;

        if (dataList.length === 0) {
          popHtml += `
            <div style="text-align:center; padding:18px 10px; color:#64748b; font-size:12px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0;">
              해당하는 내역이 없습니다.
            </div>
          `;
        } else if (c.key === 'artist') {
          popHtml += `
            <div style="display:flex; flex-direction:column; gap:6px; max-height:240px; overflow-y:auto; padding-right:4px;">
              ${dataList.map(art => `
                <div class="kpi-popover-art-item" onclick="Admin.openArtistModal()" style="background:#e2e8f0; padding:8px 12px; border-radius:8px; cursor:pointer; font-size:12px; border:1px solid #cbd5e1; display:flex; justify-content:space-between; align-items:center; transition:all 0.15s; box-shadow:0 1px 2px rgba(0,0,0,0.03);" onmouseenter="this.style.background='#dbeafe'; this.style.borderColor='${c.color}'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.background='#e2e8f0'; this.style.borderColor='#cbd5e1'; this.style.transform='none';">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="width:24px; height:24px; border-radius:6px; background:${art.color || '#6366f1'}; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700;">
                      ${getArtistTypeIcon(art, 13)}
                    </span>
                    <strong style="color:#0f172a; font-size:13.5px; font-weight:800;">${art.name}</strong>
                  </div>
                  <span style="font-size:11px; background:#ffffff; color:#475569; border:1px solid #cbd5e1; padding:2px 6px; border-radius:4px; font-weight:700;">${art.type || '그룹'} · ${art.members || 1}명</span>
                </div>
              `).join('')}
            </div>
            <div style="font-size:11px; color:#64748b; text-align:center; margin-top:8px; background:#f8fafc; padding:7px; border-radius:8px; border:1px solid #e2e8f0; font-weight:500;">
              💡 클릭 시 <strong>[아티스트 관리]</strong> 모달이 열립니다.
            </div>
          `;
        } else {
          popHtml += `
            <div style="display:flex; flex-direction:column; gap:6px; max-height:260px; overflow-y:auto; padding-right:4px;">
              ${dataList.map(sch => `
                <div class="kpi-popover-item" data-id="${sch.id}" onclick="Admin.openScheduleDetail('${sch.id}')" style="background:#e2e8f0; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:12px; border:1px solid #cbd5e1; transition:all 0.15s; box-shadow:0 1px 2px rgba(0,0,0,0.03);" onmouseenter="this.style.background='#dbeafe'; this.style.borderColor='${c.color}'; this.style.transform='translateY(-1px)';" onmouseleave="this.style.background='#e2e8f0'; this.style.borderColor='#cbd5e1'; this.style.transform='none';">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                    <span style="font-weight:800; color:#2563eb; font-family:monospace; font-size:11.5px; display:inline-flex; align-items:center; gap:4px;">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ${sch.startTime} ~ ${sch.endTime || ''}
                    </span>
                    <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; background:#ffffff; color:#475569; border:1px solid #cbd5e1;">${sch.status || '확정'}</span>
                  </div>
                  <div style="font-weight:800; color:#0f172a; margin-bottom:4px; font-size:13.5px; display:flex; align-items:center; gap:6px;">
                    <span style="background:${c.color}; color:#fff; font-size:10px; padding:1px 6px; border-radius:4px; font-weight:700;">${sch.artistName || '아티스트'}</span>
                    <span>${sch.title}</span>
                  </div>
                  <div style="font-size:11.5px; color:#475569; display:flex; justify-content:space-between; align-items:center; font-weight:500;">
                    <span style="display:inline-flex; align-items:center; gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>${sch.location || '장소 미지정'}</span>
                    <span style="display:inline-flex; align-items:center; gap:3px;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${sch.managerName || '미배정'}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="font-size:11px; color:#64748b; text-align:center; margin-top:8px; background:#f8fafc; padding:7px; border-radius:8px; border:1px solid #e2e8f0; font-weight:500;">
              💡 일정을 클릭하시면 <strong>상세 정보 및 역산 동선</strong>이 열립니다.
            </div>
          `;
        }

        kpiPopover.innerHTML = popHtml;

        kpiPopover.querySelectorAll('.kpi-popover-item').forEach(item => {
          item.addEventListener('click', () => {
            kpiPopover.style.display = 'none';
            Admin.openScheduleDetail(item.dataset.id);
          });
        });

        const rect = cardEl.getBoundingClientRect();
        kpiPopover.style.left = Math.max(10, rect.left + (rect.width / 2) - 175) + 'px';
        kpiPopover.style.top = (rect.bottom + 8) + 'px';
        kpiPopover.style.display = 'block';
        kpiPopover.style.opacity = '1';
      });

      cardEl.addEventListener('mouseleave', () => {
        kpiHideTimer = setTimeout(() => {
          kpiPopover.style.opacity = '0';
          setTimeout(() => { if (kpiPopover.style.opacity === '0') kpiPopover.style.display = 'none'; }, 150);
        }, 100);
      });
    });
  }

  // ── Init ──
  async function init() {
    // 🛡️ Auth & Role Guard
    const isLoggedIn = localStorage.getItem('bp_logged_in') === 'true';
    const role = window.AuthPersona ? window.AuthPersona.getCurrentRole() : 'manager';

    if (!isLoggedIn) {
      window.location.replace('admin-login.html');
      return;
    }

    if (role === 'manager' || role === 'staff') {
      alert('권한이 없습니다. (HQ 관리자 또는 CEO 전용 페이지입니다)');
      window.location.href = 'index.html';
      return;
    }

    window.Admin.updateSupabaseBadge();
    window.Admin.updateHeaderSubscriptionBadge();
    window.Admin.updateRoleBadge();
    setupEventListeners();
    bindKPIHoverEvents();
    await populateSelectOptions();
    await renderSidebar();
    await renderKPI();
    await renderCurrentView();

    // Supabase Realtime 구독
    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      window.SupabaseClient.subscribeToSchedules(() => {
        renderSidebar();
        renderKPI();
        renderCurrentView();
      });
    }

    // BroadcastChannel 로컬 실시간 리스너
    window.hqStore.broadcast.onmessage = () => {
      renderSidebar();
      renderKPI();
      renderCurrentView();
    };
  }

  // ── Select Options 채우기 ──
  async function populateSelectOptions() {
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const vehicles = await window.hqStore.getVehicles();

    // 아티스트 select
    el.formArtist.innerHTML = artists.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

    // 매니저 select
    el.formManager.innerHTML = managers.map(m => `<option value="${m.id}">${m.name} (${m.phone || '로드'})</option>`).join('');

    // 차량 select
    el.formVehicle.innerHTML = '<option value="">차량 미지정 / 도보·대중교통</option>' + vehicles.map(v => `<option value="${v.id}">${v.name} (${v.number || v.type || ''})</option>`).join('');
  }

  // ── 사이드바 렌더링 ──
  async function renderSidebar() {
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const schedules = await window.hqStore.getSchedules();

    // 1. 아티스트 칩 목록
    let artistHtml = `
      <div class="artist-chip ${state.selectedArtistFilter === 'ALL' ? 'active' : ''}" data-artist-id="ALL">
        <div class="artist-avatar" style="background:#6366f1; color:#fff; display:flex; align-items:center; justify-content:center;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="22.01"></line><line x1="15" y1="22" x2="15" y2="22.01"></line><line x1="12" y1="22" x2="12" y2="22.01"></line><line x1="8" y1="6" x2="8" y2="6.01"></line><line x1="16" y1="6" x2="16" y2="6.01"></line><line x1="8" y1="10" x2="8" y2="10.01"></line><line x1="16" y1="10" x2="16" y2="10.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line></svg>
        </div>
        <div class="artist-meta">
          <div class="name">전체 소속 아티스트</div>
          <div class="sub">통합 캘린더 모드</div>
        </div>
        <span class="count-badge">${schedules.length}</span>
      </div>
    `;

    artists.forEach(art => {
      const count = schedules.filter(s => s.artistId === art.id).length;
      const isSel = state.selectedArtistFilter === art.id;
      artistHtml += `
        <div class="artist-chip ${isSel ? 'active' : ''}" data-artist-id="${art.id}">
          <div class="artist-avatar" style="background:${art.color}; color:#fff; display:flex; align-items:center; justify-content:center;">
            ${getArtistTypeIcon(art, 15)}
          </div>
          <div class="artist-meta">
            <div class="name">${art.name}</div>
            <div class="sub">${art.type} · ${art.status || '활동중'}</div>
          </div>
          <span class="count-badge">${count}</span>
        </div>
      `;
    });
    el.artistFilterList.innerHTML = artistHtml;
  }

  // ── KPI 통계 렌더링 ──
  async function renderKPI() {
    const schedules = await window.hqStore.getSchedules();
    const artists = await window.hqStore.getArtists();
    const todayStr = fmtDate(new Date());

    const todaySchedules = schedules.filter(s => s.date === todayStr);
    const activeSchedules = todaySchedules.filter(s => s.status === '이동중' || s.status === '샵진행' || s.status === '진행중' || s.status === 'in_progress');
    const shopSchedules = todaySchedules.filter(s => s.shopLocation || (s.shop && s.shop.needed));

    kpiDataCache.today = todaySchedules;
    kpiDataCache.active = activeSchedules;
    kpiDataCache.shop = shopSchedules;
    kpiDataCache.artist = artists;

    el.kpiTodayCount.textContent = `${todaySchedules.length}건`;
    el.kpiActiveCount.textContent = `${activeSchedules.length}건`;
    el.kpiShopCount.textContent = `${shopSchedules.length}건`;
    el.kpiArtistCount.textContent = `${artists.length}팀`;
  }

  // ── 뷰 렌더링 라우터 ──
  async function renderCurrentView() {
    if (state.currentView === 'month') {
      await renderMonthView();
    } else if (state.currentView === 'week') {
      await renderWeekView();
    } else if (state.currentView === 'gantt') {
      await renderGanttView();
    } else if (state.currentView === 'kanban') {
      await renderKanbanView();
    } else if (state.currentView === 'map') {
      await renderMapView();
    } else if (state.currentView === 'analytics') {
      await renderAnalyticsView();
    }
  }

  // ── 1. 월간 캘린더 뷰 (Month View) ──
  async function renderMonthView() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    if (el.calendarTitle) el.calendarTitle.textContent = `${year}년 ${month + 1}월`;
    if (el.currentDateText) el.currentDateText.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0(일) ~ 6(토)
    const totalDays = lastDay.getDate();

    let allSchedules = await window.hqStore.getSchedules();
    if (state.selectedArtistFilter !== 'ALL') {
      allSchedules = allSchedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();

    let html = `
      <div style="display:grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-auto-rows: minmax(110px, auto); gap:8px; width:100%; box-sizing:border-box;">
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--accent-pink); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); min-width:0; box-sizing:border-box;">일</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); min-width:0; box-sizing:border-box;">월</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); min-width:0; box-sizing:border-box;">화</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); min-width:0; box-sizing:border-box;">수</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); min-width:0; box-sizing:border-box;">목</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); min-width:0; box-sizing:border-box;">금</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--accent-cyan); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color); min-width:0; box-sizing:border-box;">토</div>
    `;

    // 이전 달 빈 칸 (기본 min-height 110px, 그리드 행 높이에 자동 동기화)
    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<div class="cal-empty-slot" style="background:transparent; border:1px dashed rgba(0,0,0,0.08); border-radius:8px; min-height:110px; height:100%; min-width:0; box-sizing:border-box; padding:0; margin:0;"></div>`;
    }

    const todayStr = fmtDate(new Date());

    // 이번 달 날짜들 (기본 110px, 일정 3~5건 시 해당 주만 자연스럽게 자동 확장)
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = fmtDate(d);
      const isToday = dateStr === todayStr;
      const dayOfWeek = d.getDay();
      let dayColor = dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#3b82f6' : '#0f172a';

      // 해당 날짜 스케줄 필터
      const daySchedules = allSchedules.filter(s => s.date === dateStr);

      html += `
        <div class="cal-cell ${isToday ? 'today' : ''}" data-date="${dateStr}" 
          style="background:var(--bg-card); border:${isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; border-radius:8px; min-height:110px; height:100%; min-width:0; box-sizing:border-box; padding:8px 10px; display:flex; flex-direction:column; gap:4px; cursor:pointer; transition:all 0.2s; overflow:hidden; position:relative;" onmouseenter="this.style.background='var(--bg-card-hover)'" onmouseleave="this.style.background='var(--bg-card)'">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
            <span style="font-size:14px; font-weight:800; color:${dayColor};">${day}</span>
            ${daySchedules.length > 0 ? `<span style="font-size:10px; background:rgba(79,70,229,0.1); color:#4f46e5; padding:1px 6px; border-radius:10px; font-weight:700;">${daySchedules.length}건</span>` : ''}
          </div>
          <div class="cell-events" style="display:flex; flex-direction:column; gap:3px; flex:1; min-width:0;">
      `;

      // 최대 5개까지 일정 뱃지로 직접 노출 (일정이 많아지면 셀이 아래로 자동 확장됨)
      daySchedules.slice(0, 5).forEach(sch => {
        const art = artists.find(a => a.id === sch.artistId);
        const isSec = sch.isSecret === true;
        const artColor = isSec ? '#9333ea' : (art ? art.color : '#4f46e5');
        const lockPrefix = isSec ? '🔒 ' : '';
        const memberTag = (sch.targetMembers && sch.targetMembers !== 'ALL' && Array.isArray(sch.targetMembers)) ? ` (${sch.targetMembers.join('/')})` : '';
        html += `
          <div class="cal-event-pill" style="background:${artColor}; color:#fff; padding:0 8px; height:23px; line-height:23px; border-radius:5px; font-size:11px; font-weight:700; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.05); border-left:3px solid ${isSec ? '#f43f5e' : 'rgba(255,255,255,0.9)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-shrink:0; min-width:0;" data-sch-id="${sch.id}">
            ${lockPrefix}${art ? `[${art.name.split(' ')[0]}${memberTag}] ` : ''}${sch.title}
          </div>
        `;
      });

      if (daySchedules.length > 5) {
        html += `<div style="font-size:10px; color:#4f46e5; text-align:right; font-weight:800; margin-top:1px;">+${daySchedules.length - 5}개 더보기 🔍</div>`;
      }

      html += `
          </div>
        </div>
      `;
    }

    html += `</div>`;
    el.scheduleViewport.innerHTML = html;
  }

  // ── 2. 주간 타임테이블 뷰 (Week View) ──
  async function renderWeekView() {
    const curr = new Date(state.currentDate);
    const first = curr.getDate() - curr.getDay(); // Sunday
    const weekStart = new Date(curr.setDate(first));

    const year = weekStart.getFullYear();
    const month = weekStart.getMonth() + 1;
    if (el.calendarTitle) el.calendarTitle.textContent = `${year}년 ${month}월 주간 타임테이블`;
    if (el.currentDateText) el.currentDateText.textContent = `${year}년 ${month}월`;

    let allSchedules = await window.hqStore.getSchedules();
    if (state.selectedArtistFilter !== 'ALL') {
      allSchedules = allSchedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      weekDays.push(d);
    }

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    let html = `
      <div style="display:grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap:12px; min-height:500px; width:100%; box-sizing:border-box;">
    `;

    weekDays.forEach((d, idx) => {
      const dateStr = fmtDate(d);
      const isToday = dateStr === fmtDate(new Date());
      const daySchedules = allSchedules.filter(s => s.date === dateStr);

      html += `
        <div style="background:var(--bg-card); border-radius:10px; padding:12px; border:${isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; display:flex; flex-direction:column; gap:10px; min-width:0; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">
            <span style="font-weight:700; color:${idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : '#0f172a'};">${dayNames[idx]}요일 (${d.getDate()}일)</span>
            <span style="font-size:12px; color:#64748b;">${daySchedules.length}건</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; overflow-y:auto;">
      `;

      if (daySchedules.length === 0) {
        html += `<div style="color:#64748b; font-size:12px; text-align:center; padding:20px 0;">일정 없음</div>`;
      } else {
        daySchedules.forEach(sch => {
          const isSec = sch.isSecret === true;
          const canView = window.AuthPersona ? window.AuthPersona.canViewSecret(sch) : true;
          const displayTitle = (isSec && !canView) ? '🔒 [극비 보안 스케줄]' : (isSec ? `🔒 [비공개] ${sch.title}` : sch.title);

          const art = artists.find(a => a.id === sch.artistId);
          const artColor = art ? art.color : '#4f46e5';
          html += `
            <div class="cal-event-pill" style="--art-color: ${artColor}; padding:8px; border-radius:6px; cursor:pointer; min-width:0; overflow:hidden;" data-sch-id="${sch.id}">
              <div style="font-weight:600; font-size:12px; color:#ffffff;">${sch.startTime} ~ ${sch.endTime}</div>
              <div style="font-size:13px; font-weight:700; color:#ffffff; margin:2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${displayTitle}</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.8); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">👤 ${sch.artistName || '아티스트'} | 🚗 ${sch.managerName || '매니저'}</div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    el.scheduleViewport.innerHTML = html;
  }

  // ── 3. 아티스트별 간트/타임라인 뷰 (Gantt View) ──
  async function renderGanttView() {
    const todayStr = fmtDate(state.currentDate);
    if (el.calendarTitle) el.calendarTitle.textContent = `${todayStr} 아티스트별 타임라인 (Gantt)`;
    if (el.currentDateText) {
      const y = state.currentDate.getFullYear();
      const m = state.currentDate.getMonth() + 1;
      const d = state.currentDate.getDate();
      el.currentDateText.textContent = `${y}년 ${m}월 ${d}일`;
    }

    const artists = await window.hqStore.getArtists();
    const schedules = await window.hqStore.getSchedules({ date: todayStr });

    let html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
    `;

    artists.forEach(art => {
      const artSch = schedules.filter(s => s.artistId === art.id);
      html += `
        <div style="background:#1e293b; border-radius:10px; padding:16px; border:1px solid #334155;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
            <span style="width:28px; height:28px; border-radius:8px; background:${art.color || '#6366f1'}; display:flex; align-items:center; justify-content:center; color:#fff;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </span>
            <h3 style="margin:0; font-size:16px; color:#fff; font-weight:800;">${art.name}</h3>
            <span style="font-size:12px; color:#94a3b8;">(${art.type})</span>
            <span style="margin-left:auto; font-size:12px; color:#10b981; font-weight:700;">오늘 일정 ${artSch.length}건</span>
          </div>
          <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:6px;">
      `;

      if (artSch.length === 0) {
        html += `<div style="color:#64748b; font-size:13px; padding:6px 0;">오늘 등록된 스케줄이 없습니다.</div>`;
      } else {
        artSch.forEach(sch => {
          const isSec = sch.isSecret === true;
          const canView = window.AuthPersona ? window.AuthPersona.canViewSecret(sch) : true;
          const displayTitle = (isSec && !canView) ? '대외비 보안 스케줄' : (isSec ? `[비공개] ${sch.title}` : sch.title);
          const displayLoc = (isSec && !canView) ? '비공개 장소' : (sch.location || '장소 미지정');

          html += `
            <div class="cal-event-pill" style="--art-color: ${art.color}; padding:10px 14px; border-radius:8px; min-width:230px; cursor:pointer;" data-sch-id="${sch.id}">
              <div style="font-size:12px; color:#93c5fd; font-weight:700; display:flex; align-items:center; gap:4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${sch.startTime} ~ ${sch.endTime}
              </div>
              <div style="font-size:14px; font-weight:800; color:#fff; margin:4px 0;">${displayTitle}</div>
              <div style="font-size:12px; color:#cbd5e1; display:flex; align-items:center; gap:4px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${displayLoc}
              </div>
              <div style="font-size:11px; color:#94a3b8; margin-top:4px; display:flex; align-items:center; gap:4px;">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                담당: ${sch.managerName || '매니저'}
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    el.scheduleViewport.innerHTML = html;
  }

  // ── 4. 실시간 관제 칸반 보드 뷰 (Kanban View) ──
  async function renderKanbanView() {
    const todayStr = fmtDate(state.currentDate);
    if (el.calendarTitle) el.calendarTitle.textContent = `${todayStr} 실시간 상황판 (Kanban Control)`;
    if (el.currentDateText) {
      const y = state.currentDate.getFullYear();
      const m = state.currentDate.getMonth() + 1;
      const d = state.currentDate.getDate();
      el.currentDateText.textContent = `${y}년 ${m}월 ${d}일`;
    }

    let schedules = await window.hqStore.getSchedules({ date: todayStr });
    if (state.selectedArtistFilter !== 'ALL') {
      schedules = schedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();

    // 5 Columns with sleek Line SVGs
    const cols = [
      { key: 'ready', title: '예정 / 출발대기', color: '#60a5fa', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:5px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' },
      { key: 'moving', title: '픽업 / 이동중', color: '#f59e0b', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:5px;"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>' },
      { key: 'shop', title: '헤메샵 진행중', color: '#ec4899', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:5px;"><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg>' },
      { key: 'onsite', title: '현장대기 / 진행중', color: '#818cf8', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:5px;"><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15 10 9"/></svg>' },
      { key: 'done', title: '일정 완료', color: '#34d399', iconSvg: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:5px;"><polyline points="20 6 9 17 4 12"/></svg>' }
    ];

    // Classify schedules
    const categorized = { ready: [], moving: [], shop: [], onsite: [], done: [] };

    schedules.forEach(s => {
      const st = s.status || '';
      const tl = s.timeline || [];
      const hasMovingStep = tl.some(t => t.moving);
      const allDone = tl.length > 0 && tl.every(t => t.done);

      if (st === '완료' || st === 'completed' || allDone) {
        categorized.done.push(s);
      } else if (st === '이동중' || hasMovingStep) {
        categorized.moving.push(s);
      } else if (st === '샵진행' || tl.some(t => !t.done && (t.label.includes('샵') || t.label.includes('메이크업')))) {
        categorized.shop.push(s);
      } else if (st === 'in_progress' || st === '진행중' || tl.some(t => !t.done && (t.label.includes('현장') || t.label.includes('메인') || t.label.includes('녹화')))) {
        categorized.onsite.push(s);
      } else {
        categorized.ready.push(s);
      }
    });

    let html = `<div class="kanban-board-container">`;

    cols.forEach(col => {
      const list = categorized[col.key];
      html += `
        <div class="kanban-column">
          <div class="kanban-col-header" style="border-top:3px solid ${col.color}; display:flex; justify-content:space-between; align-items:center;">
            <span style="display:flex; align-items:center;">${col.iconSvg} ${col.title}</span>
            <span class="kanban-col-count" style="color:${col.color};">${list.length}</span>
          </div>
          <div class="kanban-col-body">
      `;

      if (list.length === 0) {
        html += `<div style="text-align:center; padding:30px 10px; color:#64748b; font-size:12px;">일정 없음</div>`;
      } else {
        list.forEach(sch => {
          const isSec = sch.isSecret === true;
          const canView = window.AuthPersona ? window.AuthPersona.canViewSecret(sch) : true;
          const displayTitle = (isSec && !canView) ? '대외비 보안 스케줄' : (isSec ? `[비공개] ${sch.title}` : sch.title);
          const displayLoc = (isSec && !canView) ? '비공개 장소' : (sch.location || '장소 미정');

          const art = artists.find(a => a.id === sch.artistId);
          const artColor = art ? art.color : '#6366f1';
          const isMoving = col.key === 'moving';
          const isDone = col.key === 'done';

          let currentStepText = '대기 중';
          if (sch.timeline && sch.timeline.length > 0) {
            const activeStep = sch.timeline.find(t => t.moving) || sch.timeline.find(t => !t.done) || sch.timeline[sch.timeline.length - 1];
            if (activeStep) currentStepText = (activeStep.label || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim();
          }
          const displayStep = (isSec && !canView) ? '비공개 상태' : currentStepText;

          html += `
            <div class="kanban-card ${isMoving ? 'kanban-card-moving' : ''} ${isDone ? 'kanban-card-done' : ''}" 
                 style="--accent-theme: ${artColor};" data-sch-id="${sch.id}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:11px; font-weight:800; color:${artColor}; background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:4px;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  ${sch.artistName || '아티스트'}
                </span>
                ${getStatusBadge(sch.status)}
              </div>
              
              <div style="font-size:14px; font-weight:800; color:#fff; margin-bottom:6px; line-height:1.3;">
                ${displayTitle}
              </div>

              <div style="font-size:12px; color:#94a3b8; display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:4px;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <strong style="color:#f8fafc;">${sch.startTime} ~ ${sch.endTime || ''}</strong>
                </div>
                <div style="display:flex; align-items:center; gap:4px;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>${displayLoc}</span>
                </div>
                <div style="display:flex; align-items:center; gap:8px; font-size:11px;">
                  <span style="display:inline-flex; align-items:center; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${sch.managerName || '미배정'}</span>
                  <span>|</span>
                  <span style="display:inline-flex; align-items:center; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>${sch.vehicleName || '차량 미지정'}</span>
                </div>
              </div>

              <div style="background:#1e293b; padding:8px 10px; border-radius:6px; font-size:11px; color:#cbd5e1; display:flex; justify-content:space-between; align-items:center; border:1px solid #334155;">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:inline-flex; align-items:center; gap:4px;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                  ${displayStep}
                </span>
                <button type="button" onclick="Admin.openScheduleDetailModal('${sch.id}')" style="background:#4f46e5; color:#fff; border:none; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; cursor:pointer; flex-shrink:0;">상세 ↗</button>
              </div>
            </div>
          `;
        });
      }

      html += `
          </div>
        </div>
      `;
    });

    html += `</div>`;
    el.scheduleViewport.innerHTML = html;
  }

  // ── 5. 종합 관제 지도 뷰 (Map View) ──
  async function renderMapView() {
    const todayStr = fmtDate(state.currentDate);
    if (el.calendarTitle) el.calendarTitle.textContent = `${todayStr} 종합 관제 지도 (Control Map)`;
    if (el.currentDateText) {
      const y = state.currentDate.getFullYear();
      const m = state.currentDate.getMonth() + 1;
      const d = state.currentDate.getDate();
      el.currentDateText.textContent = `${y}년 ${m}월 ${d}일`;
    }

    let schedules = await window.hqStore.getSchedules({ date: todayStr });
    if (state.selectedArtistFilter !== 'ALL') {
      schedules = schedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();
    const vehicles = await window.hqStore.getVehicles();

    // Map control grid
    let html = `
      <div class="map-control-grid">
        <!-- 지도 인터랙티브 관제 영역 -->
        <div class="map-canvas-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #334155; padding-bottom:10px;">
            <h4 style="color:#fff; font-size:15px; font-weight:800; display:flex; align-items:center; gap:8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
              수도권 주요 방송국/스튜디오 & 실시간 아티스트 동선 관제
            </h4>
            <div style="display:flex; gap:8px;">
              <span class="badge-status moving" style="display:inline-flex; align-items:center; gap:5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>
                이동중 ${schedules.filter(s => s.status === '이동중' || s.timeline?.some(t => t.moving)).length}대
              </span>
              <span class="badge-status done" style="display:inline-flex; align-items:center; gap:5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                완료 ${schedules.filter(s => s.status === '완료' || s.status === 'completed').length}건
              </span>
            </div>
          </div>

          <!-- 관제 지도 캔버스 -->
          <div id="hq-control-map-viewport" style="flex:1; min-height:400px; background:#0f172a; border-radius:10px; border:1px solid #334155; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; padding:20px; background:radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);">
            
            <!-- Map background grid overlay -->
            <div style="position:absolute; inset:0; background-image:linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size:40px 40px; pointer-events:none;"></div>

            <!-- Map pins grid -->
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; position:relative; z-index:2;">
              ${schedules.length === 0 ? '<div style="color:#94a3b8; font-size:14px; grid-column:span 3; text-align:center; padding:100px 0;">오늘 예정된 스케줄 및 동선이 없습니다.</div>' : ''}
              ${schedules.map((sch, i) => {
      const art = artists.find(a => a.id === sch.artistId);
      const isMoving = sch.status === '이동중' || sch.timeline?.some(t => t.moving);
      const isDone = sch.status === '완료' || sch.status === 'completed';

      return `
                  <div onclick="Admin.openScheduleDetailModal('${sch.id}')" 
                       style="background:rgba(30,41,59,0.9); border:2px solid ${isMoving ? '#f59e0b' : isDone ? '#10b981' : '#4f46e5'}; border-radius:12px; padding:14px; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(0,0,0,0.3); backdrop-filter:blur(8px);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                      <span style="background:${art?.color || '#4f46e5'}; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px;">
                        ${sch.artistName}
                      </span>
                      <span style="font-size:11px; font-weight:700; color:${isMoving ? '#fbbf24' : isDone ? '#34d399' : '#a5b4fc'}; display:inline-flex; align-items:center; gap:4px;">
                        ${isMoving ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg> 이동 중' : isDone ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> 완료' : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 대기중'}
                      </span>
                    </div>

                    <div style="font-size:13px; font-weight:800; color:#fff; margin-bottom:6px; line-height:1.3; display:flex; align-items:center; gap:6px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>
                      <span>${sch.title}</span>
                    </div>

                    <div style="font-size:12px; color:#cbd5e1; font-weight:600; display:flex; align-items:center; gap:4px;">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span>${sch.location || '장소 미정'}</span>
                    </div>

                    <div style="font-size:11px; color:#94a3b8; margin-top:8px; padding-top:6px; border-top:1px dashed #334155; display:flex; justify-content:space-between;">
                      <span style="display:inline-flex; align-items:center; gap:4px;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        ${sch.managerName || '매니저'}
                      </span>
                      <span style="display:inline-flex; align-items:center; gap:4px;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>
                        ${sch.vehicleName || '배차 차량'}
                      </span>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>

            <!-- Footer status summary inside map canvas -->
            <div style="position:relative; z-index:2; margin-top:20px; background:rgba(15,23,42,0.85); border:1px solid #334155; padding:12px 16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; color:#94a3b8; display:inline-flex; align-items:center; gap:6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>
                본사 관제 센터: 현장 매니저플래너 앱과 실시간 2-way 데이터 동기화 활성화됨
              </span>
              <span style="font-size:12px; font-weight:700; color:#38bdf8;">수도권 주요 방송국/샵 거점 관제 모드</span>
            </div>

          </div>
        </div>

        <!-- 우측 차량 / 매니저 현황 패널 -->
        <div class="map-vehicle-sidebar">
          <div style="background:#1e293b; border-radius:var(--radius-md); border:1px solid #334155; padding:14px;">
            <h4 style="color:#fff; font-size:14px; font-weight:800; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>
              전사 배차 현황 (${vehicles.length}대)
            </h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${vehicles.map(v => {
      const assignedSched = schedules.find(s => s.vehicleId === v.id || s.vehicleName === v.name);
      const isBusy = !!assignedSched;
      const isMoving = assignedSched && (assignedSched.status === '이동중' || assignedSched.timeline?.some(t => t.moving));
      return `
                  <div style="background:#0f172a; padding:10px 12px; border-radius:8px; border:1px solid ${isMoving ? '#f59e0b' : isBusy ? '#4f46e5' : '#334155'}; font-size:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span style="font-weight:800; color:#fff;">${v.name}</span>
                      <span style="font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; background:${isMoving ? '#f59e0b' : isBusy ? '#4f46e5' : '#334155'}; color:#fff; display:inline-flex; align-items:center; gap:3px;">
                        ${isMoving ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/></svg> 주행중' : isBusy ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 운행예정' : '차고지 대기'}
                      </span>
                    </div>
                    ${assignedSched ? `
                      <div style="color:#93c5fd; font-size:11px; font-weight:600;">[${assignedSched.artistName}] ${assignedSched.title}</div>
                      <div style="color:#94a3b8; font-size:11px; display:flex; align-items:center; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${assignedSched.location || '현장'}</div>
                    ` : '<div style="color:#64748b; font-size:11px;">즉시 배차 가능</div>'}
                  </div>
                `;
    }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    el.scheduleViewport.innerHTML = html;
  }

  // ── 6. 전사 활동 분석 차트 및 리포트 (Analytics View) ──
  async function renderAnalyticsView() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth() + 1;
    if (el.calendarTitle) el.calendarTitle.textContent = `${year}년 ${month}월 전사 활동 분석 리포트`;
    if (el.currentDateText) el.currentDateText.textContent = `${year}년 ${month}월`;

    const allSchedules = await window.hqStore.getSchedules();
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const vehicles = await window.hqStore.getVehicles();

    // Compute stats
    const totalCount = allSchedules.length;
    const doneCount = allSchedules.filter(s => s.status === '완료' || s.status === 'completed' || s.timeline?.every(t => t.done)).length;
    const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

    // 표준 카테고리 정규화 함수
    const normalizeCategory = (cat) => {
      if (!cat) return 'meeting';
      const c = String(cat).toLowerCase().trim();
      if (c === 'music_show' || c === '음악방송' || c.includes('음악')) return 'music_show';
      if (c === 'broadcast' || c === '예능' || c === '라디오' || c === '방송') return 'broadcast';
      if (c === 'shooting' || c === '화보' || c === '광고' || c === '촬영') return 'shooting';
      if (c === 'event' || c === '행사' || c === '공연' || c === '콘서트') return 'event';
      if (c === 'fansign' || c === '팬사인회' || c === '팬미팅' || c === '팬싸') return 'fansign';
      if (c === 'recording' || c === '녹음' || c === '레슨' || c === '연습') return 'recording';
      if (c === 'overseas' || c === '해외' || c === '투어' || c === '출국') return 'overseas';
      return 'meeting';
    };

    // Categories Breakdown (8대 표준 엔터 카테고리 - 라인 SVG 아이콘 탑재)
    const catMap = {
      music_show: { label: '음악방송 / 생방송', count: 0, color: '#6366f1', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>' },
      broadcast:  { label: '예능 / 라디오 / 인터뷰', count: 0, color: '#3b82f6', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>' },
      shooting:   { label: '화보 / 촬영 / 광고', count: 0, color: '#ec4899', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>' },
      event:      { label: '행사 / 콘서트 / 페스티벌', count: 0, color: '#f59e0b', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' },
      fansign:    { label: '팬미팅 / 팬사인회', count: 0, color: '#10b981', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>' },
      recording:  { label: '녹음 / 안무레슨 / 연습', count: 0, color: '#8b5cf6', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>' },
      overseas:   { label: '해외 투어 / 출국', count: 0, color: '#0ea5e9', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>' },
      meeting:    { label: '미팅 / 기획회의 / 기타', count: 0, color: '#64748b', icon: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>' }
    };

    allSchedules.forEach(s => {
      const catKey = normalizeCategory(s.category);
      if (catMap[catKey]) catMap[catKey].count++;
      else catMap.meeting.count++;
    });

    // Top locations
    const locCounts = {};
    allSchedules.forEach(s => {
      const loc = s.location || '기타 현장';
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });
    const topLocations = Object.entries(locCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Artist Stats
    const artistStats = artists.map(a => {
      const count = allSchedules.filter(s => s.artistId === a.id).length;
      return { ...a, count };
    }).sort((a, b) => b.count - a.count);

    let html = `
      <div class="analytics-dashboard-grid" style="padding: 24px; background: #0f172a; min-height: 100%; box-sizing: border-box;">
        
        <!-- Summary Cards Row -->
        <div class="analytics-cards-row">
          <div class="analytics-card">
            <div class="analytics-card-title">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                누적 총 스케줄
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div class="analytics-card-value">${totalCount}건</div>
            <div class="analytics-card-sub">완료 ${doneCount}건 (${completionRate}%)</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                활동 아티스트
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
            </div>
            <div class="analytics-card-value">${artists.length}팀</div>
            <div class="analytics-card-sub">최다 스케줄: ${artistStats[0]?.name || '없음'} (${artistStats[0]?.count || 0}건)</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2"><path d="M5 11l2-6h10l2 6"></path><rect x="3" y="11" width="18" height="8" rx="2"></rect><circle cx="7.5" cy="15.5" r="1.5"></circle><circle cx="16.5" cy="15.5" r="1.5"></circle></svg>
                운행 배차 차량
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M5 11l2-6h10l2 6"></path><rect x="3" y="11" width="18" height="8" rx="2"></rect><circle cx="7.5" cy="15.5" r="1.5"></circle><circle cx="16.5" cy="15.5" r="1.5"></circle></svg>
            </div>
            <div class="analytics-card-value">${vehicles.length}대</div>
            <div class="analytics-card-sub">평균 가동률 85% 이상</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                현장 지원 매니저
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
            </div>
            <div class="analytics-card-value">${managers.length}명</div>
            <div class="analytics-card-sub">전원 100% 배치 완료</div>
          </div>
        </div>

        <!-- 2 Column Section: Category Distribution & Artist Ranking -->
        <div class="analytics-two-col">
          
          <!-- Category Distribution -->
          <div class="analytics-section-card">
            <div class="analytics-section-header">
              <h4 style="display:flex; align-items:center; gap:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                카테고리별 활동 비율 분포
              </h4>
              <span style="font-size:12px; color:#94a3b8;">전체 ${totalCount}건 기준</span>
            </div>
            <div class="category-bar-group">
              ${Object.values(catMap).map(cat => {
      const pct = totalCount > 0 ? Math.round((cat.count / totalCount) * 100) : 0;
      return `
                  <div class="category-bar-item">
                    <div class="category-bar-label">
                      <span style="display:inline-flex; align-items:center; gap:6px; color:#e2e8f0;">
                        <span style="color:${cat.color}; display:inline-flex; align-items:center;">${cat.icon}</span>
                        <span>${cat.label}</span>
                      </span>
                      <span style="font-weight:700; color:#f8fafc;">${cat.count}건 (${pct}%)</span>
                    </div>
                    <div class="category-bar-track">
                      <div class="category-bar-fill" style="width:${pct}%; background:${cat.color};"></div>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>
          </div>

          <!-- Artist Performance Ranking -->
          <div class="analytics-section-card">
            <div class="analytics-section-header">
              <h4 style="display:flex; align-items:center; gap:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2.2"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
                소속 아티스트별 활동 수행 실적
              </h4>
              <span style="font-size:12px; color:#94a3b8;">월간 스케줄 건수</span>
            </div>
            <div class="category-bar-group">
              ${artistStats.map(a => {
      const pct = totalCount > 0 ? Math.round((a.count / totalCount) * 100) : 0;
      return `
                  <div class="category-bar-item">
                    <div class="category-bar-label">
                      <span style="display:inline-flex; align-items:center; gap:6px;">
                        <span style="width:22px; height:22px; border-radius:6px; background:${a.color || '#6366f1'}; color:#fff; display:inline-flex; align-items:center; justify-content:center;">
                          ${getArtistTypeIcon(a, 12)}
                        </span>
                        <strong style="color:#f8fafc;">${a.name}</strong>
                        <span style="font-size:11px; color:#94a3b8;">(${a.type})</span>
                      </span>
                      <span style="font-weight:700; color:#f8fafc;">${a.count}건 (${pct}%)</span>
                    </div>
                    <div class="category-bar-track">
                      <div class="category-bar-fill" style="width:${pct}%; background:${a.color || '#6366f1'};"></div>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>
          </div>

        </div>

        <!-- 2 Column Section: Top Destinations & Manager Support Breakdown -->
        <div class="analytics-two-col">
          
          <!-- Top Locations -->
          <div class="analytics-section-card">
            <div class="analytics-section-header">
              <h4 style="display:flex; align-items:center; gap:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                최다 출동 현장 거점 Top 5
              </h4>
              <span style="font-size:12px; color:#94a3b8;">방송국 및 메인 스튜디오</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${topLocations.map(([locName, count], rank) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:10px 14px; border-radius:8px; border:1px solid #334155;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span style="background:${rank === 0 ? '#f59e0b' : rank === 1 ? '#94a3b8' : '#64748b'}; color:#fff; font-size:11px; font-weight:800; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;">${rank + 1}</span>
                    <span style="font-size:13px; font-weight:700; color:#f8fafc;">${locName}</span>
                  </div>
                  <span style="font-size:12px; font-weight:800; color:#38bdf8;">${count}회 방문</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Manager Support Breakdown -->
          <div class="analytics-section-card">
            <div class="analytics-section-header">
              <h4 style="display:flex; align-items:center; gap:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                담당 매니저별 현장 지원 현황
              </h4>
              <button type="button" onclick="Admin.exportExcel()" style="background:#10b981; color:#fff; border:none; padding:5px 12px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                엑셀 다운로드
              </button>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${managers.map(m => {
      const mScheds = allSchedules.filter(s => s.managerId === m.id || s.managerName === m.name);
      const mDone = mScheds.filter(s => s.status === '완료' || s.status === 'completed' || s.timeline?.every(t => t.done)).length;
      return `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:10px 14px; border-radius:8px; border:1px solid #334155; font-size:12px;">
                    <div>
                      <strong style="color:#fff; font-size:13px;">${m.name}</strong>
                      <span style="color:#94a3b8; margin-left:6px;">(${m.phone || '로드 매니저'})</span>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                      <span style="color:#a5b4fc; font-weight:700;">총 ${mScheds.length}건 수행</span>
                      <span style="color:#34d399; font-weight:800; background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:10px;">완수율 ${mScheds.length > 0 ? Math.round((mDone / mScheds.length) * 100) : 100}%</span>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>
          </div>

        </div>

      </div>
    `;

    el.scheduleViewport.innerHTML = html;
  }

  // ── 스케줄 상세 모달 열기 ──
  async function openScheduleDetailModal(schId) {
    const schedules = await window.hqStore.getSchedules();
    const sch = schedules.find(s => s.id === schId);
    if (!sch) return;

    state.activeScheduleId = schId;
    const artists = await window.hqStore.getArtists();
    const art = artists.find(a => a.id === sch.artistId);

    // 중복 배차 충돌 검사
    const conflictResult = window.hqStore.checkConflict ? window.hqStore.checkConflict(sch) : { hasConflict: false };

    let html = `
      ${conflictResult.hasConflict ? `
        <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); border-radius:8px; padding:12px; margin-bottom:16px;">
          <div style="font-size:13px; font-weight:800; color:#f87171; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span>⚠️ 배차/일정 중복 충돌 감지</span>
          </div>
          <div style="font-size:12px; color:#fca5a5; line-height:1.4;">
            ${conflictResult.conflicts.map(c => `
              <div>• <strong>[${c.type === 'vehicle' ? '차량: ' + c.vehicleName : '매니저: ' + c.managerName}]</strong> 동일 시간대(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'에 중복 배정됨</div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:14px; margin-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span style="background:${art ? art.color : '#6366f1'}; color:#fff; font-size:12px; padding:3px 10px; border-radius:6px; font-weight:700; display:inline-block;">
              ${sch.artistName || '아티스트'}
            </span>
            ${(sch.targetMembers && sch.targetMembers !== 'ALL' && Array.isArray(sch.targetMembers)) ? `
              <span style="background:#fdf2f8; color:#db2777; border:1px solid #fbcfe8; font-size:11.5px; padding:2px 8px; border-radius:6px; font-weight:800; display:inline-flex; align-items:center; gap:3px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                참여 멤버: ${sch.targetMembers.join(', ')}
              </span>
            ` : `
              <span style="background:#f1f5f9; color:#475569; border:1px solid #e2e8f0; font-size:11px; padding:2px 7px; border-radius:6px; font-weight:700;">
                완전체(전원)
              </span>
            `}
          </div>
          <h2 style="font-size:20px; color:#0f172a; font-weight:800; margin:8px 0 4px 0;">${sch.title || '스케줄명 없음'}</h2>
          <div style="font-size:13px; color:#64748b; font-weight:600;">📅 ${sch.date} (${sch.startTime} ~ ${sch.endTime})</div>
        </div>
        ${getStatusBadge(sch.status)}
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px; font-size:13px;">
        <div style="background:#e2e8f0; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; display:flex; flex-direction:column; gap:4px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <div style="display:flex; align-items:center; gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span style="color:#475569; font-weight:600;">메인 장소:</span> <strong style="color:#0f172a;">${sch.location || '미정'}</strong>
          </div>
          ${sch.locationAddress ? `
            <div style="font-size:11px; color:#64748b; padding-left:23px; word-break:break-all;">
              📍 ${sch.locationAddress}
            </div>
          ` : ''}
        </div>
        <div style="background:#e2e8f0; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; display:flex; align-items:center; gap:8px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
          <span style="color:#475569; font-weight:600;">담당 매니저:</span> <strong style="color:#0f172a;">${sch.managerName || '미배정'}</strong>
        </div>
        <div style="background:#e2e8f0; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; display:flex; align-items:center; gap:8px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l2-6h10l2 6"></path><rect x="3" y="11" width="18" height="8" rx="2"></rect><circle cx="7.5" cy="15.5" r="1.5"></circle><circle cx="16.5" cy="15.5" r="1.5"></circle></svg>
          <span style="color:#475569; font-weight:600;">배차 차량:</span> <strong style="color:#0f172a;">${sch.vehicleName || '미배정'}</strong>
        </div>
        <div style="background:#e2e8f0; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; display:flex; align-items:center; gap:8px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 4 6 6-9 9H5v-6l9-9z"></path><path d="M18 8l-2-2"></path></svg>
          <span style="color:#475569; font-weight:600;">헤메 샵:</span> <strong style="color:#0f172a;">${sch.shopLocation || (sch.shop?.name) || '미경유'}</strong>
        </div>
        ${sch.departure?.place || sch.departurePlace ? `
          <div style="background:#e2e8f0; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; display:flex; align-items:center; gap:8px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            <span style="color:#475569; font-weight:600;">출발 장소:</span> <strong style="color:#0f172a;">${sch.departure?.place || sch.departurePlace}</strong>
          </div>
        ` : ''}
        ${sch.outfit ? `
          <div style="background:#e2e8f0; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; display:flex; align-items:center; gap:8px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"></path></svg>
            <span style="color:#475569; font-weight:600;">의상 컨셉:</span> <strong style="color:#0f172a;">${sch.outfit}</strong>
          </div>
        ` : ''}
        ${(sch.contactName || sch.contactPhone) ? `
          <div style="background:#e2e8f0; padding:10px 12px; border-radius:8px; border:1px solid #cbd5e1; grid-column: span 2; display:flex; align-items:center; gap:8px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span style="color:#475569; font-weight:600;">현장 연락처:</span> <strong style="color:#0f172a;">${sch.contactName || ''} ${sch.contactPhone ? `(${sch.contactPhone})` : ''}</strong>
          </div>
        ` : ''}
        ${sch.isSecret ? `
          <div style="background:#fff1f2; border:1px solid #fecdd3; padding:8px 10px; border-radius:6px; grid-column: span 2; display:flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span style="color:#e11d48; font-weight:700;">대외비 (비공개 스케줄)</span>
          </div>
        ` : ''}
      </div>

      ${sch.notes ? `
        <div style="background:#e2e8f0; padding:12px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:16px;">
          <div style="font-size:12px; color:#475569; margin-bottom:4px; display:flex; align-items:center; gap:6px; font-weight:700;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            현장 특이사항 / 메모
          </div>
          <div style="font-size:13px; color:#0f172a; line-height:1.5;">${sch.notes}</div>
        </div>
      ` : ''}

      <div style="margin-top:16px;">
        <h4 style="font-size:14px; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:6px; font-weight:800;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          스마트 역산 타임라인
        </h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;">
          ${(sch.timeline || []).map(item => {
            let rawLabel = (item.label || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim();
            let tag = '';
            let restText = rawLabel;
            let badgeBg = '#f1f5f9';
            let badgeColor = '#475569';
            let iconSvg = '';

            const lower = rawLabel.toLowerCase();
            let badgeBorder = '#e2e8f0';
            if (lower.includes('헤어') || lower.includes('메이크업') || lower.includes('도착 및 스타일링') || lower.includes('헤메')) {
              tag = '헤어·메이크업';
              badgeBg = '#fdf2f8';
              badgeColor = '#db2777';
              badgeBorder = '#fbcfe8';
              iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg>';
              restText = restText.replace(/^\[?헤어[\/·]메이크업\]?\s*/, '');
            } else if (lower.includes('픽업') || lower.includes('픽업 및 출발')) {
              tag = '픽업 출발';
              badgeBg = '#eff6ff';
              badgeColor = '#2563eb';
              badgeBorder = '#bfdbfe';
              iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>';
              restText = restText.replace(/^\[?픽업 출발\]?\s*/, '');
            } else if (lower.includes('이동') || lower.includes('출발')) {
              tag = '현장 이동';
              badgeBg = '#ecfeff';
              badgeColor = '#0891b2';
              badgeBorder = '#a5f3fc';
              iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>';
              restText = restText.replace(/^\[?현장 이동\]?\s*/, '');
            } else if (lower.includes('철수') || lower.includes('복귀') || lower.includes('종료')) {
              tag = '현장 철수';
              badgeBg = '#ecfdf5';
              badgeColor = '#059669';
              badgeBorder = '#a7f3d0';
              iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>';
              restText = restText.replace(/^\[?현장 철수\]?\s*/, '');
            } else if (lower.includes('메인') || lower.includes('방송') || lower.includes('촬영') || lower.includes('공연')) {
              tag = '메인 일정';
              badgeBg = '#eef2ff';
              badgeColor = '#4f46e5';
              badgeBorder = '#c7d2fe';
              iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15 10 9"/></svg>';
              restText = restText.replace(/^\[?메인 일정\]?\s*/, '');
            } else {
              tag = '일정';
              badgeBg = '#f1f5f9';
              badgeColor = '#475569';
              badgeBorder = '#e2e8f0';
              iconSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/></svg>';
            }

            return `
              <div style="display:flex; gap:10px; align-items:center; background:#e2e8f0; padding:9px 12px; border-radius:8px; font-size:13px; border:1px solid #cbd5e1; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                <span style="color:#2563eb; font-weight:800; font-family:monospace; min-width:44px;">${item.time}</span>
                <span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:800; background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; flex-shrink:0;">
                  ${iconSvg}
                  <span>${tag}</span>
                </span>
                <span style="color:${item.done ? '#94a3b8' : '#0f172a'}; text-decoration:${item.done ? 'line-through' : 'none'}; font-weight:600; flex:1;">${restText}</span>
                ${item.done ? `
                  <span style="margin-left:auto; font-size:11px; color:#059669; font-weight:700; display:inline-flex; align-items:center; gap:3px; background:#ecfdf5; padding:2px 6px; border-radius:4px; border:1px solid #a7f3d0;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    완료 ${item.doneAt ? `<span style="font-size:10px; opacity:0.8;">(${item.doneAt})</span>` : ''}
                  </span>
                ` : (item.moving ? `
                  <span style="margin-left:auto; font-size:11px; color:#d97706; font-weight:700; display:inline-flex; align-items:center; gap:4px; background:#fffbeb; padding:2px 6px; border-radius:4px; border:1px solid #fde68a;">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/></svg>
                    이동중
                  </span>
                ` : '')}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${sch.statusLogs && sch.statusLogs.length > 0 ? `
        <div style="margin-top:16px; border-top:1px solid #cbd5e1; padding-top:14px;">
          <h4 style="font-size:14px; color:#0f172a; margin-bottom:8px; display:flex; align-items:center; gap:6px; font-weight:800;">
            <span>⏱️ 현장 실시간 타임스탬프 이력</span>
            <span style="font-size:11px; color:#64748b; font-weight:normal;">(총 ${sch.statusLogs.length}회 기록)</span>
          </h4>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:140px; overflow-y:auto;">
            ${sch.statusLogs.map(log => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:#e2e8f0; padding:6px 10px; border-radius:6px; font-size:12px; border:1px solid #cbd5e1; border-left:3px solid #6366f1;">
                <div style="color:#0f172a; font-weight:600;">
                  ${log.label}
                </div>
                <div style="font-size:11px; color:#64748b; font-family:monospace;">
                  ${log.time} (${log.managerName || '현장매니저'})
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    if (el.detailBodyContent) el.detailBodyContent.innerHTML = html;
    if (el.modalScheduleDetail) el.modalScheduleDetail.classList.add('active');
  }

  // 🌟 전역 바인딩 (팝오버 및 외부 클릭 연동)
  window.openScheduleDetailModal = openScheduleDetailModal;
  if (window.Admin) {
    window.Admin.openScheduleDetailModal = openScheduleDetailModal;
  }

  // ── 스케줄 등록/수정 모달 열기 ──
  function openScheduleFormModal(dateStr = null, editSch = null) {
    el.formSchedule.reset();
    if (window.Admin && window.Admin.updatePlaceDatalists) {
      window.Admin.updatePlaceDatalists();
    }
    
    // 샵 토글 및 샵 검색 자동완성 이벤트
    if (el.formShopNeeded && el.shopFields) {
      el.formShopNeeded.onchange = () => {
        el.shopFields.style.display = el.formShopNeeded.checked ? 'flex' : 'none';
      };
    }

    if (el.formShopName && el.formShopAddress) {
      const shopDropdown = document.getElementById('shop-search-results');
      
      const renderPresetShops = (query = '') => {
        if (!shopDropdown) return;
        const places = window.Admin ? window.Admin.getPlaces() : [];
        const shops = places.filter(p => p.type === 'shop');
        const filtered = query ? shops.filter(s => s.name.includes(query) || (s.address && s.address.includes(query))) : shops;

        if (filtered.length === 0) {
          shopDropdown.innerHTML = '<div style="padding:10px; text-align:center; color:#64748b; font-size:12px;">등록된 추천 샵이 없습니다. [샵 검색] 버튼으로 검색해보세요.</div>';
        } else {
          shopDropdown.innerHTML = `
            <div style="padding:4px 8px; font-size:11px; color:#94a3b8; font-weight:700; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between;">
              <span>⭐ 등록된 헤메샵 목록</span>
              <span>[샵 검색]으로 추가 검색 가능</span>
            </div>
          ` + filtered.map(s => `
            <div class="shop-item-choice" style="padding:8px 10px; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:8px; border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
              <div style="flex:1; min-width:0;">
                <div style="font-weight:700; color:#0f172a; font-size:13px; display:flex; align-items:center; gap:6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg>
                  <span>${s.name}</span>
                </div>
                <div style="font-size:11px; color:#64748b; margin-top:2px;">${s.address || ''}</div>
              </div>
              <button type="button" style="padding:4px 8px; font-size:11px; background:#fdf2f8; color:#db2777; border:1px solid #fbcfe8; border-radius:4px; font-weight:700; cursor:pointer; flex-shrink:0;">선택</button>
            </div>
          `).join('');

          shopDropdown.querySelectorAll('.shop-item-choice').forEach((row, idx) => {
            row.addEventListener('click', () => {
              const selected = filtered[idx];
              if (selected) {
                el.formShopName.value = selected.name;
                el.formShopAddress.value = selected.address || '';
              }
              shopDropdown.style.display = 'none';
            });
          });
        }
        shopDropdown.style.display = 'block';
      };

      const doShopSearch = async () => {
        const query = el.formShopName.value.trim();
        if (!query) {
          renderPresetShops();
          return;
        }

        if (!shopDropdown) return;
        shopDropdown.style.display = 'block';
        shopDropdown.innerHTML = `
          <div style="padding:12px; text-align:center; color:#64748b; font-size:12px; display:flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span>카카오 & 티맵 샵 검색 중...</span>
          </div>
        `;

        let results = [];
        try {
          if (typeof KakaoAPI !== 'undefined' && KakaoAPI.searchPlace) {
            const kakaoRes = await KakaoAPI.searchPlace(query);
            if (kakaoRes && kakaoRes.length > 0) {
              results = kakaoRes.map(item => ({
                id: item.id || item.place_name,
                name: item.place_name,
                address: item.road_address_name || item.address_name || item.address || '',
                provider: '카카오'
              }));
            }
          }

          if (results.length === 0 && typeof TmapAPI !== 'undefined' && TmapAPI.searchPlace) {
            const tmapRes = await TmapAPI.searchPlace(query);
            if (tmapRes && tmapRes.length > 0) {
              results = tmapRes.map(item => ({
                id: item.id || item.place_name,
                name: item.place_name,
                address: item.address_name || '',
                provider: '티맵'
              }));
            }
          }
        } catch (err) {
          console.error('샵 검색 중 오류:', err);
        }

        if (results.length === 0) {
          shopDropdown.innerHTML = `
            <div style="padding:14px; text-align:center; color:#64748b; font-size:12px;">
              <div style="color:#ef4444; font-weight:600; margin-bottom:4px;">'${query}' 검색 결과가 없습니다.</div>
              <div>직접 주소를 입력하거나 다른 키워드로 검색해주세요.</div>
            </div>
          `;
          return;
        }

        shopDropdown.innerHTML = `
          <div style="padding:4px 8px; font-size:11px; color:#94a3b8; font-weight:700; border-bottom:1px solid #f1f5f9;">
            <span>🔍 카카오·티맵 검색 결과 (${results.length}건)</span>
          </div>
        ` + results.map(item => `
          <div class="shop-search-item" style="padding:8px 10px; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:8px; border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
            <div style="flex:1; min-width:0;">
              <div style="font-weight:700; color:#0f172a; font-size:13px; display:flex; align-items:center; gap:6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg>
                <span>${item.name}</span>
                <span style="font-size:10px; background:#fdf2f8; color:#db2777; border:1px solid #fbcfe8; padding:1px 5px; border-radius:4px; font-weight:700;">${item.provider}</span>
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">${item.address || '주소 정보 없음'}</div>
            </div>
            <button type="button" style="padding:4px 8px; font-size:11px; background:#fdf2f8; color:#db2777; border:1px solid #fbcfe8; border-radius:4px; font-weight:700; cursor:pointer; flex-shrink:0;">선택</button>
          </div>
        `).join('');

        shopDropdown.querySelectorAll('.shop-search-item').forEach((row, idx) => {
          row.addEventListener('click', () => {
            const selected = results[idx];
            if (selected) {
              el.formShopName.value = selected.name;
              if (el.formShopAddress) el.formShopAddress.value = selected.address;
            }
            shopDropdown.style.display = 'none';
          });
        });
      };

      el.formShopName.addEventListener('focus', () => {
        if (!el.formShopName.value.trim()) {
          renderPresetShops();
        }
      });

      el.formShopName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doShopSearch();
        }
      });

      const btnSearchShop = document.getElementById('btn-search-shop') || el.btnSearchShop;
      if (btnSearchShop) {
        btnSearchShop.addEventListener('click', doShopSearch);
      }

      document.addEventListener('click', (e) => {
        const btnShop = document.getElementById('btn-search-shop');
        if (shopDropdown && !el.formShopName.contains(e.target) && (!btnShop || !btnShop.contains(e.target)) && !shopDropdown.contains(e.target)) {
          shopDropdown.style.display = 'none';
        }
      });
    }

    // 출발지(숙소/거점) 선택 시 상세 주소 스마트 자동완성 이벤트
    if (el.formDeparturePlace && el.formDepartureAddress) {
      const departureDropdown = document.getElementById('departure-search-results');

      const renderDepartureDropdown = (query = '') => {
        if (!departureDropdown) return;
        const places = window.Admin ? window.Admin.getPlaces() : [];
        const filtered = query ? places.filter(p => p.name.includes(query) || (p.address && p.address.includes(query))) : places;

        if (filtered.length === 0) {
          departureDropdown.innerHTML = '<div style="padding:10px; text-align:center; color:#64748b; font-size:12px;">등록된 거점이 없습니다. 직접 입력해주세요.</div>';
        } else {
          departureDropdown.innerHTML = filtered.map(p => {
            let iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
            if (p.type === 'dorm') {
              iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
            } else if (p.type === 'office') {
              iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="8" y1="6" x2="8" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="16" y1="18" x2="16" y2="18.01"/></svg>';
            } else if (p.type === 'shop') {
              iconSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ec4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg>';
            }

            return `
              <div class="dept-item-choice" style="padding:8px 10px; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:8px; border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:700; color:#0f172a; font-size:13px; display:flex; align-items:center; gap:6px;">
                    ${iconSvg}
                    <span>${p.name}</span>
                  </div>
                  <div style="font-size:11px; color:#64748b; margin-top:2px;">${p.address || ''}</div>
                </div>
                <button type="button" style="padding:4px 8px; font-size:11px; background:#ecfeff; color:#0891b2; border:1px solid #a5f3fc; border-radius:4px; font-weight:700; cursor:pointer; flex-shrink:0;">선택</button>
              </div>
            `;
          }).join('');

          departureDropdown.querySelectorAll('.dept-item-choice').forEach((row, idx) => {
            row.addEventListener('click', () => {
              const selected = filtered[idx];
              if (selected) {
                el.formDeparturePlace.value = selected.name;
                el.formDepartureAddress.value = selected.address || '';
              }
              departureDropdown.style.display = 'none';
            });
          });
        }
        departureDropdown.style.display = 'block';
      };

      el.formDeparturePlace.addEventListener('focus', () => renderDepartureDropdown(el.formDeparturePlace.value.trim()));
      el.formDeparturePlace.addEventListener('input', () => renderDepartureDropdown(el.formDeparturePlace.value.trim()));

      const handleDepartureSelect = () => {
        const val = el.formDeparturePlace.value.trim();
        if (!val) return;
        const places = window.Admin ? window.Admin.getPlaces() : [];
        const matched = places.find(p => p.name.toLowerCase() === val.toLowerCase()) ||
                        places.find(p => (p.type === 'dorm' || p.type === 'office') && (p.name.includes(val) || val.includes(p.name))) ||
                        places.find(p => p.name.includes(val) || val.includes(p.name));
        if (matched && matched.address) {
          el.formDepartureAddress.value = matched.address;
        }
      };
      el.formDeparturePlace.onchange = handleDepartureSelect;

      document.addEventListener('click', (e) => {
        if (departureDropdown && !el.formDeparturePlace.contains(e.target) && !departureDropdown.contains(e.target)) {
          departureDropdown.style.display = 'none';
        }
      });
    }

    if (editSch) {
      el.scheduleFormTitle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> 스케줄 정보 수정`;
      el.formSchId.value = editSch.id;
      el.formTitle.value = editSch.title || '';
      if (el.formArtist) el.formArtist.value = editSch.artistId || '';
      const normCat = (c) => {
        if (!c) return 'music_show';
        const str = String(c).toLowerCase().trim();
        if (str === 'music_show' || str === '음악방송' || str.includes('음악')) return 'music_show';
        if (str === 'broadcast' || str === '예능' || str === '라디오' || str === '방송') return 'broadcast';
        if (str === 'shooting' || str === '화보' || str === '광고' || str === '촬영') return 'shooting';
        if (str === 'event' || str === '행사' || str === '공연' || str === '콘서트') return 'event';
        if (str === 'fansign' || str === '팬사인회' || str === '팬미팅' || str === '팬싸') return 'fansign';
        if (str === 'recording' || str === '녹음' || str === '레슨' || str === '연습') return 'recording';
        if (str === 'overseas' || str === '해외' || str === '투어' || str === '출국') return 'overseas';
        return 'meeting';
      };
      el.formCategory.value = normCat(editSch.category);
      el.formDate.value = editSch.date || '';
      
      // 스케줄 일자 및 시간 분리 설정
      const curDate = editSch.date || fmtDate(state.currentDate);
      el.formDate.value = curDate;

      let startHm = '10:00';
      if (editSch.startTime) {
        startHm = editSch.startTime.includes('T') ? editSch.startTime.split('T')[1].slice(0, 5) : editSch.startTime.slice(0, 5);
      }
      let endHm = '18:00';
      if (editSch.endTime) {
        endHm = editSch.endTime.includes('T') ? editSch.endTime.split('T')[1].slice(0, 5) : editSch.endTime.slice(0, 5);
      }
      el.formStartTime.value = startHm;
      el.formEndTime.value = endHm;

      // 휠 롤러 피커 디스플레이 텍스트 갱신
      updateDisplayDateTimeTexts();
      
      // 메인 행사장 소요 시간 계산
      if (el.formEventDuration) {
        if (editSch.durationMin) {
          el.formEventDuration.value = editSch.durationMin;
        } else {
          const s = new Date(`${curDate}T${startHm}`);
          const e = new Date(`${curDate}T${endHm}`);
          const diffMin = Math.round((e - s) / (1000 * 60));
          el.formEventDuration.value = (!isNaN(diffMin) && diffMin > 0) ? diffMin : 480;
        }
      }

      el.formLocation.value = editSch.location || '';
      if (el.formLocationAddress) {
        el.formLocationAddress.value = editSch.locationAddress || editSch.address || '';
      }
      if (el.formLocationLat) el.formLocationLat.value = editSch.lat || editSch.locationLat || '';
      if (el.formLocationLng) el.formLocationLng.value = editSch.lng || editSch.locationLng || '';
      if (el.locationSearchResults) el.locationSearchResults.style.display = 'none';

      el.formManager.value = editSch.managerId || '';
      el.formVehicle.value = editSch.vehicleId || '';
      el.formDeparturePlace.value = editSch.departure?.place || editSch.departurePlace || '';
      if (el.formDepartureAddress) {
        el.formDepartureAddress.value = editSch.departure?.address || editSch.departureAddress || '';
      }
      
      // 샵 정보
      const hasShop = !!(editSch.shop?.needed || editSch.shopLocation || editSch.shopName);
      if (el.formShopNeeded) el.formShopNeeded.checked = hasShop;
      if (el.shopFields) el.shopFields.style.display = hasShop ? 'flex' : 'none';
      if (el.formShopName) el.formShopName.value = editSch.shop?.name || editSch.shopName || '';
      if (el.formShopDuration) el.formShopDuration.value = editSch.shop?.durationMin || 90;
      if (el.formShopAddress) el.formShopAddress.value = editSch.shop?.address || editSch.shopAddress || editSch.shopLocation || '';

      // 의상 / 연락처 / 메모
      if (el.formOutfit) el.formOutfit.value = editSch.outfit || '';
      if (el.formContactName) el.formContactName.value = editSch.contactName || editSch.contact?.name || '';
      if (el.formContactPhone) el.formContactPhone.value = editSch.contactPhone || editSch.contact?.phone || '';
      if (el.formNotes) el.formNotes.value = editSch.notes || '';

      // 상태 / 보안
      if (el.formStatus) el.formStatus.value = editSch.status || '확정';
      if (el.formIsSecret) el.formIsSecret.checked = editSch.isSecret || false;

      // 👥 소속 멤버 참여 선택기 렌더링 (수정 모드)
      if (window.Admin && window.Admin.renderScheduleMemberSelector) {
        window.Admin.renderScheduleMemberSelector(editSch.artistId, editSch.targetMembers || 'ALL');
      }
    } else {
      el.scheduleFormTitle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> 신규 스케줄 등록`;
      el.formSchId.value = '';
      const baseDate = dateStr || fmtDate(state.currentDate);
      el.formDate.value = baseDate;
      el.formStartTime.value = '10:00';
      el.formEndTime.value = '18:00';

      updateDisplayDateTimeTexts();
      
      if (el.formEventDuration) {
        el.formEventDuration.value = 480;
      }

      if (el.formShopNeeded) el.formShopNeeded.checked = false;
      if (el.shopFields) el.shopFields.style.display = 'none';
      if (el.formShopDuration) el.formShopDuration.value = 90;
      
      if (el.formLocationAddress) el.formLocationAddress.value = '';
      if (el.formLocationLat) el.formLocationLat.value = '';
      if (el.formLocationLng) el.formLocationLng.value = '';
      if (el.locationSearchResults) el.locationSearchResults.style.display = 'none';

      if (el.formStatus) el.formStatus.value = '확정';
      if (el.formIsSecret) el.formIsSecret.checked = false;

      // 👥 소속 멤버 참여 선택기 렌더링 (신규 등록 모드 - 기본 전체)
      if (window.Admin && window.Admin.renderScheduleMemberSelector && el.formArtist) {
        window.Admin.renderScheduleMemberSelector(el.formArtist.value, 'ALL');
      }
    }

    // 아티스트 선택 변경 시 멤버 목록 즉시 갱신
    if (el.formArtist) {
      el.formArtist.onchange = () => {
        if (window.Admin && window.Admin.renderScheduleMemberSelector) {
          window.Admin.renderScheduleMemberSelector(el.formArtist.value, 'ALL');
        }
      };
    }

    el.modalScheduleForm.classList.add('active');
  }

  // ── 이벤트 리스너 설정 ──
  function setupEventListeners() {
    // 메시지 발송 폼 제출
    const formSendMsg = document.getElementById('form-send-message');
    if (formSendMsg) {
      formSendMsg.addEventListener('submit', (e) => {
        e.preventDefault();
        const targetId = document.getElementById('msg-target-manager').value;
        const targetName = document.getElementById('msg-target-manager').options[document.getElementById('msg-target-manager').selectedIndex].text;
        const content = document.getElementById('msg-content').value;
        const isUrgent = document.getElementById('msg-is-urgent').checked;

        const notiData = {
          id: 'noti_' + Date.now(),
          targetId: targetId,
          content: content,
          isUrgent: isUrgent,
          createdAt: new Date().toISOString()
        };

        // LocalStorage 저장
        const hqNotiKey = 'HQ_NOTIFICATIONS_V2';
        let notis = JSON.parse(localStorage.getItem(hqNotiKey) || '[]');
        notis.push(notiData);
        localStorage.setItem(hqNotiKey, JSON.stringify(notis));

        // 브로드캐스트 전송
        if (window.hqStore && window.hqStore.broadcast) {
          window.hqStore.broadcast.postMessage({
            type: 'NEW_HQ_MESSAGE',
            payload: notiData
          });
        }

        alert(`[${targetName}]에게 메시지를 발송했습니다.`);
        Admin.closeSendMsgModal();
      });
    }

    // 뷰 전환 탭
    el.viewTabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        el.viewTabs.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.currentView = e.target.dataset.view;
        renderCurrentView();
      });
    });

    // 날짜 이전/다음/오늘
    el.btnPrev.addEventListener('click', () => {
      if (state.currentView === 'month') {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
      } else if (state.currentView === 'week') {
        state.currentDate.setDate(state.currentDate.getDate() - 7);
      } else {
        state.currentDate.setDate(state.currentDate.getDate() - 1);
      }
      renderCurrentView();
    });

    el.btnNext.addEventListener('click', () => {
      if (state.currentView === 'month') {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
      } else if (state.currentView === 'week') {
        state.currentDate.setDate(state.currentDate.getDate() + 7);
      } else {
        state.currentDate.setDate(state.currentDate.getDate() + 1);
      }
      renderCurrentView();
    });

    el.btnToday.addEventListener('click', () => {
      state.currentDate = new Date();
      renderCurrentView();
    });

    // 사이드바 아티스트 필터 클릭 위임
    el.artistFilterList.addEventListener('click', (e) => {
      const chip = e.target.closest('.artist-chip');
      if (chip && chip.dataset.artistId) {
        state.selectedArtistFilter = chip.dataset.artistId;
        renderSidebar();
        renderCurrentView();
      }
    });

    // ── 🌟 마우스 호버 시 상세 일정 팝오버 카드 표시 (인터랙티브 클릭 지원) ──
    const popover = document.getElementById('hover-schedule-popover');
    let hoverDate = null;
    let hideTimer = null;

    function cancelHide() {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
    }

    function scheduleHide(delay = 250) {
      cancelHide();
      hideTimer = setTimeout(() => {
        if (popover) {
          popover.style.opacity = '0';
          setTimeout(() => {
            if (hideTimer === null || popover.style.opacity === '0') {
              popover.style.display = 'none';
              hoverDate = null;
            }
          }, 150);
        }
      }, delay);
    }

    if (popover) {
      popover.addEventListener('mouseenter', () => {
        cancelHide();
        popover.style.display = 'block';
        popover.style.opacity = '1';
      });

      popover.addEventListener('mouseleave', () => {
        scheduleHide(150);
      });
    }

    el.scheduleViewport.addEventListener('mouseover', (e) => {
      const cell = e.target.closest('.cal-cell');
      if (!cell || !cell.dataset.date || cell.classList.contains('cal-empty-slot')) {
        scheduleHide(200);
        return;
      }

      cancelHide();
      const dateStr = cell.dataset.date;
      const allSchedules = window.hqStore.getSchedules();
      let daySchedules = allSchedules.filter(s => s.date === dateStr);
      if (state.selectedArtistFilter !== 'ALL') {
        daySchedules = daySchedules.filter(s => s.artistId === state.selectedArtistFilter);
      }

      if (daySchedules.length === 0) {
        scheduleHide(100);
        return;
      }

      if (hoverDate !== dateStr) {
        hoverDate = dateStr;
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
        const dayName = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

        let popHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:8px; margin-bottom:10px;">
            <div style="font-size:14px; font-weight:800; color:#0f172a; display:flex; align-items:center; gap:6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${y}년 ${Number(m)}월 ${Number(d)}일 (${dayName})
            </div>
            <span style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px;">
              총 ${daySchedules.length}건
            </span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto; padding-right:4px;">
        `;

        daySchedules.forEach(sch => {
          const art = window.hqStore.getArtists().find(a => a.id === sch.artistId);
          const artColor = art ? art.color : '#4f46e5';
          popHtml += `
            <div onclick="Admin.openScheduleDetail('${sch.id}')" 
              style="background:#e2e8f0; border-radius:8px; padding:10px 12px; border:1px solid #cbd5e1; border-left:4px solid ${artColor}; cursor:pointer; transition:all 0.15s ease;"
              onmouseover="this.style.background='#cbd5e1'; this.style.borderColor='#94a3b8'; this.style.transform='translateY(-1px)';"
              onmouseout="this.style.background='#e2e8f0'; this.style.borderColor='#cbd5e1'; this.style.transform='none';">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span style="font-size:11.5px; font-weight:800; color:#2563eb; font-family:monospace; display:flex; align-items:center; gap:4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  ${sch.startTime} ~ ${sch.endTime}
                </span>
                <span style="font-size:10.5px; padding:2px 6px; border-radius:4px; font-weight:700; ${sch.status === '진행중' || sch.status === '이동중' ? 'background:#10b981; color:#fff;' : 'background:#ffffff; color:#475569; border:1px solid #cbd5e1;'}">
                  ${sch.status || '예정'}
                </span>
              </div>
              <div style="font-size:13px; font-weight:800; color:#0f172a; margin-bottom:6px; display:flex; align-items:flex-start; gap:6px;">
                <span style="background:${artColor}; color:#fff; font-size:10.5px; padding:2px 7px; border-radius:4px; font-weight:700; white-space:nowrap; flex-shrink:0; line-height:1.3;">${sch.artistName || '아티스트'}</span>
                <span style="line-height:1.4; word-break:keep-all; flex:1; min-width:0;">${sch.title}</span>
              </div>
              <div style="font-size:11.5px; color:#475569; display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; align-items:center; gap:5px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span style="color:#334155; font-weight:500; word-break:keep-all;">${sch.location || '장소 미지정'}</span>
                </div>
                <div style="display:flex; align-items:center; gap:14px; margin-top:2px; flex-wrap:wrap;">
                  <span style="display:inline-flex; align-items:center; gap:4px; color:#475569; white-space:nowrap; font-weight:600;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    ${sch.managerName || '미배정'}
                  </span>
                  <span style="display:inline-flex; align-items:center; gap:4px; color:#475569; white-space:nowrap; font-weight:500;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M5 11l2-6h10l2 6"></path><rect x="3" y="11" width="18" height="8" rx="2"></rect><circle cx="7.5" cy="15.5" r="1.5"></circle><circle cx="16.5" cy="15.5" r="1.5"></circle></svg>
                    ${sch.vehicleName || '차량 미지정'}
                  </span>
                </div>
              </div>
            </div>
          `;
        });

        popHtml += `</div>
          <div style="font-size:11px; color:#64748b; text-align:center; margin-top:10px; background:#f8fafc; padding:8px; border-radius:8px; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; gap:5px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>일정을 클릭하시면 <strong>상세 정보 및 역산 동선</strong>이 열립니다.</span>
          </div>
        `;

        popover.innerHTML = popHtml;

        // 🌟 날짜 셀 기준으로 팝오버 위치를 완벽하게 고정 (마우스 따라 도망가지 않음!)
        const rect = cell.getBoundingClientRect();
        const popW = 340;
        const popH = 260;

        let left = rect.right + 10;
        let top = rect.top;

        // 화면 우측으로 넘치면 셀의 왼쪽에 배치
        if (left + popW > window.innerWidth - 10) {
          left = rect.left - popW - 10;
        }
        // 화면 아래로 넘치면 위로 당김
        if (top + popH > window.innerHeight - 10) {
          top = window.innerHeight - popH - 20;
        }
        if (top < 10) top = 10;
        if (left < 10) left = 10;

        popover.style.left = `${left}px`;
        popover.style.top = `${top}px`;
        popover.style.display = 'block';
        popover.style.opacity = '1';
      }
    });

    el.scheduleViewport.addEventListener('mouseleave', () => {
      scheduleHide(300);
    });

    // 스케줄 클릭 위임
    el.scheduleViewport.addEventListener('click', (e) => {
      if (popover) { popover.style.display = 'none'; popover.style.opacity = '0'; }
      const pill = e.target.closest('.cal-event-pill');
      if (pill && pill.dataset.schId) {
        openScheduleDetailModal(pill.dataset.schId);
        return;
      }
      const cell = e.target.closest('.cal-cell');
      if (cell && cell.dataset.date && !cell.classList.contains('cal-empty-slot')) {
        openScheduleFormModal(cell.dataset.date);
      }
    });

    // 신규 스케줄 버튼
    el.btnOpenAddSchedule.addEventListener('click', () => {
      openScheduleFormModal();
    });

    // 휠 롤러 피커 디스플레이 텍스트 업데이트 (시:분 전용)
    window.updateDisplayDateTimeTexts = function() {
      const sVal = el.formStartTime ? (el.formStartTime.value || '10:00') : '10:00';
      const eVal = el.formEndTime ? (el.formEndTime.value || '18:00') : '18:00';

      const dispStart = document.getElementById('display-start-time');
      const dispEnd = document.getElementById('display-end-time');

      const formatTimeOnly = (tStr) => {
        if (!tStr) return '오전 10:00';
        const [hhStr, mmStr] = tStr.split(':');
        let h = Number(hhStr) || 0;
        const ampm = h >= 12 ? '오후' : '오전';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        const pad = (n) => String(n).padStart(2, '0');
        return `${ampm} ${pad(h12)}:${mmStr ? mmStr.slice(0, 2) : '00'}`;
      };

      if (dispStart) dispStart.textContent = formatTimeOnly(sVal);
      if (dispEnd) dispEnd.textContent = formatTimeOnly(eVal);
    };

    // 시작 시간 & 종료 시간 <-> 메인 행사장 소요 시간(분) 양방향 자동 계산
    const updateEventDurationFromTimes = () => {
      if (!el.formDate || !el.formStartTime || !el.formEndTime || !el.formEventDuration) return;
      const dVal = el.formDate.value || fmtDate(new Date());
      const sVal = el.formStartTime.value;
      const eVal = el.formEndTime.value;
      if (dVal && sVal && eVal) {
        const s = new Date(`${dVal}T${sVal.slice(0, 5)}`);
        const e = new Date(`${dVal}T${eVal.slice(0, 5)}`);
        const diffMs = e - s;
        if (!isNaN(diffMs) && diffMs > 0) {
          const diffMin = Math.round(diffMs / (1000 * 60));
          el.formEventDuration.value = diffMin;
        }
      }
      if (window.updateDisplayDateTimeTexts) window.updateDisplayDateTimeTexts();
    };

    const updateEndTimeFromDuration = () => {
      if (!el.formDate || !el.formStartTime || !el.formEndTime || !el.formEventDuration) return;
      const dVal = el.formDate.value || fmtDate(new Date());
      const sVal = el.formStartTime.value;
      const duration = Number(el.formEventDuration.value);
      if (sVal && !isNaN(duration) && duration > 0) {
        const s = new Date(`${dVal}T${sVal.slice(0, 5)}`);
        const e = new Date(s.getTime() + duration * 60 * 1000);
        const pad = (n) => String(n).padStart(2, '0');
        const hh = pad(e.getHours());
        const mm = pad(e.getMinutes());
        el.formEndTime.value = `${hh}:${mm}`;
      }
      if (window.updateDisplayDateTimeTexts) window.updateDisplayDateTimeTexts();
    };

    // ── 🎡 휠 스크롤(드럼 롤러) 시간 피커 로직 (오전/오후 + 시 + 분) ──
    const wheelPopover = document.getElementById('wheel-picker-popover');
    const triggerStart = document.getElementById('trigger-start-time');
    const triggerEnd = document.getElementById('trigger-end-time');
    const btnCloseWheel = document.getElementById('btn-close-wheel-picker');
    const btnApplyWheel = document.getElementById('btn-apply-wheel-picker');
    const wheelTitle = document.getElementById('wheel-picker-title');

    const colAmpm = document.getElementById('wheel-col-ampm');
    const colHour = document.getElementById('wheel-col-hour');
    const colMin = document.getElementById('wheel-col-min');

    let currentWheelMode = 'start'; // 'start' | 'end'
    const ITEM_HEIGHT = 32;

    // 롤러 데이터 생성
    const buildWheelOptions = () => {
      if (!colAmpm || !colHour || !colMin) return;

      // 1. 오전/오후
      colAmpm.innerHTML = `
        <div class="wheel-item" data-val="AM" style="height:32px; line-height:32px; text-align:center; font-size:13px; font-weight:700; color:#1e293b; cursor:pointer; scroll-snap-align:center;">오전</div>
        <div class="wheel-item" data-val="PM" style="height:32px; line-height:32px; text-align:center; font-size:13px; font-weight:700; color:#1e293b; cursor:pointer; scroll-snap-align:center;">오후</div>
      `;

      // 2. 시 (01~12)
      let hourHtml = '';
      for (let h = 1; h <= 12; h++) {
        const hStr = String(h).padStart(2, '0');
        hourHtml += `<div class="wheel-item" data-val="${hStr}" style="height:32px; line-height:32px; text-align:center; font-size:13px; font-weight:700; color:#1e293b; cursor:pointer; scroll-snap-align:center;">${hStr}시</div>`;
      }
      colHour.innerHTML = hourHtml;

      // 3. 분 (00~55, 5분 단위)
      let minHtml = '';
      for (let m = 0; m < 60; m += 5) {
        const mStr = String(m).padStart(2, '0');
        minHtml += `<div class="wheel-item" data-val="${mStr}" style="height:32px; line-height:32px; text-align:center; font-size:13px; font-weight:700; color:#1e293b; cursor:pointer; scroll-snap-align:center;">${mStr}분</div>`;
      }
      colMin.innerHTML = minHtml;

      // 클릭 시 해당 아이템으로 스크롤
      [colAmpm, colHour, colMin].forEach(col => {
        col.querySelectorAll('.wheel-item').forEach((item, idx) => {
          item.addEventListener('click', () => {
            col.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
          });
        });
      });
    };

    const scrollToValue = (col, val) => {
      if (!col) return;
      const items = Array.from(col.querySelectorAll('.wheel-item'));
      const idx = items.findIndex(item => item.getAttribute('data-val') === val);
      if (idx >= 0) {
        col.scrollTop = idx * ITEM_HEIGHT;
      }
    };

    const getSelectedWheelVal = (col) => {
      if (!col) return '';
      const idx = Math.round(col.scrollTop / ITEM_HEIGHT);
      const items = col.querySelectorAll('.wheel-item');
      if (items[idx]) {
        return items[idx].getAttribute('data-val') || '';
      }
      return items[0] ? items[0].getAttribute('data-val') : '';
    };

    const openWheelPicker = (mode) => {
      currentWheelMode = mode;
      buildWheelOptions();

      if (wheelTitle) {
        wheelTitle.textContent = mode === 'start' ? '시작 시간 (위아래 롤러)' : '종료 시간 (위아래 롤러)';
      }

      const curTimeVal = mode === 'start' ? (el.formStartTime.value || '10:00') : (el.formEndTime.value || '18:00');
      const [hStr, mStr] = curTimeVal.split(':');
      let hourNum = Number(hStr) || 0;
      const ampmVal = hourNum >= 12 ? 'PM' : 'AM';
      let h12 = hourNum % 12;
      if (h12 === 0) h12 = 12;
      const h12Str = String(h12).padStart(2, '0');
      let minSnap = String(Math.round((Number(mStr) || 0) / 5) * 5).padStart(2, '0');
      if (Number(minSnap) >= 60) minSnap = '55';

      if (wheelPopover) {
        wheelPopover.style.display = 'block';
        wheelPopover.style.left = mode === 'start' ? '30%' : 'auto';
        wheelPopover.style.right = mode === 'end' ? '0' : 'auto';

        // 롤러 초기 위치로 스크롤
        setTimeout(() => {
          scrollToValue(colAmpm, ampmVal);
          scrollToValue(colHour, h12Str);
          scrollToValue(colMin, minSnap);
        }, 50);
      }
    };

    const applyWheelPicker = () => {
      const selAmpm = getSelectedWheelVal(colAmpm);
      const selHour = getSelectedWheelVal(colHour);
      const selMin = getSelectedWheelVal(colMin);

      let hour24 = Number(selHour) || 0;
      if (selAmpm === 'PM' && hour24 < 12) hour24 += 12;
      if (selAmpm === 'AM' && hour24 === 12) hour24 = 0;
      const hhmm = `${String(hour24).padStart(2, '0')}:${selMin || '00'}`;

      if (currentWheelMode === 'start') {
        if (el.formStartTime) el.formStartTime.value = hhmm;
      } else {
        if (el.formEndTime) el.formEndTime.value = hhmm;
      }

      updateEventDurationFromTimes();
      if (window.updateDisplayDateTimeTexts) window.updateDisplayDateTimeTexts();
      if (wheelPopover) wheelPopover.style.display = 'none';
    };

    if (triggerStart) {
      triggerStart.addEventListener('click', (e) => {
        e.stopPropagation();
        openWheelPicker('start');
      });
    }
    if (triggerEnd) {
      triggerEnd.addEventListener('click', (e) => {
        e.stopPropagation();
        openWheelPicker('end');
      });
    }
    if (btnCloseWheel) {
      btnCloseWheel.addEventListener('click', () => {
        if (wheelPopover) wheelPopover.style.display = 'none';
      });
    }
    if (btnApplyWheel) {
      btnApplyWheel.addEventListener('click', applyWheelPicker);
    }

    if (el.formDate) {
      el.formDate.addEventListener('change', updateEventDurationFromTimes);
    }

    document.addEventListener('click', (e) => {
      if (wheelPopover && wheelPopover.style.display === 'block') {
        if (!wheelPopover.contains(e.target) && (!triggerStart || !triggerStart.contains(e.target)) && (!triggerEnd || !triggerEnd.contains(e.target))) {
          wheelPopover.style.display = 'none';
        }
      }
    });

    // 모달 닫기 버튼 클릭 이벤트
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget?.getAttribute('data-close') || e.target.getAttribute('data-close');
        const m = document.getElementById(modalId);
        if (m) m.classList.remove('active');
      });
    });

    // 🌟 모달 바깥 바탕 공간(오버레이) 클릭 시 자동 닫기
    document.querySelectorAll('.modal-overlay, .modal-backdrop').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          if (overlay.id === 'modal-company-subscription') Admin.closeSubscriptionModal();
          if (overlay.id === 'modal-admin-settings') Admin.closeAdminSettingsModal();
        }
      });
    });

    // 🌟 ESC 키를 눌렀을 때도 열려 있는 모달 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active, .modal-backdrop.active').forEach(m => {
          m.classList.remove('active');
          if (m.id === 'modal-company-subscription') Admin.closeSubscriptionModal();
          if (m.id === 'modal-admin-settings') Admin.closeAdminSettingsModal();
        });
      }
    });

    // 스케줄 폼 제출
    el.formSchedule.addEventListener('submit', async (e) => {
      e.preventDefault();
      const schId = el.formSchId.value || 'sch_' + Date.now();
      const artists = await window.hqStore.getArtists();
      const managers = await window.hqStore.getManagers();
      const vehicles = await window.hqStore.getVehicles();

      const art = artists.find(a => a.id === el.formArtist.value);
      const mgr = managers.find(m => m.id === el.formManager.value);
      const veh = vehicles.find(v => v.id === el.formVehicle.value);

      // 시작/종료 시간 및 일자 정규화
      let dateVal = el.formDate.value;
      let startVal = el.formStartTime.value;
      let endVal = el.formEndTime.value;

      if (startVal && startVal.includes('T')) {
        dateVal = startVal.split('T')[0];
        startVal = startVal.split('T')[1].slice(0, 5);
      }
      if (endVal && endVal.includes('T')) {
        endVal = endVal.split('T')[1].slice(0, 5);
      }

      // 참여 멤버 파싱
      const selectedMembersInput = document.getElementById('form-selected-members');
      let targetMembers = 'ALL';
      if (selectedMembersInput && selectedMembersInput.value && selectedMembersInput.value !== 'ALL') {
        try {
          targetMembers = JSON.parse(selectedMembersInput.value);
        } catch (e) {
          targetMembers = selectedMembersInput.value.split(',').map(m => m.trim()).filter(Boolean);
        }
      }

      const schData = {
        id: schId,
        title: el.formTitle.value,
        artistId: el.formArtist.value,
        artistName: art ? art.name : '',
        targetMembers: targetMembers,
        category: el.formCategory.value,
        date: dateVal,
        startTime: startVal,
        endTime: endVal,
        durationMin: el.formEventDuration ? (Number(el.formEventDuration.value) || 0) : undefined,
        managerId: el.formManager.value,
        managerName: mgr ? mgr.name : '',
        vehicleId: el.formVehicle ? el.formVehicle.value : '',
        vehicleName: veh ? veh.name : '',
        location: el.formLocation.value,
        locationAddress: el.formLocationAddress ? el.formLocationAddress.value : '',
        lat: el.formLocationLat && el.formLocationLat.value ? Number(el.formLocationLat.value) : undefined,
        lng: el.formLocationLng && el.formLocationLng.value ? Number(el.formLocationLng.value) : undefined,
        status: el.formStatus ? el.formStatus.value : '확정',
        outfit: el.formOutfit ? el.formOutfit.value : '',
        contactName: el.formContactName ? el.formContactName.value : '',
        contactPhone: el.formContactPhone ? el.formContactPhone.value : '',
        notes: el.formNotes.value,
        isSecret: el.formIsSecret ? el.formIsSecret.checked : false,
        secretLevel: (el.formIsSecret && el.formIsSecret.checked) ? 'confidential' : 'public',
        shop: {
          needed: el.formShopNeeded ? el.formShopNeeded.checked : false,
          name: el.formShopName ? el.formShopName.value : '',
          durationMin: el.formShopDuration ? (Number(el.formShopDuration.value) || 90) : 90,
          address: el.formShopAddress ? el.formShopAddress.value : ''
        },
        departure: {
          place: el.formDeparturePlace ? el.formDeparturePlace.value : '',
          address: el.formDepartureAddress ? el.formDepartureAddress.value : ''
        }
      };

      // 🚨 배차/매니저 중복 충돌 검사
      if (window.hqStore && window.hqStore.checkConflict) {
        const conflictResult = window.hqStore.checkConflict(schData);
        if (conflictResult.hasConflict) {
          const warnMsgs = conflictResult.conflicts.map(c => {
            if (c.type === 'vehicle') {
              return `• 🚗 [${c.vehicleName}] 차량이 동일 시간대(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'에 이미 배정되어 있습니다.`;
            } else {
              return `• 👤 [${c.managerName}] 매니저가 동일 시간대(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'에 이미 배정되어 있습니다.`;
            }
          }).join('\n');

          // 중복 경고 confirm 팝업 제거 - 항상 저장 진행
        }
      }

      // 🚦 실시간 교통 정체/소요 시간 기반 스마트 동선 타임라인 역산 생성
      if (window.hqStore && typeof window.hqStore.generateSmartTimelineAsync === 'function') {
        schData.timeline = await window.hqStore.generateSmartTimelineAsync(schData);
      }

      await window.hqStore.saveSchedule(schData);
      el.modalScheduleForm.classList.remove('active');
      await renderSidebar();
      await renderKPI();
      await renderCurrentView();
    });

    // 스케줄 수정 버튼
    if (el.btnEditSchedule) {
      el.btnEditSchedule.addEventListener('click', async () => {
        const schId = state.activeScheduleId || window.Admin.currentDetailScheduleId;
        const schedules = await window.hqStore.getSchedules();
        const sch = schedules.find(s => s.id === schId);
        if (sch) {
          el.modalScheduleDetail.classList.remove('active');
          openScheduleFormModal(null, sch);
        }
      });
    }

    // 스케줄 삭제 버튼
    if (el.btnDeleteSchedule) {
      el.btnDeleteSchedule.addEventListener('click', async () => {
        const schId = state.activeScheduleId || window.Admin.currentDetailScheduleId;
        if (confirm('이 스케줄을 삭제하시겠습니까? 매니저플래너에서도 즉시 삭제됩니다.')) {
          await window.hqStore.deleteSchedule(schId);
          el.modalScheduleDetail.classList.remove('active');
          await renderSidebar();
          await renderKPI();
          await renderCurrentView();
        }
      });
    }

    // 신규 매니저 계정 생성 폼 (슬롯 제한 확인)
    if (el.formCreateManager) {
      el.formCreateManager.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 🚨 슬롯 초과 체크
        if (!window.hqStore.canAddManager()) {
          const sub = window.hqStore.getSubscription();
          alert(`⚠️ 현재 보유 중인 매니저 슬롯(${sub.totalSlots}석)이 모두 사용 중입니다.\n\n매니저를 추가로 등록하시려면 [매니저 슬롯 추가(+20,000원/월)]를 진행해주세요.`);
          window.Admin.openSubscriptionModal();
          return;
        }

        const name = document.getElementById('new-mgr-name').value.trim();
        const emailEl = document.getElementById('new-mgr-email');
        const email = emailEl ? emailEl.value.trim() : '';
        const pw = document.getElementById('new-mgr-pw').value.trim();
        const phone = document.getElementById('new-mgr-phone').value.trim();

        if (!email || !email.includes('@')) {
          alert('올바른 회사 이메일 주소를 입력해주세요. (예: user@company.com)');
          return;
        }

        if (pw.length < 6) {
          alert('비밀번호는 최소 6자 이상이어야 합니다.');
          return;
        }

        // 1. 본사/로컬 매니저 스토리지에 즉시 등록 (비밀번호 포함)
        const newMgrObj = {
          id: 'mgr_' + Date.now(),
          name,
          email,
          phone,
          password: pw,
          role: 'manager',
          assignedArtists: []
        };
        await window.hqStore.addManager(newMgrObj);

        // 2. Supabase가 연동된 경우 클라우드 Auth에도 생성 시도
        if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
          try {
            await window.SupabaseClient.signUp(email, pw, name, 'manager', phone);
            alert(`✅ ${name} (${email}) 매니저 계정이 정상 등록되었습니다.`);
          } catch (err) {
            console.warn('Supabase signUp error (local stored):', err.message);
            alert(`✅ ${name} (${email}) 매니저 계정이 등록되었습니다.`);
          }
        } else {
          alert(`✅ [본사 등록] ${name} (${email}) 매니저 계정이 등록되었습니다.`);
        }

        el.formCreateManager.reset();
        window.Admin.updateManagerSlotUI();
        await window.Admin.renderManagerManagementList();
        await populateSelectOptions();
        await renderSidebar();
      });
    }

    // 매니저 정보 수정 폼 제출
    const formEditMgr = document.getElementById('form-edit-manager');
    if (formEditMgr) {
      formEditMgr.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-mgr-id').value;
        const name = document.getElementById('edit-mgr-name').value.trim();
        const emailEl = document.getElementById('edit-mgr-email');
        const email = emailEl ? emailEl.value.trim() : '';
        const phone = document.getElementById('edit-mgr-phone').value.trim();
        const pwEl = document.getElementById('edit-mgr-pw');
        const password = pwEl ? pwEl.value.trim() : '';

        if (!email || !email.includes('@')) {
          alert('올바른 이메일 주소를 입력해주세요.');
          return;
        }

        if (password && password.length < 6) {
          alert('비밀번호는 최소 6자 이상이어야 합니다.');
          return;
        }

        const updatePayload = { name, email, phone };
        if (password) {
          updatePayload.password = password;
        }

        await window.hqStore.updateManager(id, updatePayload);
        const modal = document.getElementById('modal-manager-edit');
        if (modal) modal.classList.remove('active');

        await window.Admin.renderManagerManagementList();
        await populateSelectOptions();
        await renderSidebar();
        alert(`✅ [${name}] 매니저 정보${password ? ' 및 비밀번호' : ''}가 성공적으로 수정되었습니다.`);
      });
    }

    // 아티스트 추가 및 수정 폼 제출
    if (el.formArtistAdd) {
      el.formArtistAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-artist-id').value;
        const name = document.getElementById('new-artist-name').value.trim();
        const type = document.getElementById('new-artist-type').value;
        const members = Number(document.getElementById('new-artist-members').value) || 1;
        const color = document.getElementById('new-artist-color').value;
        const icon = (document.getElementById('new-artist-icon') ? document.getElementById('new-artist-icon').value : 'star') || 'star';
        const emoji = (document.getElementById('new-artist-emoji') ? document.getElementById('new-artist-emoji').value.trim() : '') || '✨';
        const image = document.getElementById('new-artist-image') ? document.getElementById('new-artist-image').value.trim() : '';
        const care = document.getElementById('new-artist-care') ? document.getElementById('new-artist-care').value.trim() : '';
        const status = (document.getElementById('new-artist-status') ? document.getElementById('new-artist-status').value : '활동중') || '활동중';
        const memberListRaw = (document.getElementById('new-artist-member-list') ? document.getElementById('new-artist-member-list').value : '').trim();
        const memberList = memberListRaw ? memberListRaw.split(',').map(m => m.trim()).filter(Boolean) : [];

        if (editId) {
          await window.hqStore.updateArtist(editId, {
            name,
            type,
            members: memberList.length > 0 ? memberList.length : members,
            memberList,
            status,
            color,
            icon,
            emoji,
            image,
            careInfo: care,
            care: care
          });
          alert(`✅ [${name}] 아티스트 정보가 수정되었습니다.`);
        } else {
          const newArt = {
            id: 'art_' + Date.now(),
            name,
            type,
            members: memberList.length > 0 ? memberList.length : members,
            memberList,
            status,
            color,
            icon,
            emoji,
            image,
            careInfo: care,
            care: care
          };
          await window.hqStore.addArtist(newArt);
          alert(`✅ [${name}] 아티스트가 성공적으로 등록되었습니다.`);
        }

        el.modalArtistForm.classList.remove('active');
        await window.Admin.renderArtistManagementList();
        await populateSelectOptions();
        await renderSidebar();
        await renderKPI();
        await renderCurrentView();
      });
    }

    // 차량 추가 및 수정 폼 제출
    const formVehicleAdd = document.getElementById('form-vehicle-add');
    if (formVehicleAdd) {
      formVehicleAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('edit-vehicle-id').value;
        const name = document.getElementById('new-vehicle-name').value.trim();
        const number = document.getElementById('new-vehicle-number').value.trim();
        const type = document.getElementById('new-vehicle-type').value;
        const seats = Number(document.getElementById('new-vehicle-seats').value) || 7;
        const status = document.getElementById('new-vehicle-status').value;
        const defaultArtist = document.getElementById('new-vehicle-artist') ? document.getElementById('new-vehicle-artist').value : '';
        const driver = document.getElementById('new-vehicle-driver') ? document.getElementById('new-vehicle-driver').value.trim() : '';
        const notes = document.getElementById('new-vehicle-notes') ? document.getElementById('new-vehicle-notes').value.trim() : '';

        const vehPayload = {
          name,
          number,
          type,
          seats,
          status,
          defaultArtist,
          driver,
          notes
        };

        if (editId) {
          vehPayload.id = editId;
          await window.hqStore.saveVehicle(vehPayload);
          alert(`✅ [${name}] 차량 정보가 수정되었습니다.`);
        } else {
          vehPayload.id = 'veh_' + Date.now();
          await window.hqStore.saveVehicle(vehPayload);
          alert(`✅ [${name}] 차량이 성공적으로 등록되었습니다.`);
        }

        const modal = document.getElementById('modal-vehicle-form');
        if (modal) modal.classList.remove('active');
        await window.Admin.renderVehicleManagementList();
        await populateSelectOptions();
      });
    }

    // 메인 행사장 카카오/티맵 위치 검색 핸들러
    if (el.btnSearchLocation && el.formLocation) {
      const doLocationSearch = async () => {
        const query = el.formLocation.value.trim();
        if (!query) {
          alert('검색할 행사장 명칭이나 키워드를 입력해주세요. (예: 상암 SBS, KBS 신관, 올림픽홀)');
          el.formLocation.focus();
          return;
        }

        if (!el.locationSearchResults) return;
        el.locationSearchResults.style.display = 'block';
        el.locationSearchResults.innerHTML = `
          <div style="padding:12px; text-align:center; color:#64748b; font-size:12px; display:flex; align-items:center; justify-content:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            <span>카카오 & 티맵 위치 검색 중...</span>
          </div>
        `;

        let results = [];
        try {
          if (typeof KakaoAPI !== 'undefined' && KakaoAPI.searchPlace) {
            const kakaoRes = await KakaoAPI.searchPlace(query);
            if (kakaoRes && kakaoRes.length > 0) {
              results = kakaoRes.map(item => ({
                id: item.id || item.place_name,
                name: item.place_name,
                address: item.road_address_name || item.address_name || item.address || '',
                lat: item.y,
                lng: item.x,
                provider: '카카오'
              }));
            }
          }
          
          if (results.length === 0 && typeof TmapAPI !== 'undefined' && TmapAPI.searchPlace) {
            const tmapRes = await TmapAPI.searchPlace(query);
            if (tmapRes && tmapRes.length > 0) {
              results = tmapRes.map(item => ({
                id: item.id || item.place_name,
                name: item.place_name,
                address: item.address_name || '',
                lat: item.y,
                lng: item.x,
                provider: '티맵'
              }));
            }
          }
        } catch (err) {
          console.error('위치 검색 중 오류:', err);
        }

        if (results.length === 0) {
          el.locationSearchResults.innerHTML = `
            <div style="padding:14px; text-align:center; color:#64748b; font-size:12px;">
              <div style="color:#ef4444; font-weight:600; margin-bottom:4px;">검색 결과가 없습니다.</div>
              <div>도로명 주소를 직접 입력창에 입력하실 수 있습니다.</div>
            </div>
          `;
          return;
        }

        el.locationSearchResults.innerHTML = results.map(item => `
          <div class="loc-search-item" style="padding:8px 10px; border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap:8px; border-bottom:1px solid #f1f5f9; transition:background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
            <div style="flex:1; min-width:0;">
              <div style="font-weight:700; color:#0f172a; font-size:13px; display:flex; align-items:center; gap:6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${item.name}</span>
                <span style="font-size:10px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; padding:1px 5px; border-radius:4px; font-weight:700;">${item.provider}</span>
              </div>
              <div style="font-size:11px; color:#64748b; margin-top:2px;">${item.address || '주소 정보 없음'}</div>
            </div>
            <button type="button" style="padding:4px 8px; font-size:11px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; border-radius:4px; font-weight:700; cursor:pointer; flex-shrink:0;">선택</button>
          </div>
        `).join('');

        el.locationSearchResults.querySelectorAll('.loc-search-item').forEach((row, idx) => {
          row.addEventListener('click', () => {
            const selected = results[idx];
            if (selected) {
              el.formLocation.value = selected.name;
              if (el.formLocationAddress) el.formLocationAddress.value = selected.address;
              if (el.formLocationLat) el.formLocationLat.value = selected.lat || '';
              if (el.formLocationLng) el.formLocationLng.value = selected.lng || '';
            }
            el.locationSearchResults.style.display = 'none';
          });
        });
      };

      el.btnSearchLocation.addEventListener('click', doLocationSearch);
      el.formLocation.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          doLocationSearch();
        }
      });

      // 외부 클릭 시 검색 결과 닫기
      document.addEventListener('click', (e) => {
        if (el.locationSearchResults && el.btnSearchLocation && el.formLocation) {
          if (!el.formLocation.contains(e.target) && !el.btnSearchLocation.contains(e.target) && !el.locationSearchResults.contains(e.target)) {
            el.locationSearchResults.style.display = 'none';
          }
        }
      });
    }

    // 엑셀/CSV 내보내기
    el.btnExportExcel.addEventListener('click', async () => {
      const schedules = await window.hqStore.getSchedules();
      let csv = '\uFEFF날짜,스케줄명,아티스트,분류,시간,담당매니저,배차,장소,상태\n';
      schedules.forEach(s => {
        csv += `"${s.date}","${s.title}","${s.artistName}","${s.category}","${s.startTime}~${s.endTime}","${s.managerName}","${s.vehicleName || ''}","${s.location}","${s.status}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `HQ_아티스트_스케줄_${fmtDate(new Date())}.csv`;
      link.click();
    });
  }

  // Run
  init();
});
