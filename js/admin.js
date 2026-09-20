/* ===================================================
   HQ Enterprise Master Scheduler — Interactive Controller
   =================================================== */

// Global Admin Interface
window.Admin = {
  openSupabaseModal() {
    const modal = document.getElementById('modal-supabase-config');
    if (!modal) return;
    const cfg = window.SupabaseClient ? window.SupabaseClient.getConfig() : { url: '', anonKey: '' };
    document.getElementById('cfg-supabase-url').value = cfg.url;
    document.getElementById('cfg-supabase-key').value = cfg.anonKey;
    modal.classList.add('active');
  },

  saveSupabaseConfig() {
    const url = document.getElementById('cfg-supabase-url').value.trim();
    const key = document.getElementById('cfg-supabase-key').value.trim();
    if (!url || !key) {
      alert('URL과 Anon Key를 모두 입력해주세요.');
      return;
    }
    try {
      window.SupabaseClient.setConfig(url, key);
      alert('✅ Supabase 클라우드 DB와 연결되었습니다!');
      document.getElementById('modal-supabase-config').classList.remove('active');
      window.Admin.updateSupabaseBadge();
      window.location.reload();
    } catch (e) {
      alert('연결 실패: ' + e.message);
    }
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

  updateRoleBadge() {
    const persona = window.AuthPersona ? window.AuthPersona.getCurrentUser() : { name: '홍길동 대표', shortBadge: '👑 CEO', color: '#f59e0b', badge: '👑 대표 (CEO)' };
    const iconEl = document.getElementById('hq-role-badge-icon');
    const textEl = document.getElementById('hq-role-badge-text');
    const badgeEl = document.getElementById('hq-role-switcher-badge');
    const brandTitleEl = document.getElementById('hq-brand-title');

    if (iconEl && textEl && badgeEl) {
      iconEl.textContent = persona.badge.split(' ')[0];
      textEl.textContent = `${persona.name} (${persona.shortBadge})`;
      badgeEl.style.color = persona.color;
      badgeEl.style.borderColor = persona.color + '60';
      badgeEl.style.background = persona.color + '15';
    }

    if (brandTitleEl) {
      const companyName = localStorage.getItem('bp_company_name') || 'STAR';
      brandTitleEl.textContent = `${companyName} SCHEDULER`;
    }
  },

  logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      if (window.AuthPersona) {
        window.AuthPersona.logout();
        // AuthPersona.logout() internally redirects to login.html, but we want admin-login.html for admin
        // we'll let it redirect, but let's force it here too
        window.location.href = 'admin-login.html';
      } else {
        localStorage.removeItem('bp_logged_in');
        window.location.href = 'admin-login.html';
      }
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
    const badgeText = document.getElementById('sub-badge-text');
    if (badgeText) {
      badgeText.textContent = `구독: Standard (${sub.activeManagerCount}/${sub.totalSlots}명 · 월 ${(sub.monthlyFee / 10000).toLocaleString()}만)`;
    }
  },

  // ── 💳 회사 구독 모달 컨트롤러 ──
  tempAdditionalSlots: 0,

  openSubscriptionModal() {
    const sub = window.hqStore.getSubscription();
    this.tempAdditionalSlots = sub.additionalSlots || 0;
    this.renderSubscriptionModalContent();
    const modal = document.getElementById('modal-company-subscription');
    if (modal) modal.classList.add('active');
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

    if (companyNameEl) companyNameEl.textContent = sub.companyName;
    if (bizInfoEl) bizInfoEl.textContent = `사업자번호: ${sub.bizNumber} | 대표자: ${sub.ceoName}`;
    if (monthlyTotalEl) monthlyTotalEl.textContent = `월 ${totalFee.toLocaleString()}원`;
    if (slotProgressText) slotProgressText.textContent = `${sub.activeManagerCount} / ${totalSlots}석 (${Math.max(0, totalSlots - sub.activeManagerCount)}석 잔여)`;
    if (slotProgressBar) slotProgressBar.style.width = `${usedPct}%`;
    if (additionalSlotCount) additionalSlotCount.textContent = `${addSlots}명`;
    if (calcAdditionalFee) calcAdditionalFee.textContent = `+ ${addFee.toLocaleString()}원 / 월`;
    if (calcTotalFee) calcTotalFee.textContent = `월 ${totalFee.toLocaleString()}원 (VAT 별도)`;
  },

  changeSlotCount(delta) {
    this.tempAdditionalSlots = Math.max(0, this.tempAdditionalSlots + delta);
    this.renderSubscriptionModalContent();
  },

  confirmSlotPayment() {
    const sub = window.hqStore.getSubscription();
    sub.additionalSlots = this.tempAdditionalSlots;
    window.hqStore.saveSubscription(sub);

    const totalFee = (sub.baseFee || 100000) + (this.tempAdditionalSlots * (sub.additionalSlotFee || 20000));
    alert(`🎉 회사 구독 슬롯이 성공적으로 변경되었습니다!\n\n• 총 매니저 슬롯: ${(sub.baseSlots || 2) + this.tempAdditionalSlots}석\n• 변경된 월 청구액: 월 ${totalFee.toLocaleString()}원 (VAT 별도)\n• 결제 수단: ${sub.paymentMethod}`);

    const modal = document.getElementById('modal-company-subscription');
    if (modal) modal.classList.remove('active');

    this.updateManagerSlotUI();
  },

  async renderManagerManagementList() {
    const container = document.getElementById('manager-mgmt-list');
    if (!container) return;

    const managers = await window.hqStore.getManagers();
    const artists = await window.hqStore.getArtists();

    container.innerHTML = managers.map(mgr => {
      const assigned = mgr.assignedArtists || [];
      return `
        <div style="background:#1e293b; border-radius:8px; padding:12px; border:1px solid #334155;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${mgr.color || '#6366f1'};"></span>
              <strong style="color:#f8fafc; font-size:14px;">${mgr.name}</strong>
              <span style="font-size:11px; background:#334155; color:#94a3b8; padding:2px 6px; border-radius:4px;">${mgr.role === 'hq_admin' ? '본사 관리자' : '현장 매니저'}</span>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:12px; color:#64748b;">${mgr.phone || '연락처 없음'}</span>
              ${mgr.role !== 'hq_admin' ? `<button type="button" onclick="Admin.deleteManager('${mgr.id}')" style="background:transparent; border:none; color:#ef4444; font-size:12px; cursor:pointer; padding:4px; margin-left:-4px;">삭제</button>` : ''}
            </div>
          </div>
          <div style="font-size:12px; color:#94a3b8; margin-bottom:6px;">담당 아티스트 선택:</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${artists.map(art => {
        const isChecked = assigned.includes(art.id);
        return `
                <button type="button" 
                  onclick="Admin.toggleArtistAssignment('${mgr.id}', '${art.id}')"
                  style="padding:4px 8px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; border:1px solid ${isChecked ? art.color : '#334155'}; background:${isChecked ? art.color + '22' : '#0f172a'}; color:${isChecked ? '#fff' : '#64748b'};">
                  ${art.emoji || '✨'} ${art.name} ${isChecked ? '✓' : '+'}
                </button>
              `;
      }).join('')}
          </div>
        </div>
      `;
    }).join('');
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
    const schedules = await window.hqStore.getSchedules();
    const sch = schedules.find(s => s.id === schId);
    if (!sch) return;

    const modal = document.getElementById('modal-schedule-detail');
    const content = document.getElementById('detail-body-content');
    if (!modal || !content) return;

    const artists = await window.hqStore.getArtists();
    const art = artists.find(a => a.id === sch.artistId);

    let statusCls = 'ready';
    if (sch.status === '이동중' || sch.status === 'in_progress') statusCls = 'moving';
    if (sch.status === '샵진행') statusCls = 'shop';
    if (sch.status === '완료' || sch.status === 'completed') statusCls = 'done';

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:14px; margin-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="background:${art ? art.color : '#4f46e5'}; color:#fff; font-size:12px; padding:2px 8px; border-radius:4px; font-weight:600;">
              ${sch.artistName || '아티스트'}
            </span>
            ${sch.isSecret ? '<span style="background:#fee2e2; color:#dc2626; font-size:11px; padding:2px 8px; border-radius:4px; font-weight:800; border:1px solid #fca5a5;">🔒 극비 보안 스케줄</span>' : ''}
          </div>
          <h2 style="font-size:20px; color:#0f172a; margin:4px 0;">${sch.title}</h2>
          <div style="font-size:13px; color:#64748b;">📅 ${sch.date} (${sch.startTime} ~ ${sch.endTime})</div>
        </div>
        <span class="badge-status ${statusCls}">${sch.status || '예정'}</span>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px; font-size:13px;">
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">📍 메인 장소:</span> <strong style="color:#0f172a;">${sch.location || '미정'}</strong>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">👤 담당 매니저:</span> <strong style="color:#0f172a;">${sch.managerName || '미배정'}</strong>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">🚗 배차 차량:</span> <strong style="color:#0f172a;">${sch.vehicleName || '미배정'}</strong>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">💄 헤메 샵:</span> <strong style="color:#0f172a;">${sch.shopLocation || (sch.shop?.name) || '미경유'}</strong>
        </div>
      </div>

      ${sch.notes ? `
        <div style="background:var(--bg-card); padding:12px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:16px;">
          <div style="font-size:12px; color:#64748b; margin-bottom:4px;">📝 현장 특이사항 / 메모</div>
          <div style="font-size:13px; color:#0f172a; line-height:1.5;">${sch.notes}</div>
        </div>
      ` : ''}

      <div style="margin-top:16px;">
        <h4 style="font-size:14px; color:#0f172a; margin-bottom:10px;">📋 스마트 역산 타임라인</h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;">
          ${(sch.timeline || []).map(item => `
            <div style="display:flex; gap:10px; align-items:center; background:var(--bg-surface); border:1px solid var(--border-color); padding:8px 12px; border-radius:6px; font-size:13px;">
              <span style="color:#0284c7; font-weight:700; font-family:monospace;">${item.time}</span>
              <span style="color:${item.done ? '#10b981' : '#0f172a'}; text-decoration:${item.done ? 'line-through' : 'none'};">${item.label}</span>
              ${item.done ? '<span style="margin-left:auto; font-size:11px; color:#10b981;">✓ 완료</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    content.innerHTML = html;
    modal.classList.add('active');
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
    formShopNeeded: document.getElementById('form-shop-needed'),
    shopFields: document.getElementById('shop-fields'),
    formShopName: document.getElementById('form-shop-name'),
    formShopDuration: document.getElementById('form-shop-duration'),
    formShopAddress: document.getElementById('form-shop-address'),
    formDeparturePlace: document.getElementById('form-departure-place'),
    formStatus: document.getElementById('form-status'),
    formIsSecret: document.getElementById('form-is-secret'),
    formOutfit: document.getElementById('form-outfit'),
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
      { id: 'kpi-card-today', key: 'today', title: '오늘 총 스케줄', color: '#6366f1' },
      { id: 'kpi-card-active', key: 'active', title: '진행중 / 이동중 스케줄', color: '#f59e0b' },
      { id: 'kpi-card-shop', key: 'shop', title: '헤메샵 경유 스케줄', color: '#ec4899' }
    ];

    cards.forEach(c => {
      const cardEl = document.getElementById(c.id);
      if (!cardEl) return;

      cardEl.addEventListener('mouseenter', (e) => {
        if (kpiHideTimer) clearTimeout(kpiHideTimer);
        const schedules = kpiDataCache[c.key];
        if (!schedules || schedules.length === 0) return;

        let popHtml = `
          <div style="font-size:13px; font-weight:700; border-bottom:1px solid #334155; padding-bottom:8px; margin-bottom:8px; color:#fff; display:flex; justify-content:space-between; align-items:center;">
            <span>${c.title} <span style="background:${c.color}; color:#fff; padding:2px 6px; border-radius:10px; font-size:11px; margin-left:4px;">${schedules.length}건</span></span>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto; padding-right:4px;">
        `;

        schedules.forEach(sch => {
          popHtml += `
            <div class="kpi-popover-item" data-id="${sch.id}" style="background:#0f172a; padding:10px; border-radius:6px; cursor:pointer; font-size:12px; border:1px solid #334155;" onmouseenter="this.style.borderColor='${c.color}'" onmouseleave="this.style.borderColor='#334155'">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-weight:700; color:#60a5fa;">⏰ ${sch.startTime} ~ ${sch.endTime || ''}</span>
              </div>
              <div style="font-weight:700; color:#fff; margin-bottom:4px; font-size:13px;">✨ [${sch.artistName}] ${sch.title}</div>
            </div>
          `;
        });

        popHtml += `</div>`;
        kpiPopover.innerHTML = popHtml;

        kpiPopover.querySelectorAll('.kpi-popover-item').forEach(item => {
          item.addEventListener('click', () => {
            kpiPopover.style.display = 'none';
            Admin.openScheduleDetail(item.dataset.id);
          });
        });

        const rect = cardEl.getBoundingClientRect();
        kpiPopover.style.left = Math.max(10, rect.left + (rect.width / 2) - 160) + 'px';
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
      alert('본사 관제 포털 로그인이 필요합니다.');
      window.location.href = 'admin-login.html';
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
    el.formArtist.innerHTML = artists.map(a => `<option value="${a.id}">${a.emoji || '✨'} ${a.name}</option>`).join('');

    // 매니저 select
    el.formManager.innerHTML = managers.map(m => `<option value="${m.id}">${m.name} (${m.phone || '로드'})</option>`).join('');

    // 차량 select
    el.formVehicle.innerHTML = vehicles.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  }

  // ── 사이드바 렌더링 ──
  async function renderSidebar() {
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const schedules = await window.hqStore.getSchedules();

    // 1. 아티스트 칩 목록
    let artistHtml = `
      <div class="artist-chip ${state.selectedArtistFilter === 'ALL' ? 'active' : ''}" data-artist-id="ALL">
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
      const isSel = state.selectedArtistFilter === art.id;
      artistHtml += `
        <div class="artist-chip ${isSel ? 'active' : ''}" data-artist-id="${art.id}">
          <div class="artist-avatar" style="background:${art.color}">${art.emoji || '✨'}</div>
          <div class="artist-meta">
            <div class="name">${art.name}</div>
            <div class="sub">${art.type} · ${art.status}</div>
          </div>
          <span class="count-badge">${count}</span>
        </div>
      `;
    });
    el.artistFilterList.innerHTML = artistHtml;

    // 2. 매니저 상태 목록
    let mgrHtml = '';
    managers.forEach(mgr => {
      mgrHtml += `
        <div class="artist-chip" style="cursor:default;">
          <div class="artist-avatar" style="background:${mgr.color || '#6366f1'}; font-size:12px;">👤</div>
          <div class="artist-meta">
            <div class="name">${mgr.name}</div>
            <div class="sub">${mgr.phone || '연락처 없음'}</div>
          </div>
          <span style="font-size:11px; color:#10b981; font-weight:600;">온라인</span>
        </div>
      `;
    });
    if (el.managerStatusList) {
      el.managerStatusList.innerHTML = mgrHtml;
    }
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
    el.calendarTitle.textContent = `${year}년 ${month + 1}월`;

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
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:8px; width:100%;">
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--accent-pink); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">일</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">월</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">화</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">수</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">목</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">금</div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--accent-cyan); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">토</div>
    `;

    // 이전 달 빈 칸 (고정 110px)
    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<div class="cal-cell empty" style="background:transparent; border:1px dashed rgba(0,0,0,0.08); border-radius:8px; height:110px; min-height:110px; max-height:110px;"></div>`;
    }

    const todayStr = fmtDate(new Date());

    // 이번 달 날짜들 (고정 110px 및 심플 일정 제목 칩)
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
          style="background:var(--bg-card); border:${isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; border-radius:8px; height:110px; max-height:110px; min-height:110px; padding:8px 10px; display:flex; flex-direction:column; gap:4px; cursor:pointer; transition:all 0.2s; overflow:hidden; position:relative;" onmouseenter="this.style.background='var(--bg-card-hover)'" onmouseleave="this.style.background='var(--bg-card)'">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
            <span style="font-size:14px; font-weight:800; color:${dayColor};">${day}</span>
            ${daySchedules.length > 0 ? `<span style="font-size:10px; background:rgba(79,70,229,0.1); color:#4f46e5; padding:1px 6px; border-radius:10px; font-weight:700;">${daySchedules.length}건</span>` : ''}
          </div>
          <div class="cell-events" style="display:flex; flex-direction:column; gap:3px; overflow:hidden; flex:1;">
      `;

      // 최대 2개만 깔끔한 제목 칩으로 노출
      daySchedules.slice(0, 2).forEach(sch => {
        const art = artists.find(a => a.id === sch.artistId);
        const isSec = sch.isSecret === true;
        const artColor = isSec ? '#9333ea' : (art ? art.color : '#4f46e5');
        const lockPrefix = isSec ? '🔒 ' : '';
        html += `
          <div class="cal-event-pill" style="background:${artColor}; color:#fff; padding:0 8px; height:23px; line-height:23px; border-radius:5px; font-size:11px; font-weight:700; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.05); border-left:3px solid ${isSec ? '#f43f5e' : 'rgba(255,255,255,0.9)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-shrink:0;" data-sch-id="${sch.id}">
            ${lockPrefix}${art?.emoji || '✨'} ${sch.title}
          </div>
        `;
      });

      if (daySchedules.length > 2) {
        html += `<div style="font-size:10px; color:#4f46e5; text-align:right; font-weight:800; margin-top:1px;">+${daySchedules.length - 2}개 더보기 🔍</div>`;
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
    el.calendarTitle.textContent = `${year}년 ${month}월 주간 타임테이블`;

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
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:12px; min-height:500px;">
    `;

    weekDays.forEach((d, idx) => {
      const dateStr = fmtDate(d);
      const isToday = dateStr === fmtDate(new Date());
      const daySchedules = allSchedules.filter(s => s.date === dateStr);

      html += `
        <div style="background:var(--bg-card); border-radius:10px; padding:12px; border:${isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; display:flex; flex-direction:column; gap:10px;">
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
            <div class="cal-event-pill" style="--art-color: ${artColor}; padding:8px; border-radius:6px; cursor:pointer;" data-sch-id="${sch.id}">
              <div style="font-weight:600; font-size:12px; color:#ffffff;">${sch.startTime} ~ ${sch.endTime}</div>
              <div style="font-size:13px; font-weight:700; color:#ffffff; margin:2px 0;">${displayTitle}</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.8);">👤 ${sch.artistName || '아티스트'} | 🚗 ${sch.managerName || '매니저'}</div>
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
    el.calendarTitle.textContent = `${todayStr} 아티스트별 타임라인 (Gantt)`;

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
            <span style="font-size:20px;">${art.emoji || '✨'}</span>
            <h3 style="margin:0; font-size:16px; color:#fff;">${art.name}</h3>
            <span style="font-size:12px; color:#94a3b8;">(${art.type})</span>
            <span style="margin-left:auto; font-size:12px; color:#10b981;">오늘 일정 ${artSch.length}건</span>
          </div>
          <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:6px;">
      `;

      if (artSch.length === 0) {
        html += `<div style="color:#64748b; font-size:13px;">오늘 등록된 스케줄이 없습니다.</div>`;
      } else {
        artSch.forEach(sch => {
          const isSec = sch.isSecret === true;
          const canView = window.AuthPersona ? window.AuthPersona.canViewSecret(sch) : true;
          const displayTitle = (isSec && !canView) ? '🔒 [극비 보안 스케줄]' : (isSec ? `🔒 [비공개] ${sch.title}` : sch.title);
          const displayLoc = (isSec && !canView) ? '비공개 장소' : (sch.location || '장소 미지정');

          html += `
            <div class="cal-event-pill" style="--art-color: ${art.color}; padding:10px 14px; border-radius:8px; min-width:220px; cursor:pointer;" data-sch-id="${sch.id}">
              <div style="font-size:12px; color:#93c5fd; font-weight:600;">⏰ ${sch.startTime} ~ ${sch.endTime}</div>
              <div style="font-size:14px; font-weight:700; color:#fff; margin:4px 0;">${displayTitle}</div>
              <div style="font-size:12px; color:#cbd5e1;">📍 ${displayLoc}</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:4px;">담당: ${sch.managerName || '매니저'}</div>
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
    el.calendarTitle.textContent = `${todayStr} 실시간 상황판 (Kanban Control)`;

    let schedules = await window.hqStore.getSchedules({ date: todayStr });
    if (state.selectedArtistFilter !== 'ALL') {
      schedules = schedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();

    // 5 Columns
    const cols = [
      { key: 'ready', title: '📋 예정 / 출발대기', color: '#60a5fa' },
      { key: 'moving', title: '🚗 픽업 / 이동중', color: '#f59e0b' },
      { key: 'shop', title: '💄 헤메샵 진행중', color: '#ec4899' },
      { key: 'onsite', title: '🎬 현장대기 / 진행중', color: '#818cf8' },
      { key: 'done', title: '🎉 일정 완료', color: '#34d399' }
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
          <div class="kanban-col-header" style="border-top:3px solid ${col.color};">
            <span>${col.title}</span>
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
          const displayTitle = (isSec && !canView) ? '🔒 [극비 보안 스케줄]' : (isSec ? `🔒 [비공개] ${sch.title}` : sch.title);
          const displayLoc = (isSec && !canView) ? '비공개 장소' : (sch.location || '장소 미정');

          const art = artists.find(a => a.id === sch.artistId);
          const artColor = art ? art.color : '#6366f1';
          const isMoving = col.key === 'moving';
          const isDone = col.key === 'done';

          let currentStepText = '대기 중';
          if (sch.timeline && sch.timeline.length > 0) {
            const activeStep = sch.timeline.find(t => t.moving) || sch.timeline.find(t => !t.done) || sch.timeline[sch.timeline.length - 1];
            if (activeStep) currentStepText = activeStep.label;
          }
          const displayStep = (isSec && !canView) ? '비공개 상태' : currentStepText;

          html += `
            <div class="kanban-card ${isMoving ? 'kanban-card-moving' : ''} ${isDone ? 'kanban-card-done' : ''}" 
                 style="--accent-theme: ${artColor};" data-sch-id="${sch.id}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:${artColor}; background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">
                  ${art?.emoji || '✨'} ${sch.artistName || '아티스트'}
                </span>
                ${getStatusBadge(sch.status)}
              </div>
              
              <div style="font-size:14px; font-weight:800; color:#fff; margin-bottom:6px; line-height:1.3;">
                ${displayTitle}
              </div>

              <div style="font-size:12px; color:#94a3b8; display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                <div>⏰ <strong>${sch.startTime} ~ ${sch.endTime || ''}</strong></div>
                <div>📍 ${displayLoc}</div>
                <div>👤 매니저: ${sch.managerName || '미배정'} | 🚗 ${sch.vehicleName || '차량 미지정'}</div>
              </div>

              <div style="background:#1e293b; padding:8px 10px; border-radius:6px; font-size:11px; color:#cbd5e1; display:flex; justify-content:space-between; align-items:center; border:1px solid #334155;">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📍 ${displayStep}</span>
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
    el.calendarTitle.textContent = `${todayStr} 종합 관제 지도 (Control Map)`;

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
            <h4 style="color:#fff; font-size:15px; font-weight:800; display:flex; align-items:center; gap:6px;">
              <span>🗺️</span> 수도권 주요 방송국/스튜디오 & 실시간 아티스트 동선 관제
            </h4>
            <div style="display:flex; gap:8px;">
              <span class="badge-status moving">🚗 이동중 ${schedules.filter(s => s.status === '이동중' || s.timeline?.some(t => t.moving)).length}대</span>
              <span class="badge-status done">✓ 완료 ${schedules.filter(s => s.status === '완료' || s.status === 'completed').length}건</span>
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
                        ${art?.emoji || '✨'} ${sch.artistName}
                      </span>
                      <span style="font-size:11px; font-weight:700; color:${isMoving ? '#fbbf24' : isDone ? '#34d399' : '#a5b4fc'};">
                        ${isMoving ? '🚗 이동 중' : isDone ? '✓ 완료' : '⏱️ 대기중'}
                      </span>
                    </div>

                    <div style="font-size:13px; font-weight:800; color:#fff; margin-bottom:6px; line-height:1.3;">
                      🎬 ${sch.title}
                    </div>

                    <div style="font-size:12px; color:#cbd5e1; font-weight:600; display:flex; align-items:center; gap:4px;">
                      <span>📍</span> <span>${sch.location || '장소 미정'}</span>
                    </div>

                    <div style="font-size:11px; color:#94a3b8; margin-top:8px; padding-top:6px; border-top:1px dashed #334155; display:flex; justify-content:space-between;">
                      <span>👤 ${sch.managerName || '매니저'}</span>
                      <span>🚗 ${sch.vehicleName || '배차 차량'}</span>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>

            <!-- Footer status summary inside map canvas -->
            <div style="position:relative; z-index:2; margin-top:20px; background:rgba(15,23,42,0.85); border:1px solid #334155; padding:12px 16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; color:#94a3b8;">📡 본사 관제 센터: 현장 매니저플래너 앱과 실시간 2-way 데이터 동기화 활성화됨</span>
              <span style="font-size:12px; font-weight:700; color:#38bdf8;">수도권 주요 방송국/샵 거점 관제 모드</span>
            </div>

          </div>
        </div>

        <!-- 우측 차량 / 매니저 현황 패널 -->
        <div class="map-vehicle-sidebar">
          <div style="background:#1e293b; border-radius:var(--radius-md); border:1px solid #334155; padding:14px;">
            <h4 style="color:#fff; font-size:14px; font-weight:800; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              <span>🚘</span> 전사 배차 현황 (${vehicles.length}대)
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
                      <span style="font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; background:${isMoving ? '#f59e0b' : isBusy ? '#4f46e5' : '#334155'}; color:#fff;">
                        ${isMoving ? '🚗 주행중' : isBusy ? '📌 운행예정' : '🅿️ 차고지 대기'}
                      </span>
                    </div>
                    ${assignedSched ? `
                      <div style="color:#93c5fd; font-size:11px; font-weight:600;">✨ [${assignedSched.artistName}] ${assignedSched.title}</div>
                      <div style="color:#94a3b8; font-size:11px;">📍 ${assignedSched.location || '현장'}</div>
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
    el.calendarTitle.textContent = `${year}년 ${month}월 전사 활동 분석 리포트`;

    const allSchedules = await window.hqStore.getSchedules();
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const vehicles = await window.hqStore.getVehicles();

    // Compute stats
    const totalCount = allSchedules.length;
    const doneCount = allSchedules.filter(s => s.status === '완료' || s.status === 'completed' || s.timeline?.every(t => t.done)).length;
    const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

    // Categories Breakdown
    const catMap = {
      music_show: { label: '📺 음악방송', count: 0, color: '#6366f1' },
      shooting: { label: '📸 화보/광고', count: 0, color: '#ec4899' },
      event: { label: '🎪 행사/공연', count: 0, color: '#f59e0b' },
      fansign: { label: '💌 팬사인회', count: 0, color: '#10b981' },
      broadcast: { label: '🎙️ 예능/라디오', count: 0, color: '#3b82f6' },
      recording: { label: '🎵 녹음/레슨', count: 0, color: '#8b5cf6' },
      meeting: { label: '💼 미팅/회의', count: 0, color: '#64748b' }
    };

    allSchedules.forEach(s => {
      const cat = s.category || 'broadcast';
      if (catMap[cat]) catMap[cat].count++;
      else catMap.broadcast.count++;
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
            <div class="analytics-card-title"><span>📊 누적 총 스케줄</span> <span>📅</span></div>
            <div class="analytics-card-value">${totalCount}건</div>
            <div class="analytics-card-sub">완료 ${doneCount}건 (${completionRate}%)</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title"><span>🌟 활동 아티스트</span> <span>🎤</span></div>
            <div class="analytics-card-value">${artists.length}팀</div>
            <div class="analytics-card-sub">최다 스케줄: ${artistStats[0]?.name || '없음'} (${artistStats[0]?.count || 0}건)</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title"><span>🚗 운행 배차 차량</span> <span>🚘</span></div>
            <div class="analytics-card-value">${vehicles.length}대</div>
            <div class="analytics-card-sub">평균 가동률 85% 이상</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title"><span>👥 현장 지원 매니저</span> <span>👔</span></div>
            <div class="analytics-card-value">${managers.length}명</div>
            <div class="analytics-card-sub">전원 100% 배치 완료</div>
          </div>
        </div>

        <!-- 2 Column Section: Category Distribution & Artist Ranking -->
        <div class="analytics-two-col">
          
          <!-- Category Distribution -->
          <div class="analytics-section-card">
            <div class="analytics-section-header">
              <h4><span>📌</span> 카테고리별 활동 비율 분포</h4>
              <span style="font-size:12px; color:#94a3b8;">전체 ${totalCount}건 기준</span>
            </div>
            <div class="category-bar-group">
              ${Object.values(catMap).map(cat => {
      const pct = totalCount > 0 ? Math.round((cat.count / totalCount) * 100) : 0;
      return `
                  <div class="category-bar-item">
                    <div class="category-bar-label">
                      <span>${cat.label}</span>
                      <span>${cat.count}건 (${pct}%)</span>
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
              <h4><span>🏆</span> 소속 아티스트별 활동 수행 실적</h4>
              <span style="font-size:12px; color:#94a3b8;">월간 스케줄 건수</span>
            </div>
            <div class="category-bar-group">
              ${artistStats.map(a => {
      const pct = totalCount > 0 ? Math.round((a.count / totalCount) * 100) : 0;
      return `
                  <div class="category-bar-item">
                    <div class="category-bar-label">
                      <span>${a.emoji || '✨'} ${a.name} <span style="font-size:11px; color:#94a3b8;">(${a.type})</span></span>
                      <span>${a.count}건 (${pct}%)</span>
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
              <h4><span>📍</span> 최다 출동 현장 거점 Top 5</h4>
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
              <h4><span>👔</span> 담당 매니저별 현장 지원 현황</h4>
              <button type="button" onclick="Admin.exportExcel()" style="background:#10b981; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer;">📊 엑셀 다운로드</button>
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

      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #334155; padding-bottom:14px; margin-bottom:16px;">
        <div>
          <span style="background:${art ? art.color : '#6366f1'}; color:#fff; font-size:12px; padding:2px 8px; border-radius:4px; font-weight:600;">
            ${sch.artistName || '아티스트'}
          </span>
          <h2 style="font-size:20px; color:#fff; margin:8px 0 4px 0;">${sch.title}</h2>
          <div style="font-size:13px; color:#94a3b8;">📅 ${sch.date} (${sch.startTime} ~ ${sch.endTime})</div>
        </div>
        ${getStatusBadge(sch.status)}
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px; font-size:13px;">
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">📍 메인 장소:</span> <strong style="color:#f8fafc;">${sch.location || '미정'}</strong>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">👤 담당 매니저:</span> <strong style="color:#f8fafc;">${sch.managerName || '미배정'}</strong>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">🚗 배차 차량:</span> <strong style="color:#f8fafc;">${sch.vehicleName || '미배정'}</strong>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">💄 헤메 샵:</span> <strong style="color:#f8fafc;">${sch.shopLocation || (sch.shop?.name) || '미경유'}</strong>
        </div>
      </div>

      ${sch.notes ? `
        <div style="background:#1e293b; padding:12px; border-radius:8px; border:1px solid #334155; margin-bottom:16px;">
          <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">📝 현장 특이사항 / 메모</div>
          <div style="font-size:13px; color:#f8fafc; line-height:1.5;">${sch.notes}</div>
        </div>
      ` : ''}

      <div style="margin-top:16px;">
        <h4 style="font-size:14px; color:#f8fafc; margin-bottom:10px;">📋 스마트 역산 타임라인</h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;">
          ${(sch.timeline || []).map(item => `
            <div style="display:flex; gap:10px; align-items:center; background:#0f172a; padding:8px 12px; border-radius:6px; font-size:13px;">
              <span style="color:#38bdf8; font-weight:700; font-family:monospace;">${item.time}</span>
              <span style="color:${item.done ? '#10b981' : '#f8fafc'}; text-decoration:${item.done ? 'line-through' : 'none'};">${item.label}</span>
              ${item.done ? `
                <span style="margin-left:auto; font-size:11px; color:#10b981; font-weight:700; display:flex; align-items:center; gap:4px;">
                  ✓ 완료 ${item.doneAt ? `<span style="font-size:10px; opacity:0.8;">(${item.doneAt})</span>` : ''}
                </span>
              ` : (item.moving ? `
                <span style="margin-left:auto; font-size:11px; color:#f59e0b; font-weight:700;">🚗 이동중</span>
              ` : '')}
            </div>
          `).join('')}
        </div>
      </div>

      ${sch.statusLogs && sch.statusLogs.length > 0 ? `
        <div style="margin-top:16px; border-top:1px solid #334155; padding-top:14px;">
          <h4 style="font-size:14px; color:#f8fafc; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span>⏱️ 현장 실시간 타임스탬프 이력</span>
            <span style="font-size:11px; color:#64748b; font-weight:normal;">(총 ${sch.statusLogs.length}회 기록)</span>
          </h4>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:140px; overflow-y:auto;">
            ${sch.statusLogs.map(log => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.6); padding:6px 10px; border-radius:6px; font-size:12px; border-left:3px solid #6366f1;">
                <div style="color:#cbd5e1; font-weight:600;">
                  ${log.label}
                </div>
                <div style="font-size:11px; color:#94a3b8; font-family:monospace;">
                  ${log.time} (${log.managerName || '현장매니저'})
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;

    el.detailBodyContent.innerHTML = html;
    el.modalScheduleDetail.classList.add('active');
  }

  // ── 스케줄 등록/수정 모달 열기 ──
  function openScheduleFormModal(dateStr = null, editSch = null) {
    el.formSchedule.reset();
    if (editSch) {
      el.scheduleFormTitle.textContent = '✏️ 스케줄 정보 수정';
      el.formSchId.value = editSch.id;
      el.formTitle.value = editSch.title || '';
      el.formArtist.value = editSch.artistId || '';
      el.formCategory.value = editSch.category || 'broadcast';
      el.formDate.value = editSch.date || '';
      el.formStartTime.value = editSch.startTime || '10:00';
      el.formEndTime.value = editSch.endTime || '18:00';
      el.formManager.value = editSch.managerId || '';
      el.formVehicle.value = editSch.vehicleId || '';
      el.formLocation.value = editSch.location || '';
      el.formNotes.value = editSch.notes || '';
      el.formStatus.value = editSch.status || '예정';
      if (el.formIsSecret) el.formIsSecret.checked = editSch.isSecret || false;
    } else {
      el.scheduleFormTitle.textContent = '✨ 신규 스케줄 등록';
      el.formSchId.value = '';
      el.formDate.value = dateStr || fmtDate(state.currentDate);
      el.formStartTime.value = '10:00';
      el.formEndTime.value = '18:00';
      el.formStatus.value = '예정';
      if (el.formIsSecret) el.formIsSecret.checked = false;
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
      if (!cell || !cell.dataset.date || cell.classList.contains('empty')) {
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
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:8px; margin-bottom:10px;">
            <div style="font-size:14px; font-weight:800; color:#f8fafc;">
              📅 ${y}년 ${Number(m)}월 ${Number(d)}일 (${dayName})
            </div>
            <span style="background:rgba(99,102,241,0.2); color:#818cf8; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px;">
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
              style="background:#0f172a; border-radius:8px; padding:10px; border:1px solid #334155; border-left:4px solid ${artColor}; cursor:pointer; transition:all 0.15s ease;"
              onmouseover="this.style.background='#334155'; this.style.borderColor='#818cf8'; this.style.transform='translateY(-1px)';"
              onmouseout="this.style.background='#0f172a'; this.style.borderColor='#334155'; this.style.transform='none';">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span style="font-size:11px; font-weight:700; color:#60a5fa; font-family:monospace;">
                  ⏰ ${sch.startTime} ~ ${sch.endTime}
                </span>
                <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; ${sch.status === '진행중' || sch.status === '이동중' ? 'background:#10b981; color:#fff;' : 'background:rgba(255,255,255,0.1); color:#94a3b8;'}">
                  ${sch.status || '예정'}
                </span>
              </div>
              <div style="font-size:13px; font-weight:800; color:#f8fafc; margin-bottom:4px;">
                ${art?.emoji || '✨'} [${sch.artistName || '아티스트'}] ${sch.title}
              </div>
              <div style="font-size:11px; color:#94a3b8; display:flex; flex-direction:column; gap:2px;">
                <div>📍 ${sch.location || '장소 미지정'}</div>
                <div>👤 ${sch.managerName || '미배정'} | 🚗 ${sch.vehicleName || '차량 미지정'}</div>
              </div>
            </div>
          `;
        });

        popHtml += `</div>
          <div style="font-size:11px; color:#64748b; text-align:center; margin-top:8px; background:rgba(79,70,229,0.05); padding:6px; border-radius:6px; border:1px dashed rgba(79,70,229,0.2);">
            👆 <strong>원하는 일정을 클릭</strong>하시면 상세 정보 및 역산 동선을 확인할 수 있습니다.
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
      if (cell && cell.dataset.date && !cell.classList.contains('empty')) {
        openScheduleFormModal(cell.dataset.date);
      }
    });

    // 신규 스케줄 버튼
    el.btnOpenAddSchedule.addEventListener('click', () => {
      openScheduleFormModal();
    });

    // 아티스트 추가 버튼
    el.btnOpenAddArtist.addEventListener('click', () => {
      el.modalArtistForm.classList.add('active');
    });

    // 모달 닫기
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-close');
        const m = document.getElementById(modalId);
        if (m) m.classList.remove('active');
      });
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

      const schData = {
        id: schId,
        title: el.formTitle.value,
        artistId: el.formArtist.value,
        artistName: art ? art.name : '',
        category: el.formCategory.value,
        date: el.formDate.value,
        startTime: el.formStartTime.value,
        endTime: el.formEndTime.value,
        managerId: el.formManager.value,
        managerName: mgr ? mgr.name : '',
        vehicleId: el.formVehicle.value,
        vehicleName: veh ? veh.name : '',
        location: el.formLocation.value,
        status: el.formStatus.value,
        notes: el.formNotes.value,
        isSecret: el.formIsSecret ? el.formIsSecret.checked : false,
        secretLevel: (el.formIsSecret && el.formIsSecret.checked) ? 'confidential' : 'public',
        shop: {
          needed: el.formShopNeeded.checked,
          name: el.formShopName.value,
          durationMin: Number(el.formShopDuration.value) || 90,
          address: el.formShopAddress.value
        },
        departure: {
          place: el.formDeparturePlace.value
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

          const proceed = confirm(`⚠️ [배차/일정 중복 경고]\n\n${warnMsgs}\n\n동일 시간대 중복 배차가 발생합니다. 그래도 스케줄을 저장하시겠습니까?`);
          if (!proceed) {
            return; // 저장 취소
          }
        }
      }

      await window.hqStore.saveSchedule(schData);
      el.modalScheduleForm.classList.remove('active');
      await renderSidebar();
      await renderKPI();
      await renderCurrentView();
    });

    // 스케줄 수정 버튼
    el.btnEditSchedule.addEventListener('click', async () => {
      const schedules = await window.hqStore.getSchedules();
      const sch = schedules.find(s => s.id === state.activeScheduleId);
      if (sch) {
        el.modalScheduleDetail.classList.remove('active');
        openScheduleFormModal(null, sch);
      }
    });

    // 스케줄 삭제 버튼
    el.btnDeleteSchedule.addEventListener('click', async () => {
      if (confirm('이 스케줄을 삭제하시겠습니까? 매니저플래너에서도 즉시 삭제됩니다.')) {
        await window.hqStore.deleteSchedule(state.activeScheduleId);
        el.modalScheduleDetail.classList.remove('active');
        await renderSidebar();
        await renderKPI();
        await renderCurrentView();
      }
    });

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
        const emailId = document.getElementById('new-mgr-email-id').value.trim();
        const emailDomain = document.getElementById('new-mgr-email-domain').textContent.trim();
        const email = emailId + emailDomain;
        const pw = document.getElementById('new-mgr-pw').value.trim();
        const phone = document.getElementById('new-mgr-phone').value.trim();

        if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
          try {
            await window.SupabaseClient.signUp(email, pw, name, 'manager', phone);
            alert(`✅ [Supabase] ${name} 매니저 계정이 생성되었습니다.`);
          } catch (err) {
            alert('계정 생성 오류: ' + err.message);
            return;
          }
        } else {
          await window.hqStore.addManager({
            id: 'mgr_' + Date.now(),
            name,
            email,
            phone,
            role: 'manager',
            assignedArtists: []
          });
          alert(`✅ [로컬] ${name} 매니저 계정이 등록되었습니다.`);
        }

        el.formCreateManager.reset();
        window.Admin.updateManagerSlotUI();
        await window.Admin.renderManagerManagementList();
        await populateSelectOptions();
        await renderSidebar();
      });
    }

    // 아티스트 추가 폼 제출
    el.formArtistAdd.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newArt = {
        id: 'art_' + Date.now(),
        name: document.getElementById('new-artist-name').value,
        type: document.getElementById('new-artist-type').value,
        members: Number(document.getElementById('new-artist-members').value) || 1,
        color: document.getElementById('new-artist-color').value,
        emoji: document.getElementById('new-artist-emoji').value || '✨',
        status: '활동중'
      };

      await window.hqStore.addArtist(newArt);
      el.modalArtistForm.classList.remove('active');
      await populateSelectOptions();
      await renderSidebar();
    });

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
