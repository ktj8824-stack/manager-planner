/* ===================================================
   HQ Enterprise Master Scheduler ??Interactive Controller
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
      alert('URLê³?Anon Keyë¥?ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”.');
      return;
    }
    try {
      window.SupabaseClient.setConfig(url, key);
      alert('??Supabase ?´ë¼?°ë“œ DB?€ ?°ê²°?˜ì—ˆ?µë‹ˆ??');
      document.getElementById('modal-supabase-config').classList.remove('active');
      window.Admin.updateSupabaseBadge();
      window.location.reload();
    } catch (e) {
      alert('?°ê²° ?¤íŒ¨: ' + e.message);
    }
  },

  resetSupabaseConfig() {
    if (confirm('Supabase ?¤ì •??ì´ˆê¸°?”í•˜ê³?ë¸Œë¼?°ì? ë¡œì»¬ ?°ì´??ëª¨ë“œë¡??„í™˜?˜ì‹œê² ìŠµ?ˆê¹Œ?')) {
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
      text.textContent = '?´ë¼?°ë“œ ?™ê¸°??ì¤?(Supabase)';
      text.style.color = '#34d399';
      badge.style.borderColor = '#059669';
    } else {
      dot.style.background = '#94a3b8';
      dot.style.boxShadow = 'none';
      text.textContent = 'ë¡œì»¬ ëª¨ë“œ (?¤ì •)';
      text.style.color = '#94a3b8';
      badge.style.borderColor = '#334155';
    }
  },

  updateRoleBadge() {
    const persona = window.AuthPersona ? window.AuthPersona.getCurrentUser() : { name: '?ê¸¸???€??, shortBadge: '?‘‘ CEO', color: '#f59e0b', badge: '?‘‘ ?€??(CEO)' };
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
    if (confirm('ë¡œê·¸?„ì›ƒ ?˜ì‹œê² ìŠµ?ˆê¹Œ?')) {
      if (window.AuthPersona) {
        window.AuthPersona.logout('admin-login.html');
      } else {
        localStorage.removeItem('bp_user_role');
        localStorage.removeItem('bp_user_name');
        localStorage.removeItem('bp_user_email');
        localStorage.removeItem('bp_company_name');
        localStorage.removeItem('bp_manager_id');
        localStorage.removeItem('bp_assigned_artists');
        localStorage.removeItem('bp_logged_in');
        localStorage.removeItem('bp_manager_filter');

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
          ? `<span style="background:${r.color}; color:#fff; font-size:11px; font-weight:800; padding:5px 10px; border-radius:20px;">? íƒ????/span>`
          : '<span style="color:#64748b; font-size:12px; font-weight:700;">?„í™˜ ??/span>'}
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
      selectEl.innerHTML = '<option value="ALL">?„ì²´ ë§¤ë‹ˆ?€ ê³µì?</option>';
      managers.forEach(m => {
        selectEl.innerHTML += `<option value="${m.id}">${m.name} (${m.phone})</option>`;
      });
    }
    const form = document.getElementById('form-send-message');
    if (form) form.reset();
    const modal = document.getElementById('modal-send-message');
    if (modal) modal.classList.add('active'); // modal.style.display = 'flex' ?€??active ?´ë˜???¬ìš©
  },

  closeSendMsgModal() {
    const modal = document.getElementById('modal-send-message');
    if (modal) modal.classList.remove('active');
  },

  async submitSendMessage(e) {
    if (e) e.preventDefault();
    const targetSelect = document.getElementById('msg-target-manager');
    const titleInput = document.getElementById('msg-title');
    const contentInput = document.getElementById('msg-content');
    const urgentCheck = document.getElementById('msg-is-urgent');

    const targetVal = targetSelect ? targetSelect.value : 'ALL';
    const targetText = targetSelect && targetSelect.selectedIndex >= 0 ? targetSelect.options[targetSelect.selectedIndex].text : '?„ì²´';
    const title = titleInput ? titleInput.value.trim() : 'ë³¸ì‚¬ ê³µì??¬í•­';
    const content = contentInput ? contentInput.value.trim() : '';
    const isUrgent = urgentCheck ? urgentCheck.checked : false;

    if (!content) {
      alert('ê³µì? ?´ìš©???…ë ¥?´ì£¼?¸ìš”.');
      return;
    }

    const payload = {
      id: 'noti_' + Date.now(),
      title: title || (isUrgent ? '?š¨ [ê¸´ê¸‰ ë³¸ì‚¬ ê³µì?]' : '?“¢ [ë³¸ì‚¬ ê³µì??¬í•­]'),
      content: content,
      isUrgent: isUrgent,
      target: targetVal,
      targetText: targetText,
      sender: localStorage.getItem('bp_user_name') || 'ë³¸ì‚¬ ê´€?œí?',
      createdAt: new Date().toISOString()
    };

    // 1. Supabase Cloud DB & Realtime ?„ì†¡
    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        await window.SupabaseClient.createAnnouncement({
          title: payload.title,
          content: payload.content,
          is_urgent: payload.isUrgent,
          target_role: targetVal === 'ALL' ? 'all' : 'manager',
          sender_name: payload.sender
        });
      } catch (err) {
        console.warn('Supabase createAnnouncement error:', err);
      }
    }

    // 2. BroadcastChannel ?„ì†¡ (?™ì¼ ë¸Œë¼?°ì? ë°??œì„± ??
    try {
      if (window.hqStore && window.hqStore.broadcast) {
        window.hqStore.broadcast.postMessage({
          type: 'NEW_HQ_MESSAGE',
          payload: payload
        });
      }
    } catch(e) {
      console.warn('BroadcastChannel postMessage error:', e);
    }

    // 3. ë¡œì»¬ ?Œë¦¼ ?´ì—­ ë³´ê?
    try {
      const history = JSON.parse(localStorage.getItem('HQ_ANNOUNCEMENT_HISTORY') || '[]');
      history.unshift(payload);
      localStorage.setItem('HQ_ANNOUNCEMENT_HISTORY', JSON.stringify(history.slice(0, 50)));
    } catch(e) {}

    this.closeSendMsgModal();
    alert(`?“¢ [${targetText}] ?Œë¦¼???„ì¥ ë§¤ë‹ˆ?€?ê²Œ ?¤ì‹œê°?ë°œì†¡?˜ì—ˆ?µë‹ˆ??`);
  },

  async openManagerModal() {
    const modal = document.getElementById('modal-manager-management');
    if (!modal) return;
    this.updateManagerSlotUI();

    // ?€?œì(ë¡œê·¸??? ì?) ?„ë©”??ì¶”ì¶œ?˜ì—¬ ?¼ì— ë°˜ì˜
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

  async openArtistManageModal() {
    const modal = document.getElementById('modal-artist-management');
    if (!modal) return;
    await this.renderArtistManagementList();
    modal.classList.add('active');
  },

  async renderArtistManagementList() {
    const container = document.getElementById('artist-mgmt-list');
    if (!container) return;

    const artists = await window.hqStore.getArtists();

    container.innerHTML = artists.map(art => {
      return `
        <div style="background:#1e293b; border-radius:8px; padding:12px; border:1px solid #334155; display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:36px; height:36px; border-radius:8px; background:${art.color}; display:flex; align-items:center; justify-content:center; font-size:18px; overflow:hidden;">
              ${art.image ? `<img src="${art.image}" style="width:100%;height:100%;object-fit:cover;">` : (art.emoji || '??)}
            </div>
            <div>
              <div style="color:#f8fafc; font-size:15px; font-weight:700;">${art.name}</div>
              <div style="color:#94a3b8; font-size:12px; margin-top:2px;">${art.type} Â· ${art.members || 1}ëª?/div>
            </div>
          </div>
          <div>
            <button type="button" onclick="Admin.openCareInfoModal('${art.id}')" style="background:transparent; border:1px solid rgba(245,158,11,0.3); color:#f59e0b; font-size:12px; cursor:pointer; padding:4px 10px; border-radius:4px; margin-right:6px; transition:all 0.2s;">ì¼€???•ë³´</button>
            <button type="button" onclick="Admin.editArtist('${art.id}')" style="background:transparent; border:1px solid rgba(59,130,246,0.3); color:#3b82f6; font-size:12px; cursor:pointer; padding:4px 10px; border-radius:4px; margin-right:6px; transition:all 0.2s;">?˜ì •</button>
            <button type="button" onclick="Admin.deleteArtist('${art.id}', true)" style="background:transparent; border:1px solid rgba(239,68,68,0.3); color:#ef4444; font-size:12px; cursor:pointer; padding:4px 10px; border-radius:4px; transition:all 0.2s;">?? œ</button>
          </div>
        </div>
      `;
    }).join('');
  },

  async openCareInfoModal(artistId) {
    const artists = await window.hqStore.getArtists();
    const artist = artists.find(a => a.id === artistId);
    if (!artist) return;

    const careInfo = artist.care_info || {};

    const html = `
      <div style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label style="display:block; font-size:13px; color:#94a3b8; margin-bottom:4px;">?š« ?ŒëŸ¬ì§€ / ì£¼ì˜?¬í•­</label>
          <input type="text" id="care-allergies" value="${careInfo.allergies || ''}" style="width:100%; padding:10px; border-radius:6px; background:#0f172a; border:1px solid #334155; color:#f8fafc;" placeholder="?? ë³µìˆ­?? ê°‘ê°ë¥??ŒëŸ¬ì§€">
        </div>
        <div>
          <label style="display:block; font-size:13px; color:#94a3b8; margin-bottom:4px;">??? í˜¸ ?ìŒë£?(ì¼€?´í„°ë§?</label>
          <input type="text" id="care-beverages" value="${careInfo.beverages || ''}" style="width:100%; padding:10px; border-radius:6px; background:#0f172a; border:1px solid #334155; color:#f8fafc;" placeholder="?? ?????¼ìŒ ë§ì´), ?ëŸ¬??>
        </div>
        <div>
          <label style="display:block; font-size:13px; color:#94a3b8; margin-bottom:4px;">?š™ ì°¨ëŸ‰ ?¸íŒ…</label>
          <input type="text" id="care-vehicle" value="${careInfo.vehicle_pref || ''}" style="width:100%; padding:10px; border-radius:6px; background:#0f172a; border:1px solid #334155; color:#f8fafc;" placeholder="?? ì¡°ìˆ˜??? í˜¸, ?ì–´ì»??½í•˜ê²?>
        </div>
        <div>
          <label style="display:block; font-size:13px; color:#94a3b8; margin-bottom:4px;">?’Š ë¹„ìƒ ?½í’ˆ ë°?ë©”ëª¨</label>
          <input type="text" id="care-emergency" value="${careInfo.emergency || ''}" style="width:100%; padding:10px; border-radius:6px; background:#0f172a; border:1px solid #334155; color:#f8fafc;" placeholder="?? ?Œë ˆë¥´ê¸° ???Œìš°ì¹??„ì¹˜">
        </div>
        <div>
          <label style="display:block; font-size:13px; color:#94a3b8; margin-bottom:4px;">?“ ?„ë‹´ ?¤íƒœ???°ë½ì²?/label>
          <input type="text" id="care-contacts" value="${careInfo.contacts || ''}" style="width:100%; padding:10px; border-radius:6px; background:#0f172a; border:1px solid #334155; color:#f8fafc;" placeholder="?? ?¤ì–´: 010-..., ë©”ì´?¬ì—…: 010-...">
        </div>
        <button class="btn btn-primary" style="margin-top:10px; background:linear-gradient(135deg, #10b981, #059669);" onclick="Admin.saveCareInfo('${artist.id}')">?’¾ ì¼€???•ë³´ ?€??/button>
      </div>
    `;

    // Reusing the modal-schedule-detail container for custom content
    const modal = document.getElementById('modal-schedule-detail');
    const content = document.getElementById('detail-body-content');
    if (modal && content) {
      modal.style.zIndex = '10005'; // ?„í‹°?¤íŠ¸ ?µí•© ê´€ë¦?ëª¨ë‹¬ë³´ë‹¤ ?„ì— ?œì‹œ?˜ë„ë¡?z-index ?¬ë¦¼
      content.innerHTML = `<h3 style="color:#fff; margin-bottom:15px; font-size:18px;">${artist.emoji || '??} ${artist.name} ì¼€???•ë³´ (Rider Card)</h3>` + html;
      modal.classList.add('active');
    }
  },

  async saveCareInfo(artistId) {
    const careInfo = {
      allergies: document.getElementById('care-allergies').value.trim(),
      beverages: document.getElementById('care-beverages').value.trim(),
      vehicle_pref: document.getElementById('care-vehicle').value.trim(),
      emergency: document.getElementById('care-emergency').value.trim(),
      contacts: document.getElementById('care-contacts').value.trim()
    };

    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        await window.SupabaseClient.updateArtistCareInfo(artistId, careInfo);
        
        // Update local memory
        const artists = await window.hqStore.getArtists();
        const idx = artists.findIndex(a => a.id === artistId);
        if (idx !== -1) {
          artists[idx].care_info = careInfo;
          window.hqStore.saveArtists(artists);
        }
        
        alert('?„í‹°?¤íŠ¸ ì¼€???•ë³´ê°€ ?€?¥ë˜?ˆìŠµ?ˆë‹¤.');
        document.getElementById('modal-schedule-detail').classList.remove('active');
        setTimeout(() => { document.getElementById('modal-schedule-detail').style.zIndex = ''; }, 300);
      } catch (err) {
        alert('?€???¤íŒ¨: ' + err.message);
      }
    } else {
      // Local mode
      const artists = await window.hqStore.getArtists();
      const idx = artists.findIndex(a => a.id === artistId);
      if (idx !== -1) {
        artists[idx].care_info = careInfo;
        window.hqStore.saveArtists(artists);
      }
      alert('ë¡œì»¬ ëª¨ë“œ: ì¼€???•ë³´ê°€ ?€?¥ë˜?ˆìŠµ?ˆë‹¤.');
      document.getElementById('modal-schedule-detail').classList.remove('active');
      setTimeout(() => { document.getElementById('modal-schedule-detail').style.zIndex = ''; }, 300);
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
      badge.textContent = `?¬ë¡¯: ${sub.activeManagerCount} / ${sub.totalSlots}??(${sub.availableSlots}???”ì—¬)`;
      badge.style.background = sub.isFull ? 'rgba(239,68,68,0.2)' : 'rgba(99,102,241,0.2)';
      badge.style.color = sub.isFull ? '#fca5a5' : '#c7d2fe';
    }

    if (warning) {
      warning.style.display = sub.isFull ? 'inline' : 'none';
    }

    if (submitBtn) {
      if (sub.isFull) {
        submitBtn.textContent = '?’³ ?¬ë¡¯ ì¶”ê? ê²°ì œ ???ì„±';
        submitBtn.style.background = 'linear-gradient(135deg, #ef4444, #f59e0b)';
      } else {
        submitBtn.textContent = 'ë§¤ë‹ˆ?€ ê³„ì • ?ì„±';
        submitBtn.style.background = '#6366f1';
      }
    }

    this.updateHeaderSubscriptionBadge();
  },

  updateHeaderSubscriptionBadge() {
    const sub = window.hqStore.getSubscription();
    const badgeText = document.getElementById('sub-badge-text');
    if (badgeText) {
      badgeText.textContent = `êµ¬ë…: Standard (${sub.activeManagerCount}/${sub.totalSlots}ëª?Â· ??${(sub.monthlyFee / 10000).toLocaleString()}ë§?`;
    }
  },

  // ?€?€ ?’³ ?Œì‚¬ êµ¬ë… ëª¨ë‹¬ ì»¨íŠ¸ë¡¤ëŸ¬ ?€?€
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
    if (bizInfoEl) bizInfoEl.textContent = `?¬ì—…?ë²ˆ?? ${sub.bizNumber} | ?€?œì: ${sub.ceoName}`;
    if (monthlyTotalEl) monthlyTotalEl.textContent = `??${totalFee.toLocaleString()}??;
    if (slotProgressText) slotProgressText.textContent = `${sub.activeManagerCount} / ${totalSlots}??(${Math.max(0, totalSlots - sub.activeManagerCount)}???”ì—¬)`;
    if (slotProgressBar) slotProgressBar.style.width = `${usedPct}%`;
    if (additionalSlotCount) additionalSlotCount.textContent = `${addSlots}ëª?;
    if (calcAdditionalFee) calcAdditionalFee.textContent = `+ ${addFee.toLocaleString()}??/ ??;
    if (calcTotalFee) calcTotalFee.textContent = `??${totalFee.toLocaleString()}??(VAT ë³„ë„)`;
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
    alert(`?‰ ?Œì‚¬ êµ¬ë… ?¬ë¡¯???±ê³µ?ìœ¼ë¡?ë³€ê²½ë˜?ˆìŠµ?ˆë‹¤!\n\n??ì´?ë§¤ë‹ˆ?€ ?¬ë¡¯: ${(sub.baseSlots || 2) + this.tempAdditionalSlots}??n??ë³€ê²½ëœ ??ì²?µ¬?? ??${totalFee.toLocaleString()}??(VAT ë³„ë„)\n??ê²°ì œ ?˜ë‹¨: ${sub.paymentMethod}`);

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
              <span style="font-size:11px; background:#334155; color:#94a3b8; padding:2px 6px; border-radius:4px;">${mgr.role === 'hq_admin' ? 'ë³¸ì‚¬ ê´€ë¦¬ì' : '?„ì¥ ë§¤ë‹ˆ?€'}</span>
            </div>
            <div style="display:flex; align-items:center; gap:12px;">
              <span style="font-size:12px; color:#94a3b8;">${mgr.email || ''}</span>
              <span style="font-size:12px; color:#64748b;">${mgr.phone || '?°ë½ì²??†ìŒ'}</span>
              ${mgr.role !== 'hq_admin' ? `<button type="button" onclick="Admin.deleteManager('${mgr.id}')" style="background:transparent; border:none; color:#ef4444; font-size:12px; cursor:pointer; padding:4px; margin-left:-4px;">?? œ</button>` : ''}
            </div>
          </div>
          <div style="font-size:12px; color:#94a3b8; margin-bottom:6px;">?´ë‹¹ ?„í‹°?¤íŠ¸ ? íƒ:</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${artists.map(art => {
        const isChecked = assigned.includes(art.id);
        return `
                <button type="button" 
                  onclick="Admin.toggleArtistAssignment('${mgr.id}', '${art.id}')"
                  style="padding:4px 8px; border-radius:6px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.2s; border:1px solid ${isChecked ? art.color : '#334155'}; background:${isChecked ? art.color + '22' : '#0f172a'}; color:${isChecked ? '#fff' : '#64748b'};">
                  ${art.emoji || '??} ${art.name} ${isChecked ? '?? : '+'}
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
    if (confirm('?´ë‹¹ ë§¤ë‹ˆ?€ë¥??? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?\në§¤ë‹ˆ?€ê°€ ?? œ?˜ë©´ ??ë¡œê·¸?¸ì´ ì°¨ë‹¨?˜ë©° ?´ë‹¹ ë°°ì°¨ ?´ì—­?ë„ ?í–¥??ì¤????ˆìŠµ?ˆë‹¤.')) {
      await window.hqStore.deleteManager(id);
      this.updateManagerSlotUI();
      await this.renderManagerManagementList();
      await populateSelectOptions();
      await renderSidebar();
      alert('ë§¤ë‹ˆ?€ ê³„ì •???? œ?˜ì—ˆ?µë‹ˆ??');
    }
  },

  async deleteArtist(id, fromModal = false) {
    if (confirm('?´ë‹¹ ?„í‹°?¤íŠ¸ë¥??? œ?˜ì‹œê² ìŠµ?ˆê¹Œ?\nê´€?¨ëœ ?¤ì?ì¤„ì´ ëª¨ë‘ ? ì??˜ì?ë§??¬ì´?œë°” ë°??„í„°?ì„œ ?? œ?©ë‹ˆ??')) {
      await window.hqStore.deleteArtist(id);
      await populateSelectOptions();
      await renderSidebar();
      if (fromModal) {
        await this.renderArtistManagementList();
      }
      alert('?„í‹°?¤íŠ¸ê°€ ?? œ?˜ì—ˆ?µë‹ˆ??');
    }
  },

  async editArtist(artistId) {
    const artists = await window.hqStore.getArtists();
    const art = artists.find(a => a.id === artistId);
    if (!art) return;

    // ëª¨ë‹¬ ?€?´í? ë°??ì„± ë³€ê²?
    const formTitle = document.querySelector('#modal-artist-form h3');
    if (formTitle) formTitle.textContent = '?„í‹°?¤íŠ¸ ?˜ì •';
    
    document.getElementById('new-artist-name').value = art.name || '';
    document.getElementById('new-artist-type').value = art.type || '';
    document.getElementById('new-artist-members').value = art.members || 1;
    document.getElementById('new-artist-color').value = art.color || '#6366f1';
    document.getElementById('new-artist-image').value = art.image || '';

    const form = document.getElementById('form-artist-add');
    form.dataset.editId = artistId; // ?˜ì • ëª¨ë“œ ?œì‹œ

    // ???œì¶œ ë²„íŠ¼ ?ìŠ¤??ë³€ê²?
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = '?˜ì • ?„ë£Œ';

    document.getElementById('modal-artist-form').classList.add('active');
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
    if (sch.status === '?´ë™ì¤? || sch.status === 'in_progress') statusCls = 'moving';
    if (sch.status === '?µì§„??) statusCls = 'shop';
    if (sch.status === '?„ë£Œ' || sch.status === 'completed') statusCls = 'done';

    let html = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #e2e8f0; padding-bottom:14px; margin-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span style="background:${art ? art.color : '#4f46e5'}; color:#fff; font-size:12px; padding:2px 8px; border-radius:4px; font-weight:600;">
              ${sch.artistName || '?„í‹°?¤íŠ¸'}
            </span>
            ${sch.isSecret ? '<span style="background:#fee2e2; color:#dc2626; font-size:11px; padding:2px 8px; border-radius:4px; font-weight:800; border:1px solid #fca5a5;">?”’ ê·¹ë¹„ ë³´ì•ˆ ?¤ì?ì¤?/span>' : ''}
          </div>
          <h2 style="font-size:20px; color:#0f172a; margin:4px 0;">${sch.title}</h2>
          <div style="font-size:13px; color:#64748b;">?“… ${sch.date} (${sch.startTime} ~ ${sch.endTime})</div>
        </div>
        <span class="badge-status ${statusCls}">${sch.status || '?ˆì •'}</span>
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px; font-size:13px;">
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?“ ë©”ì¸ ?¥ì†Œ:</span> <strong style="color:#0f172a;">${sch.location || 'ë¯¸ì •'}</strong>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?‘¤ ?´ë‹¹ ë§¤ë‹ˆ?€:</span> <strong style="color:#0f172a;">${sch.managerName || 'ë¯¸ë°°??}</strong>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?š— ë°°ì°¨ ì°¨ëŸ‰:</span> <strong style="color:#0f172a;">${sch.vehicleName || 'ë¯¸ë°°??}</strong>
        </div>
        <div style="background:var(--bg-surface); border:1px solid var(--border-color); padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?’„ ?¤ë©” ??</span> <strong style="color:#0f172a;">${sch.shopLocation || (sch.shop?.name) || 'ë¯¸ê²½??}</strong>
        </div>
      </div>

      ${sch.notes ? `
        <div style="background:var(--bg-card); padding:12px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:16px;">
          <div style="font-size:12px; color:#64748b; margin-bottom:4px;">?“ ?„ì¥ ?¹ì´?¬í•­ / ë©”ëª¨</div>
          <div style="font-size:13px; color:#0f172a; line-height:1.5;">${sch.notes}</div>
        </div>
      ` : ''}

      <div style="margin-top:16px;">
        <h4 style="font-size:14px; color:#0f172a; margin-bottom:10px;">?“‹ ?¤ë§ˆ????‚° ?€?„ë¼??/h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;">
          ${(sch.timeline || []).map(item => `
            <div style="display:flex; gap:10px; align-items:center; background:var(--bg-surface); border:1px solid var(--border-color); padding:8px 12px; border-radius:6px; font-size:13px;">
              <span style="color:#0284c7; font-weight:700; font-family:monospace;">${item.time}</span>
              <span style="color:${item.done ? '#10b981' : '#0f172a'}; text-decoration:${item.done ? 'line-through' : 'none'};">${item.label}</span>
              ${item.done ? '<span style="margin-left:auto; font-size:11px; color:#10b981;">???„ë£Œ</span>' : ''}
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

  // ?€?€ Helper Utilities ?€?€
  const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getStatusBadge = (status) => {
    let cls = 'ready';
    if (status === '?´ë™ì¤? || status === 'in_progress') cls = 'moving';
    if (status === '?µì§„??) cls = 'shop';
    if (status === '?„ë£Œ' || status === 'completed') cls = 'done';
    return `<span class="badge-status ${cls}">${status}</span>`;
  };

  function bindKPIHoverEvents() {
    const kpiPopover = document.getElementById('kpi-hover-popover');
    if (!kpiPopover) return;

    let kpiHideTimer = null;

    // ?ì˜¤ë²??ì²´ë¡?ë§ˆìš°?¤ê? ?˜ì–´ê°”ì„ ???«íˆì§€ ?Šë„ë¡??€?´ë¨¸ ì·¨ì†Œ
    kpiPopover.addEventListener('mouseenter', () => {
      if (kpiHideTimer) clearTimeout(kpiHideTimer);
    });

    // ?ì˜¤ë²„ì—??ë§ˆìš°?¤ê? ?˜ê?ë©??«ê¸°
    kpiPopover.addEventListener('mouseleave', () => {
      kpiHideTimer = setTimeout(() => {
        kpiPopover.style.opacity = '0';
        setTimeout(() => { if (kpiPopover.style.opacity === '0') kpiPopover.style.display = 'none'; }, 150);
      }, 100);
    });

    const cards = [
      { id: 'kpi-card-today', key: 'today', title: '?¤ëŠ˜ ì´??¤ì?ì¤?, color: '#6366f1' },
      { id: 'kpi-card-active', key: 'active', title: 'ì§„í–‰ì¤?/ ?´ë™ì¤??¤ì?ì¤?, color: '#f59e0b' },
      { id: 'kpi-card-shop', key: 'shop', title: '?¤ë©”??ê²½ìœ  ?¤ì?ì¤?, color: '#ec4899' }
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
            <span>${c.title} <span style="background:${c.color}; color:#fff; padding:2px 6px; border-radius:10px; font-size:11px; margin-left:4px;">${schedules.length}ê±?/span></span>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:220px; overflow-y:auto; padding-right:4px;">
        `;

        schedules.forEach(sch => {
          popHtml += `
            <div class="kpi-popover-item" data-id="${sch.id}" style="background:#0f172a; padding:10px; border-radius:6px; cursor:pointer; font-size:12px; border:1px solid #334155;" onmouseenter="this.style.borderColor='${c.color}'" onmouseleave="this.style.borderColor='#334155'">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span style="font-weight:700; color:#60a5fa;">??${sch.startTime} ~ ${sch.endTime || ''}</span>
              </div>
              <div style="font-weight:700; color:#fff; margin-bottom:4px; font-size:13px;">??[${sch.artistName}] ${sch.title}</div>
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

  // ?€?€ Init ?€?€
  async function init() {
    // ?›¡ï¸?Auth & Role Guard
    const isLoggedIn = localStorage.getItem('bp_logged_in') === 'true';
    const role = window.AuthPersona ? window.AuthPersona.getCurrentRole() : 'manager';

    if (!isLoggedIn) {
      alert('ë³¸ì‚¬ ê´€???¬í„¸ ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??');
      window.location.href = 'admin-login.html';
      return;
    }

    if (role === 'manager' || role === 'staff') {
      alert('ê¶Œí•œ???†ìŠµ?ˆë‹¤. (HQ ê´€ë¦¬ì ?ëŠ” CEO ?„ìš© ?˜ì´ì§€?…ë‹ˆ??');
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

    // Supabase Realtime êµ¬ë…
    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      window.SupabaseClient.subscribeToSchedules(() => {
        renderSidebar();
        renderKPI();
        renderCurrentView();
      });
    }

    // BroadcastChannel ë¡œì»¬ ?¤ì‹œê°?ë¦¬ìŠ¤??
    window.hqStore.broadcast.onmessage = () => {
      renderSidebar();
      renderKPI();
      renderCurrentView();
    };

    const btnInnerAddArtist = document.getElementById('btn-inner-add-artist');
    if (btnInnerAddArtist) {
      btnInnerAddArtist.addEventListener('click', () => {
        const addModal = document.getElementById('modal-artist-form');
        if (addModal) addModal.classList.add('active');
      });
    }
  }

  // ?€?€ Select Options ì±„ìš°ê¸??€?€
  async function populateSelectOptions() {
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const vehicles = await window.hqStore.getVehicles();

    // ?„í‹°?¤íŠ¸ select
    el.formArtist.innerHTML = artists.map(a => `<option value="${a.id}">${a.emoji || '??} ${a.name}</option>`).join('');

    // ë§¤ë‹ˆ?€ select
    el.formManager.innerHTML = managers.map(m => `<option value="${m.id}">${m.name} (${m.phone || 'ë¡œë“œ'})</option>`).join('');

    // ì°¨ëŸ‰ select
    el.formVehicle.innerHTML = vehicles.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
  }

  // ?€?€ ?¬ì´?œë°” ?Œë”ë§??€?€
  async function renderSidebar() {
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const schedules = await window.hqStore.getSchedules();

    // 1. ?„í‹°?¤íŠ¸ ì¹?ëª©ë¡
    let artistHtml = `
      <div class="artist-chip ${state.selectedArtistFilter === 'ALL' ? 'active' : ''}" data-artist-id="ALL">
        <div class="chip-left" style="display:flex; align-items:center; gap:8px;">
          <div class="artist-avatar" style="background:#6366f1;">?¢</div>
          <div class="artist-meta">
            <div class="name">?„ì²´ ?Œì† ?„í‹°?¤íŠ¸</div>
            <div class="sub">?µí•© ìº˜ë¦°??ëª¨ë“œ</div>
          </div>
        </div>
        <div class="chip-right" style="display:flex; align-items:center;">
          <span class="count-badge">${schedules.length}</span>
        </div>
      </div>
    `;

    artists.forEach(art => {
      const count = schedules.filter(s => s.artistId === art.id).length;
      const isSel = state.selectedArtistFilter === art.id;
      artistHtml += `
        <div class="artist-chip ${isSel ? 'active' : ''}" data-artist-id="${art.id}">
          <div class="chip-left" style="display:flex; align-items:center; gap:10px; flex:1;">
            <div class="artist-avatar" style="background:${art.color}; overflow:hidden; display:flex; align-items:center; justify-content:center;">${art.image ? `<img src="${art.image}" style="width:100%;height:100%;object-fit:cover;">` : (art.emoji || '??)}</div>
            <div class="artist-meta">
              <div class="name">${art.name}</div>
              <div class="sub">${art.type} Â· ${art.status}</div>
            </div>
          </div>
          <div class="chip-right" style="display:flex; align-items:center; justify-content:flex-end; gap:8px;">
            <span class="count-badge">${count}</span>
          </div>
        </div>
      `;
    });
    el.artistFilterList.innerHTML = artistHtml;

    // 2. ë§¤ë‹ˆ?€ ?íƒœ ëª©ë¡
    let mgrHtml = '';
    managers.forEach(mgr => {
      mgrHtml += `
        <div class="artist-chip" style="cursor:default;">
          <div class="artist-avatar" style="background:${mgr.color || '#6366f1'}; font-size:12px;">?‘¤</div>
          <div class="artist-meta">
            <div class="name">${mgr.name}</div>
            <div class="sub">${mgr.phone || '?°ë½ì²??†ìŒ'}</div>
          </div>
          <span style="font-size:11px; color:#10b981; font-weight:600;">?¨ë¼??/span>
        </div>
      `;
    });
    if (el.managerStatusList) {
      el.managerStatusList.innerHTML = mgrHtml;
    }
  }

  // ?€?€ KPI ?µê³„ ?Œë”ë§??€?€
  async function renderKPI() {
    const schedules = await window.hqStore.getSchedules();
    const artists = await window.hqStore.getArtists();
    const todayStr = fmtDate(new Date());

    const todaySchedules = schedules.filter(s => s.date === todayStr);
    const activeSchedules = todaySchedules.filter(s => s.status === '?´ë™ì¤? || s.status === '?µì§„?? || s.status === 'ì§„í–‰ì¤? || s.status === 'in_progress');
    const shopSchedules = todaySchedules.filter(s => s.shopLocation || (s.shop && s.shop.needed));

    kpiDataCache.today = todaySchedules;
    kpiDataCache.active = activeSchedules;
    kpiDataCache.shop = shopSchedules;

    el.kpiTodayCount.textContent = `${todaySchedules.length}ê±?;
    el.kpiActiveCount.textContent = `${activeSchedules.length}ê±?;
    el.kpiShopCount.textContent = `${shopSchedules.length}ê±?;
    el.kpiArtistCount.textContent = `${artists.length}?€`;
  }

  // ?€?€ ë·??Œë”ë§??¼ìš°???€?€
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

  // ?€?€ 1. ?”ê°„ ìº˜ë¦°??ë·?(Month View) ?€?€
  async function renderMonthView() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    el.calendarTitle.textContent = `${year}??${month + 1}??;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0(?? ~ 6(??
    const totalDays = lastDay.getDate();

    let allSchedules = await window.hqStore.getSchedules();
    if (state.selectedArtistFilter !== 'ALL') {
      allSchedules = allSchedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();

    let html = `
      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:8px; width:100%;">
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--accent-pink); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">??/div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">??/div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">??/div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">??/div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">ëª?/div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--text-dim); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">ê¸?/div>
        <div style="text-align:center; padding:10px 0; font-size:13px; font-weight:700; color:var(--accent-cyan); background:var(--bg-card); border-radius:8px; border:1px solid var(--border-color);">??/div>
    `;

    // ?´ì „ ??ë¹?ì¹?(ê³ ì • 110px)
    for (let i = 0; i < startDayOfWeek; i++) {
      html += `<div class="cal-cell empty" style="background:transparent; border:1px dashed rgba(0,0,0,0.08); border-radius:8px; height:110px; min-height:110px; max-height:110px;"></div>`;
    }

    const todayStr = fmtDate(new Date());

    // ?´ë²ˆ ??? ì§œ??(ê³ ì • 110px ë°??¬í”Œ ?¼ì • ?œëª© ì¹?
    for (let day = 1; day <= totalDays; day++) {
      const d = new Date(year, month, day);
      const dateStr = fmtDate(d);
      const isToday = dateStr === todayStr;
      const dayOfWeek = d.getDay();
      let dayColor = dayOfWeek === 0 ? '#ef4444' : dayOfWeek === 6 ? '#3b82f6' : '#0f172a';

      // ?´ë‹¹ ? ì§œ ?¤ì?ì¤??„í„°
      const daySchedules = allSchedules.filter(s => s.date === dateStr);

      html += `
        <div class="cal-cell ${isToday ? 'today' : ''}" data-date="${dateStr}" 
          style="background:var(--bg-card); border:${isToday ? '2px solid var(--primary)' : '1px solid var(--border-color)'}; border-radius:8px; height:110px; max-height:110px; min-height:110px; padding:8px 10px; display:flex; flex-direction:column; gap:4px; cursor:pointer; transition:all 0.2s; overflow:hidden; position:relative;" onmouseenter="this.style.background='var(--bg-card-hover)'" onmouseleave="this.style.background='var(--bg-card)'">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
            <span style="font-size:14px; font-weight:800; color:${dayColor};">${day}</span>
            ${daySchedules.length > 0 ? `<span style="font-size:10px; background:rgba(79,70,229,0.1); color:#4f46e5; padding:1px 6px; border-radius:10px; font-weight:700;">${daySchedules.length}ê±?/span>` : ''}
          </div>
          <div class="cell-events" style="display:flex; flex-direction:column; gap:3px; overflow:hidden; flex:1;">
      `;

      // ìµœë? 2ê°œë§Œ ê¹”ë”???œëª© ì¹©ìœ¼ë¡??¸ì¶œ
      daySchedules.slice(0, 2).forEach(sch => {
        const art = artists.find(a => a.id === sch.artistId);
        const isSec = sch.isSecret === true;
        const artColor = isSec ? '#9333ea' : (art ? art.color : '#4f46e5');
        const lockPrefix = isSec ? '?”’ ' : '';
        html += `
          <div class="cal-event-pill" style="background:${artColor}; color:#fff; padding:0 8px; height:23px; line-height:23px; border-radius:5px; font-size:11px; font-weight:700; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.05); border-left:3px solid ${isSec ? '#f43f5e' : 'rgba(255,255,255,0.9)'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex-shrink:0;" data-sch-id="${sch.id}">
            ${lockPrefix}${art?.emoji || '??} ${sch.title}
          </div>
        `;
      });

      if (daySchedules.length > 2) {
        html += `<div style="font-size:10px; color:#4f46e5; text-align:right; font-weight:800; margin-top:1px;">+${daySchedules.length - 2}ê°??”ë³´ê¸??”</div>`;
      }

      html += `
          </div>
        </div>
      `;
    }

    html += `</div>`;
    el.scheduleViewport.innerHTML = html;
  }

  // ?€?€ 2. ì£¼ê°„ ?€?„í…Œ?´ë¸” ë·?(Week View) ?€?€
  async function renderWeekView() {
    const curr = new Date(state.currentDate);
    const first = curr.getDate() - curr.getDay(); // Sunday
    const weekStart = new Date(curr.setDate(first));

    const year = weekStart.getFullYear();
    const month = weekStart.getMonth() + 1;
    el.calendarTitle.textContent = `${year}??${month}??ì£¼ê°„ ?€?„í…Œ?´ë¸”`;

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

    const dayNames = ['??, '??, '??, '??, 'ëª?, 'ê¸?, '??];

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
            <span style="font-weight:700; color:${idx === 0 ? '#ef4444' : idx === 6 ? '#3b82f6' : '#0f172a'};">${dayNames[idx]}?”ì¼ (${d.getDate()}??</span>
            <span style="font-size:12px; color:#64748b;">${daySchedules.length}ê±?/span>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px; overflow-y:auto;">
      `;

      if (daySchedules.length === 0) {
        html += `<div style="color:#64748b; font-size:12px; text-align:center; padding:20px 0;">?¼ì • ?†ìŒ</div>`;
      } else {
        daySchedules.forEach(sch => {
          const isSec = sch.isSecret === true;
          const canView = window.AuthPersona ? window.AuthPersona.canViewSecret(sch) : true;
          const displayTitle = (isSec && !canView) ? '?”’ [ê·¹ë¹„ ë³´ì•ˆ ?¤ì?ì¤?' : (isSec ? `?”’ [ë¹„ê³µê°? ${sch.title}` : sch.title);

          const art = artists.find(a => a.id === sch.artistId);
          const artColor = art ? art.color : '#4f46e5';
          html += `
            <div class="cal-event-pill" style="--art-color: ${artColor}; padding:8px; border-radius:6px; cursor:pointer;" data-sch-id="${sch.id}">
              <div style="font-weight:600; font-size:12px; color:#ffffff;">${sch.startTime} ~ ${sch.endTime}</div>
              <div style="font-size:13px; font-weight:700; color:#ffffff; margin:2px 0;">${displayTitle}</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.8);">?‘¤ ${sch.artistName || '?„í‹°?¤íŠ¸'} | ?š— ${sch.managerName || 'ë§¤ë‹ˆ?€'}</div>
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

  // ?€?€ 3. ?„í‹°?¤íŠ¸ë³?ê°„íŠ¸/?€?„ë¼??ë·?(Gantt View) ?€?€
  async function renderGanttView() {
    const todayStr = fmtDate(state.currentDate);
    el.calendarTitle.textContent = `${todayStr} ?„í‹°?¤íŠ¸ë³??€?„ë¼??(Gantt)`;

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
            <span style="font-size:20px;">${art.emoji || '??}</span>
            <h3 style="margin:0; font-size:16px; color:#fff;">${art.name}</h3>
            <span style="font-size:12px; color:#94a3b8;">(${art.type})</span>
            <span style="margin-left:auto; font-size:12px; color:#10b981;">?¤ëŠ˜ ?¼ì • ${artSch.length}ê±?/span>
          </div>
          <div style="display:flex; gap:10px; overflow-x:auto; padding-bottom:6px;">
      `;

      if (artSch.length === 0) {
        html += `<div style="color:#64748b; font-size:13px;">?¤ëŠ˜ ?±ë¡???¤ì?ì¤„ì´ ?†ìŠµ?ˆë‹¤.</div>`;
      } else {
        artSch.forEach(sch => {
          const isSec = sch.isSecret === true;
          const canView = window.AuthPersona ? window.AuthPersona.canViewSecret(sch) : true;
          const displayTitle = (isSec && !canView) ? '?”’ [ê·¹ë¹„ ë³´ì•ˆ ?¤ì?ì¤?' : (isSec ? `?”’ [ë¹„ê³µê°? ${sch.title}` : sch.title);
          const displayLoc = (isSec && !canView) ? 'ë¹„ê³µê°??¥ì†Œ' : (sch.location || '?¥ì†Œ ë¯¸ì???);

          html += `
            <div class="cal-event-pill" style="--art-color: ${art.color}; padding:10px 14px; border-radius:8px; min-width:220px; cursor:pointer;" data-sch-id="${sch.id}">
              <div style="font-size:12px; color:#93c5fd; font-weight:600;">??${sch.startTime} ~ ${sch.endTime}</div>
              <div style="font-size:14px; font-weight:700; color:#fff; margin:4px 0;">${displayTitle}</div>
              <div style="font-size:12px; color:#cbd5e1;">?“ ${displayLoc}</div>
              <div style="font-size:11px; color:#94a3b8; margin-top:4px;">?´ë‹¹: ${sch.managerName || 'ë§¤ë‹ˆ?€'}</div>
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

  // ?€?€ 4. ?¤ì‹œê°?ê´€??ì¹¸ë°˜ ë³´ë“œ ë·?(Kanban View) ?€?€
  async function renderKanbanView() {
    const todayStr = fmtDate(state.currentDate);
    el.calendarTitle.textContent = `${todayStr} ?¤ì‹œê°??í™©??(Kanban Control)`;

    let schedules = await window.hqStore.getSchedules({ date: todayStr });
    if (state.selectedArtistFilter !== 'ALL') {
      schedules = schedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();

    // 5 Columns
    const cols = [
      { key: 'ready', title: '?“‹ ?ˆì • / ì¶œë°œ?€ê¸?, color: '#60a5fa' },
      { key: 'moving', title: '?š— ?½ì—… / ?´ë™ì¤?, color: '#f59e0b' },
      { key: 'shop', title: '?’„ ?¤ë©”??ì§„í–‰ì¤?, color: '#ec4899' },
      { key: 'onsite', title: '?¬ ?„ì¥?€ê¸?/ ì§„í–‰ì¤?, color: '#818cf8' },
      { key: 'done', title: '?‰ ?¼ì • ?„ë£Œ', color: '#34d399' }
    ];

    // Classify schedules
    const categorized = { ready: [], moving: [], shop: [], onsite: [], done: [] };

    schedules.forEach(s => {
      const st = s.status || '';
      const tl = s.timeline || [];
      const hasMovingStep = tl.some(t => t.moving);
      const allDone = tl.length > 0 && tl.every(t => t.done);

      if (st === '?„ë£Œ' || st === 'completed' || allDone) {
        categorized.done.push(s);
      } else if (st === '?´ë™ì¤? || hasMovingStep) {
        categorized.moving.push(s);
      } else if (st === '?µì§„?? || tl.some(t => !t.done && (t.label.includes('??) || t.label.includes('ë©”ì´?¬ì—…')))) {
        categorized.shop.push(s);
      } else if (st === 'in_progress' || st === 'ì§„í–‰ì¤? || tl.some(t => !t.done && (t.label.includes('?„ì¥') || t.label.includes('ë©”ì¸') || t.label.includes('?¹í™”')))) {
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
        html += `<div style="text-align:center; padding:30px 10px; color:#64748b; font-size:12px;">?¼ì • ?†ìŒ</div>`;
      } else {
        list.forEach(sch => {
          const isSec = sch.isSecret === true;
          const canView = window.AuthPersona ? window.AuthPersona.canViewSecret(sch) : true;
          const displayTitle = (isSec && !canView) ? '?”’ [ê·¹ë¹„ ë³´ì•ˆ ?¤ì?ì¤?' : (isSec ? `?”’ [ë¹„ê³µê°? ${sch.title}` : sch.title);
          const displayLoc = (isSec && !canView) ? 'ë¹„ê³µê°??¥ì†Œ' : (sch.location || '?¥ì†Œ ë¯¸ì •');

          const art = artists.find(a => a.id === sch.artistId);
          const artColor = art ? art.color : '#6366f1';
          const isMoving = col.key === 'moving';
          const isDone = col.key === 'done';

          let currentStepText = '?€ê¸?ì¤?;
          if (sch.timeline && sch.timeline.length > 0) {
            const activeStep = sch.timeline.find(t => t.moving) || sch.timeline.find(t => !t.done) || sch.timeline[sch.timeline.length - 1];
            if (activeStep) currentStepText = activeStep.label;
          }
          const displayStep = (isSec && !canView) ? 'ë¹„ê³µê°??íƒœ' : currentStepText;

          html += `
            <div class="kanban-card ${isMoving ? 'kanban-card-moving' : ''} ${isDone ? 'kanban-card-done' : ''}" 
                 style="--accent-theme: ${artColor};" data-sch-id="${sch.id}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:12px; font-weight:800; color:${artColor}; background:rgba(255,255,255,0.08); padding:2px 8px; border-radius:4px;">
                  ${art?.emoji || '??} ${sch.artistName || '?„í‹°?¤íŠ¸'}
                </span>
                ${getStatusBadge(sch.status)}
              </div>
              
              <div style="font-size:14px; font-weight:800; color:#fff; margin-bottom:6px; line-height:1.3;">
                ${displayTitle}
              </div>

              <div style="font-size:12px; color:#94a3b8; display:flex; flex-direction:column; gap:4px; margin-bottom:10px;">
                <div>??<strong>${sch.startTime} ~ ${sch.endTime || ''}</strong></div>
                <div>?“ ${displayLoc}</div>
                <div>?‘¤ ë§¤ë‹ˆ?€: ${sch.managerName || 'ë¯¸ë°°??} | ?š— ${sch.vehicleName || 'ì°¨ëŸ‰ ë¯¸ì???}</div>
              </div>

              <div style="background:#1e293b; padding:8px 10px; border-radius:6px; font-size:11px; color:#cbd5e1; display:flex; justify-content:space-between; align-items:center; border:1px solid #334155;">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">?“ ${displayStep}</span>
                <button type="button" onclick="Admin.openScheduleDetailModal('${sch.id}')" style="background:#4f46e5; color:#fff; border:none; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700; cursor:pointer; flex-shrink:0;">?ì„¸ ??/button>
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

  // ?€?€ 5. ì¢…í•© ê´€??ì§€??ë·?(Map View) ?€?€
  async function renderMapView() {
    const todayStr = fmtDate(state.currentDate);
    el.calendarTitle.textContent = `${todayStr} ì¢…í•© ê´€??ì§€??(Control Map)`;

    let schedules = await window.hqStore.getSchedules({ date: todayStr });
    if (state.selectedArtistFilter !== 'ALL') {
      schedules = schedules.filter(s => s.artistId === state.selectedArtistFilter);
    }
    const artists = await window.hqStore.getArtists();
    const vehicles = await window.hqStore.getVehicles();

    // Map control grid
    let html = `
      <div class="map-control-grid">
        <!-- ì§€???¸í„°?™í‹°ë¸?ê´€???ì—­ -->
        <div class="map-canvas-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #334155; padding-bottom:10px;">
            <h4 style="color:#fff; font-size:15px; font-weight:800; display:flex; align-items:center; gap:6px;">
              <span>?—ºï¸?/span> ?˜ë„ê¶?ì£¼ìš” ë°©ì†¡êµ??¤íŠœ?”ì˜¤ & ?¤ì‹œê°??„í‹°?¤íŠ¸ ?™ì„  ê´€??
            </h4>
            <div style="display:flex; gap:8px;">
              <span class="badge-status moving">?š— ?´ë™ì¤?${schedules.filter(s => s.status === '?´ë™ì¤? || s.timeline?.some(t => t.moving)).length}?€</span>
              <span class="badge-status done">???„ë£Œ ${schedules.filter(s => s.status === '?„ë£Œ' || s.status === 'completed').length}ê±?/span>
            </div>
          </div>

          <!-- ê´€??ì§€??ìº”ë²„??-->
          <div id="hq-control-map-viewport" style="flex:1; min-height:400px; background:#0f172a; border-radius:10px; border:1px solid #334155; position:relative; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; padding:20px; background:radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);">
            
            <!-- Map background grid overlay -->
            <div style="position:absolute; inset:0; background-image:linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size:40px 40px; pointer-events:none;"></div>

            <!-- Map pins grid -->
            <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px; position:relative; z-index:2;">
              ${schedules.length === 0 ? '<div style="color:#94a3b8; font-size:14px; grid-column:span 3; text-align:center; padding:100px 0;">?¤ëŠ˜ ?ˆì •???¤ì?ì¤?ë°??™ì„ ???†ìŠµ?ˆë‹¤.</div>' : ''}
              ${schedules.map((sch, i) => {
      const art = artists.find(a => a.id === sch.artistId);
      const isMoving = sch.status === '?´ë™ì¤? || sch.timeline?.some(t => t.moving);
      const isDone = sch.status === '?„ë£Œ' || sch.status === 'completed';

      return `
                  <div onclick="Admin.openScheduleDetailModal('${sch.id}')" 
                       style="background:rgba(30,41,59,0.9); border:2px solid ${isMoving ? '#f59e0b' : isDone ? '#10b981' : '#4f46e5'}; border-radius:12px; padding:14px; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(0,0,0,0.3); backdrop-filter:blur(8px);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                      <span style="background:${art?.color || '#4f46e5'}; color:#fff; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px;">
                        ${art?.emoji || '??} ${sch.artistName}
                      </span>
                      <span style="font-size:11px; font-weight:700; color:${isMoving ? '#fbbf24' : isDone ? '#34d399' : '#a5b4fc'};">
                        ${isMoving ? '?š— ?´ë™ ì¤? : isDone ? '???„ë£Œ' : '?±ï¸ ?€ê¸°ì¤‘'}
                      </span>
                    </div>

                    <div style="font-size:13px; font-weight:800; color:#fff; margin-bottom:6px; line-height:1.3;">
                      ?¬ ${sch.title}
                    </div>

                    <div style="font-size:12px; color:#cbd5e1; font-weight:600; display:flex; align-items:center; gap:4px;">
                      <span>?“</span> <span>${sch.location || '?¥ì†Œ ë¯¸ì •'}</span>
                    </div>

                    <div style="font-size:11px; color:#94a3b8; margin-top:8px; padding-top:6px; border-top:1px dashed #334155; display:flex; justify-content:space-between;">
                      <span>?‘¤ ${sch.managerName || 'ë§¤ë‹ˆ?€'}</span>
                      <span>?š— ${sch.vehicleName || 'ë°°ì°¨ ì°¨ëŸ‰'}</span>
                    </div>
                  </div>
                `;
    }).join('')}
            </div>

            <!-- Footer status summary inside map canvas -->
            <div style="position:relative; z-index:2; margin-top:20px; background:rgba(15,23,42,0.85); border:1px solid #334155; padding:12px 16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:12px; color:#94a3b8;">?“¡ ë³¸ì‚¬ ê´€???¼í„°: ?„ì¥ ë§¤ë‹ˆ?€?Œë˜???±ê³¼ ?¤ì‹œê°?2-way ?°ì´???™ê¸°???œì„±?”ë¨</span>
              <span style="font-size:12px; font-weight:700; color:#38bdf8;">?˜ë„ê¶?ì£¼ìš” ë°©ì†¡êµ???ê±°ì  ê´€??ëª¨ë“œ</span>
            </div>

          </div>
        </div>

        <!-- ?°ì¸¡ ì°¨ëŸ‰ / ë§¤ë‹ˆ?€ ?„í™© ?¨ë„ -->
        <div class="map-vehicle-sidebar">
          <div style="background:#1e293b; border-radius:var(--radius-md); border:1px solid #334155; padding:14px;">
            <h4 style="color:#fff; font-size:14px; font-weight:800; margin-bottom:12px; display:flex; align-items:center; gap:6px;">
              <span>?š˜</span> ?„ì‚¬ ë°°ì°¨ ?„í™© (${vehicles.length}?€)
            </h4>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${vehicles.map(v => {
      const assignedSched = schedules.find(s => s.vehicleId === v.id || s.vehicleName === v.name);
      const isBusy = !!assignedSched;
      const isMoving = assignedSched && (assignedSched.status === '?´ë™ì¤? || assignedSched.timeline?.some(t => t.moving));
      return `
                  <div style="background:#0f172a; padding:10px 12px; border-radius:8px; border:1px solid ${isMoving ? '#f59e0b' : isBusy ? '#4f46e5' : '#334155'}; font-size:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                      <span style="font-weight:800; color:#fff;">${v.name}</span>
                      <span style="font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; background:${isMoving ? '#f59e0b' : isBusy ? '#4f46e5' : '#334155'}; color:#fff;">
                        ${isMoving ? '?š— ì£¼í–‰ì¤? : isBusy ? '?“Œ ?´í–‰?ˆì •' : '?…¿ï¸?ì°¨ê³ ì§€ ?€ê¸?}
                      </span>
                    </div>
                    ${assignedSched ? `
                      <div style="color:#93c5fd; font-size:11px; font-weight:600;">??[${assignedSched.artistName}] ${assignedSched.title}</div>
                      <div style="color:#94a3b8; font-size:11px;">?“ ${assignedSched.location || '?„ì¥'}</div>
                    ` : '<div style="color:#64748b; font-size:11px;">ì¦‰ì‹œ ë°°ì°¨ ê°€??/div>'}
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

  // ?€?€ 6. ?„ì‚¬ ?œë™ ë¶„ì„ ì°¨íŠ¸ ë°?ë¦¬í¬??(Analytics View) ?€?€
  async function renderAnalyticsView() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth() + 1;
    el.calendarTitle.textContent = `${year}??${month}???„ì‚¬ ?œë™ ë¶„ì„ ë¦¬í¬??;

    const allSchedules = await window.hqStore.getSchedules();
    const artists = await window.hqStore.getArtists();
    const managers = await window.hqStore.getManagers();
    const vehicles = await window.hqStore.getVehicles();

    // Compute stats
    const totalCount = allSchedules.length;
    const doneCount = allSchedules.filter(s => s.status === '?„ë£Œ' || s.status === 'completed' || s.timeline?.every(t => t.done)).length;
    const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;

    // Categories Breakdown
    const catMap = {
      music_show: { label: '?“º ?Œì•…ë°©ì†¡', count: 0, color: '#6366f1' },
      shooting: { label: '?“¸ ?”ë³´/ê´‘ê³ ', count: 0, color: '#ec4899' },
      event: { label: '?ª ?‰ì‚¬/ê³µì—°', count: 0, color: '#f59e0b' },
      fansign: { label: '?’Œ ?¬ì‚¬?¸íšŒ', count: 0, color: '#10b981' },
      broadcast: { label: '?™ï¸??ˆëŠ¥/?¼ë””??, count: 0, color: '#3b82f6' },
      recording: { label: '?µ ?¹ìŒ/?ˆìŠ¨', count: 0, color: '#8b5cf6' },
      meeting: { label: '?’¼ ë¯¸íŒ…/?Œì˜', count: 0, color: '#64748b' }
    };

    allSchedules.forEach(s => {
      const cat = s.category || 'broadcast';
      if (catMap[cat]) catMap[cat].count++;
      else catMap.broadcast.count++;
    });

    // Top locations
    const locCounts = {};
    allSchedules.forEach(s => {
      const loc = s.location || 'ê¸°í? ?„ì¥';
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
            <div class="analytics-card-title"><span>?“Š ?„ì  ì´??¤ì?ì¤?/span> <span>?“…</span></div>
            <div class="analytics-card-value">${totalCount}ê±?/div>
            <div class="analytics-card-sub">?„ë£Œ ${doneCount}ê±?(${completionRate}%)</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title"><span>?ŒŸ ?œë™ ?„í‹°?¤íŠ¸</span> <span>?¤</span></div>
            <div class="analytics-card-value">${artists.length}?€</div>
            <div class="analytics-card-sub">ìµœë‹¤ ?¤ì?ì¤? ${artistStats[0]?.name || '?†ìŒ'} (${artistStats[0]?.count || 0}ê±?</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title"><span>?š— ?´í–‰ ë°°ì°¨ ì°¨ëŸ‰</span> <span>?š˜</span></div>
            <div class="analytics-card-value">${vehicles.length}?€</div>
            <div class="analytics-card-sub">?‰ê·  ê°€?™ë¥  85% ?´ìƒ</div>
          </div>
          <div class="analytics-card">
            <div class="analytics-card-title"><span>?‘¥ ?„ì¥ ì§€??ë§¤ë‹ˆ?€</span> <span>?‘”</span></div>
            <div class="analytics-card-value">${managers.length}ëª?/div>
            <div class="analytics-card-sub">?„ì› 100% ë°°ì¹˜ ?„ë£Œ</div>
          </div>
        </div>

        <!-- 2 Column Section: Category Distribution & Artist Ranking -->
        <div class="analytics-two-col">
          
          <!-- Category Distribution -->
          <div class="analytics-section-card">
            <div class="analytics-section-header">
              <h4><span>?“Œ</span> ì¹´í…Œê³ ë¦¬ë³??œë™ ë¹„ìœ¨ ë¶„í¬</h4>
              <span style="font-size:12px; color:#94a3b8;">?„ì²´ ${totalCount}ê±?ê¸°ì?</span>
            </div>
            <div class="category-bar-group">
              ${Object.values(catMap).map(cat => {
      const pct = totalCount > 0 ? Math.round((cat.count / totalCount) * 100) : 0;
      return `
                  <div class="category-bar-item">
                    <div class="category-bar-label">
                      <span>${cat.label}</span>
                      <span>${cat.count}ê±?(${pct}%)</span>
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
              <h4><span>?†</span> ?Œì† ?„í‹°?¤íŠ¸ë³??œë™ ?˜í–‰ ?¤ì </h4>
              <span style="font-size:12px; color:#94a3b8;">?”ê°„ ?¤ì?ì¤?ê±´ìˆ˜</span>
            </div>
            <div class="category-bar-group">
              ${artistStats.map(a => {
      const pct = totalCount > 0 ? Math.round((a.count / totalCount) * 100) : 0;
      return `
                  <div class="category-bar-item">
                    <div class="category-bar-label">
                      <span>${a.emoji || '??} ${a.name} <span style="font-size:11px; color:#94a3b8;">(${a.type})</span></span>
                      <span>${a.count}ê±?(${pct}%)</span>
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
              <h4><span>?“</span> ìµœë‹¤ ì¶œë™ ?„ì¥ ê±°ì  Top 5</h4>
              <span style="font-size:12px; color:#94a3b8;">ë°©ì†¡êµ?ë°?ë©”ì¸ ?¤íŠœ?”ì˜¤</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${topLocations.map(([locName, count], rank) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:10px 14px; border-radius:8px; border:1px solid #334155;">
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span style="background:${rank === 0 ? '#f59e0b' : rank === 1 ? '#94a3b8' : '#64748b'}; color:#fff; font-size:11px; font-weight:800; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center;">${rank + 1}</span>
                    <span style="font-size:13px; font-weight:700; color:#f8fafc;">${locName}</span>
                  </div>
                  <span style="font-size:12px; font-weight:800; color:#38bdf8;">${count}??ë°©ë¬¸</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Manager Support Breakdown -->
          <div class="analytics-section-card">
            <div class="analytics-section-header">
              <h4><span>?‘”</span> ?´ë‹¹ ë§¤ë‹ˆ?€ë³??„ì¥ ì§€???„í™©</h4>
              <button type="button" onclick="Admin.exportExcel()" style="background:#10b981; color:#fff; border:none; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:800; cursor:pointer;">?“Š ?‘ì? ?¤ìš´ë¡œë“œ</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${managers.map(m => {
      const mScheds = allSchedules.filter(s => s.managerId === m.id || s.managerName === m.name);
      const mDone = mScheds.filter(s => s.status === '?„ë£Œ' || s.status === 'completed' || s.timeline?.every(t => t.done)).length;
      return `
                  <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:10px 14px; border-radius:8px; border:1px solid #334155; font-size:12px;">
                    <div>
                      <strong style="color:#fff; font-size:13px;">${m.name}</strong>
                      <span style="color:#94a3b8; margin-left:6px;">(${m.phone || 'ë¡œë“œ ë§¤ë‹ˆ?€'})</span>
                    </div>
                    <div style="display:flex; gap:12px; align-items:center;">
                      <span style="color:#a5b4fc; font-weight:700;">ì´?${mScheds.length}ê±??˜í–‰</span>
                      <span style="color:#34d399; font-weight:800; background:rgba(16,185,129,0.1); padding:2px 8px; border-radius:10px;">?„ìˆ˜??${mScheds.length > 0 ? Math.round((mDone / mScheds.length) * 100) : 100}%</span>
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

  // ?€?€ ?¤ì?ì¤??ì„¸ ëª¨ë‹¬ ?´ê¸° ?€?€
  async function openScheduleDetailModal(schId) {
    const schedules = await window.hqStore.getSchedules();
    const sch = schedules.find(s => s.id === schId);
    if (!sch) return;

    state.activeScheduleId = schId;
    const artists = await window.hqStore.getArtists();
    const art = artists.find(a => a.id === sch.artistId);

    // ì¤‘ë³µ ë°°ì°¨ ì¶©ëŒ ê²€??
    const conflictResult = window.hqStore.checkConflict ? window.hqStore.checkConflict(sch) : { hasConflict: false };

    let html = `
      ${conflictResult.hasConflict ? `
        <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); border-radius:8px; padding:12px; margin-bottom:16px;">
          <div style="font-size:13px; font-weight:800; color:#f87171; display:flex; align-items:center; gap:6px; margin-bottom:4px;">
            <span>? ï¸ ë°°ì°¨/?¼ì • ì¤‘ë³µ ì¶©ëŒ ê°ì?</span>
          </div>
          <div style="font-size:12px; color:#fca5a5; line-height:1.4;">
            ${conflictResult.conflicts.map(c => `
              <div>??<strong>[${c.type === 'vehicle' ? 'ì°¨ëŸ‰: ' + c.vehicleName : 'ë§¤ë‹ˆ?€: ' + c.managerName}]</strong> ?™ì¼ ?œê°„?€(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'??ì¤‘ë³µ ë°°ì •??/div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #334155; padding-bottom:14px; margin-bottom:16px;">
        <div>
          <span style="background:${art ? art.color : '#6366f1'}; color:#fff; font-size:12px; padding:2px 8px; border-radius:4px; font-weight:600;">
            ${sch.artistName || '?„í‹°?¤íŠ¸'}
          </span>
          <h2 style="font-size:20px; color:#fff; margin:8px 0 4px 0;">${sch.title}</h2>
          <div style="font-size:13px; color:#94a3b8;">?“… ${sch.date} (${sch.startTime} ~ ${sch.endTime})</div>
        </div>
        ${getStatusBadge(sch.status)}
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:16px; font-size:13px;">
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?“ ë©”ì¸ ?¥ì†Œ:</span> <strong style="color:#f8fafc;">${sch.location || 'ë¯¸ì •'}</strong>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?‘¤ ?´ë‹¹ ë§¤ë‹ˆ?€:</span> <strong style="color:#f8fafc;">${sch.managerName || 'ë¯¸ë°°??}</strong>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?š— ë°°ì°¨ ì°¨ëŸ‰:</span> <strong style="color:#f8fafc;">${sch.vehicleName || 'ë¯¸ë°°??}</strong>
        </div>
        <div style="background:#0f172a; padding:10px; border-radius:6px;">
          <span style="color:#64748b;">?’„ ?¤ë©” ??</span> <strong style="color:#f8fafc;">${sch.shopLocation || (sch.shop?.name) || 'ë¯¸ê²½??}</strong>
        </div>
      </div>

      ${sch.notes ? `
        <div style="background:#1e293b; padding:12px; border-radius:8px; border:1px solid #334155; margin-bottom:16px;">
          <div style="font-size:12px; color:#94a3b8; margin-bottom:4px;">?“ ?„ì¥ ?¹ì´?¬í•­ / ë©”ëª¨</div>
          <div style="font-size:13px; color:#f8fafc; line-height:1.5;">${sch.notes}</div>
        </div>
      ` : ''}

      <div style="margin-top:16px;">
        <h4 style="font-size:14px; color:#f8fafc; margin-bottom:10px;">?“‹ ?¤ë§ˆ????‚° ?€?„ë¼??/h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;">
          ${(sch.timeline || []).map(item => `
            <div style="display:flex; gap:10px; align-items:center; background:#0f172a; padding:8px 12px; border-radius:6px; font-size:13px;">
              <span style="color:#38bdf8; font-weight:700; font-family:monospace;">${item.time}</span>
              <span style="color:${item.done ? '#10b981' : '#f8fafc'}; text-decoration:${item.done ? 'line-through' : 'none'};">${item.label}</span>
              ${item.done ? `
                <span style="margin-left:auto; font-size:11px; color:#10b981; font-weight:700; display:flex; align-items:center; gap:4px;">
                  ???„ë£Œ ${item.doneAt ? `<span style="font-size:10px; opacity:0.8;">(${item.doneAt})</span>` : ''}
                </span>
              ` : (item.moving ? `
                <span style="margin-left:auto; font-size:11px; color:#f59e0b; font-weight:700;">?š— ?´ë™ì¤?/span>
              ` : '')}
            </div>
          `).join('')}
        </div>
      </div>

      ${sch.statusLogs && sch.statusLogs.length > 0 ? `
        <div style="margin-top:16px; border-top:1px solid #334155; padding-top:14px;">
          <h4 style="font-size:14px; color:#f8fafc; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <span>?±ï¸ ?„ì¥ ?¤ì‹œê°??€?„ìŠ¤?¬í”„ ?´ë ¥</span>
            <span style="font-size:11px; color:#64748b; font-weight:normal;">(ì´?${sch.statusLogs.length}??ê¸°ë¡)</span>
          </h4>
          <div style="display:flex; flex-direction:column; gap:6px; max-height:140px; overflow-y:auto;">
            ${sch.statusLogs.map(log => `
              <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(15,23,42,0.6); padding:6px 10px; border-radius:6px; font-size:12px; border-left:3px solid #6366f1;">
                <div style="color:#cbd5e1; font-weight:600;">
                  ${log.label}
                </div>
                <div style="font-size:11px; color:#94a3b8; font-family:monospace;">
                  ${log.time} (${log.managerName || '?„ì¥ë§¤ë‹ˆ?€'})
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

  // ?€?€ ?¤ì?ì¤??±ë¡/?˜ì • ëª¨ë‹¬ ?´ê¸° ?€?€
  function openScheduleFormModal(dateStr = null, editSch = null) {
    el.formSchedule.reset();
    if (editSch) {
      el.scheduleFormTitle.textContent = '?ï¸ ?¤ì?ì¤??•ë³´ ?˜ì •';
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
      el.formStatus.value = editSch.status || '?ˆì •';
      if (el.formIsSecret) el.formIsSecret.checked = editSch.isSecret || false;
    } else {
      el.scheduleFormTitle.textContent = '??? ê·œ ?¤ì?ì¤??±ë¡';
      el.formSchId.value = '';
      el.formDate.value = dateStr || fmtDate(state.currentDate);
      el.formStartTime.value = '10:00';
      el.formEndTime.value = '18:00';
      el.formStatus.value = '?ˆì •';
      if (el.formIsSecret) el.formIsSecret.checked = false;
    }
    el.modalScheduleForm.classList.add('active');
  }

  // ?€?€ ?´ë²¤??ë¦¬ìŠ¤???¤ì • ?€?€
  function setupEventListeners() {
    // ë©”ì‹œì§€ ë°œì†¡ ???œì¶œ
    const formSendMsg = document.getElementById('form-send-message');
    if (formSendMsg) {
      formSendMsg.addEventListener('submit', (e) => {
        Admin.submitSendMessage(e);
      });
    }

    // BroadcastChannel ?¤ì‹œê°??˜ì‹  (?™ì¼ ë¸Œë¼?°ì? ??ê°?
    if (window.hqStore && window.hqStore.broadcast) {
      window.hqStore.broadcast.onmessage = async (e) => {
        if (e.data && (e.data.type === 'SCHEDULES_SAVED' || e.data.type === 'SCHEDULE_UPDATE' || e.data.type === 'STATUS_LOG_ADDED')) {
          console.log('??[Admin] ë¡œì»¬/ë¸Œë¡œ?œìº?¤íŠ¸ ?¤ì?ì¤?ë³€ê²?ê°ì?, ë·??ë™ ê°±ì‹ ');
          await renderCurrentView();
          await renderStats();
        }
      };
    }

    // Supabase Realtime êµ¬ë… (ê¸°ê¸° ê°??¤ì‹œê°??™ê¸°??
    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      window.SupabaseClient.subscribeToSchedules(async (payload) => {
        console.log('??[Admin] Supabase Realtime ?¤ì?ì¤?ë³€ê²?ê°ì?, ?ê²© ?™ê¸°???¤í–‰:', payload);
        await window.hqStore.syncFromSupabase();
        await renderCurrentView();
        await renderStats();
      });
    }

    // ë·??„í™˜ ??
    el.viewTabs.forEach(btn => {
      btn.addEventListener('click', (e) => {
        el.viewTabs.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.currentView = e.target.dataset.view;
        renderCurrentView();
      });
    });

    // ? ì§œ ?´ì „/?¤ìŒ/?¤ëŠ˜
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

    // ?¬ì´?œë°” ?„í‹°?¤íŠ¸ ?„í„° ?´ë¦­ ?„ì„
    el.artistFilterList.addEventListener('click', (e) => {
      const chip = e.target.closest('.artist-chip');
      if (chip && chip.dataset.artistId) {
        state.selectedArtistFilter = chip.dataset.artistId;
        renderSidebar();
        renderCurrentView();
      }
    });

    // ?€?€ ?ŒŸ ë§ˆìš°???¸ë²„ ???ì„¸ ?¼ì • ?ì˜¤ë²?ì¹´ë“œ ?œì‹œ (?¸í„°?™í‹°ë¸??´ë¦­ ì§€?? ?€?€
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
        const dayName = ['??, '??, '??, '??, 'ëª?, 'ê¸?, '??][dateObj.getDay()];

        let popHtml = `
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #334155; padding-bottom:8px; margin-bottom:10px;">
            <div style="font-size:14px; font-weight:800; color:#f8fafc;">
              ?“… ${y}??${Number(m)}??${Number(d)}??(${dayName})
            </div>
            <span style="background:rgba(99,102,241,0.2); color:#818cf8; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px;">
              ì´?${daySchedules.length}ê±?
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
                  ??${sch.startTime} ~ ${sch.endTime}
                </span>
                <span style="font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; ${sch.status === 'ì§„í–‰ì¤? || sch.status === '?´ë™ì¤? ? 'background:#10b981; color:#fff;' : 'background:rgba(255,255,255,0.1); color:#94a3b8;'}">
                  ${sch.status || '?ˆì •'}
                </span>
              </div>
              <div style="font-size:13px; font-weight:800; color:#f8fafc; margin-bottom:4px;">
                ${art?.emoji || '??} [${sch.artistName || '?„í‹°?¤íŠ¸'}] ${sch.title}
              </div>
              <div style="font-size:11px; color:#94a3b8; display:flex; flex-direction:column; gap:2px;">
                <div>?“ ${sch.location || '?¥ì†Œ ë¯¸ì???}</div>
                <div>?‘¤ ${sch.managerName || 'ë¯¸ë°°??} | ?š— ${sch.vehicleName || 'ì°¨ëŸ‰ ë¯¸ì???}</div>
              </div>
            </div>
          `;
        });

        popHtml += `</div>
          <div style="font-size:11px; color:#64748b; text-align:center; margin-top:8px; background:rgba(79,70,229,0.05); padding:6px; border-radius:6px; border:1px dashed rgba(79,70,229,0.2);">
            ?‘† <strong>?í•˜???¼ì •???´ë¦­</strong>?˜ì‹œë©??ì„¸ ?•ë³´ ë°???‚° ?™ì„ ???•ì¸?????ˆìŠµ?ˆë‹¤.
          </div>
        `;

        popover.innerHTML = popHtml;

        // ?ŒŸ ? ì§œ ?€ ê¸°ì??¼ë¡œ ?ì˜¤ë²??„ì¹˜ë¥??„ë²½?˜ê²Œ ê³ ì • (ë§ˆìš°???°ë¼ ?„ë§ê°€ì§€ ?ŠìŒ!)
        const rect = cell.getBoundingClientRect();
        const popW = 340;
        const popH = 260;

        let left = rect.right + 10;
        let top = rect.top;

        // ?”ë©´ ?°ì¸¡?¼ë¡œ ?˜ì¹˜ë©??€???¼ìª½??ë°°ì¹˜
        if (left + popW > window.innerWidth - 10) {
          left = rect.left - popW - 10;
        }
        // ?”ë©´ ?„ë˜ë¡??˜ì¹˜ë©??„ë¡œ ?¹ê?
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

    // ?¤ì?ì¤??´ë¦­ ?„ì„
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

    // ? ê·œ ?¤ì?ì¤?ë²„íŠ¼
    el.btnOpenAddSchedule.addEventListener('click', () => {
      openScheduleFormModal();
    });

    // ?„í‹°?¤íŠ¸ ì¶”ê? ë²„íŠ¼
    el.btnOpenAddArtist.addEventListener('click', () => {
      el.formArtistAdd.reset();
      delete el.formArtistAdd.dataset.editId;
      const formTitle = document.querySelector('#modal-artist-form h3');
      if (formTitle) formTitle.textContent = '? ê·œ ?„í‹°?¤íŠ¸ ?±ë¡';
      const submitBtn = el.formArtistAdd.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = '?„í‹°?¤íŠ¸ ?±ë¡';
      el.modalArtistForm.classList.add('active');
    });

    // ëª¨ë‹¬ ?«ê¸°
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-close');
        const m = document.getElementById(modalId);
        if (m) m.classList.remove('active');
      });
    });

    // ?¤ì?ì¤????œì¶œ
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

      // ?š¨ ë°°ì°¨/ë§¤ë‹ˆ?€ ì¤‘ë³µ ì¶©ëŒ ê²€??
      if (window.hqStore && window.hqStore.checkConflict) {
        const conflictResult = window.hqStore.checkConflict(schData);
        if (conflictResult.hasConflict) {
          const warnMsgs = conflictResult.conflicts.map(c => {
            if (c.type === 'vehicle') {
              return `???š— [${c.vehicleName}] ì°¨ëŸ‰???™ì¼ ?œê°„?€(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'???´ë? ë°°ì •?˜ì–´ ?ˆìŠµ?ˆë‹¤.`;
            } else {
              return `???‘¤ [${c.managerName}] ë§¤ë‹ˆ?€ê°€ ?™ì¼ ?œê°„?€(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'???´ë? ë°°ì •?˜ì–´ ?ˆìŠµ?ˆë‹¤.`;
            }
          }).join('\n');

          const proceed = true; // ë¬´ì¡°ê±??€??(confirm ?ëµ)
        }
      }

      await window.hqStore.saveSchedule(schData);
      el.modalScheduleForm.classList.remove('active');
      await renderSidebar();
      await renderKPI();
      await renderCurrentView();
    });

    // ?¤ì?ì¤??˜ì • ë²„íŠ¼
    el.btnEditSchedule.addEventListener('click', async () => {
      const schedules = await window.hqStore.getSchedules();
      const sch = schedules.find(s => s.id === state.activeScheduleId);
      if (sch) {
        el.modalScheduleDetail.classList.remove('active');
        openScheduleFormModal(null, sch);
      }
    });

    // ?¤ì?ì¤??? œ ë²„íŠ¼
    el.btnDeleteSchedule.addEventListener('click', async () => {
      if (confirm('???¤ì?ì¤„ì„ ?? œ?˜ì‹œê² ìŠµ?ˆê¹Œ? ë§¤ë‹ˆ?€?Œë˜?ˆì—?œë„ ì¦‰ì‹œ ?? œ?©ë‹ˆ??')) {
        await window.hqStore.deleteSchedule(state.activeScheduleId);
        el.modalScheduleDetail.classList.remove('active');
        await renderSidebar();
        await renderKPI();
        await renderCurrentView();
      }
    });

    // ? ê·œ ë§¤ë‹ˆ?€ ê³„ì • ?ì„± ??(?¬ë¡¯ ?œí•œ ?•ì¸)
    if (el.formCreateManager) {
      el.formCreateManager.addEventListener('submit', async (e) => {
        e.preventDefault();

        // ?š¨ ?¬ë¡¯ ì´ˆê³¼ ì²´í¬
        if (!window.hqStore.canAddManager()) {
          const sub = window.hqStore.getSubscription();
          alert(`? ï¸ ?„ì¬ ë³´ìœ  ì¤‘ì¸ ë§¤ë‹ˆ?€ ?¬ë¡¯(${sub.totalSlots}????ëª¨ë‘ ?¬ìš© ì¤‘ì…?ˆë‹¤.\n\në§¤ë‹ˆ?€ë¥?ì¶”ê?ë¡??±ë¡?˜ì‹œ?¤ë©´ [ë§¤ë‹ˆ?€ ?¬ë¡¯ ì¶”ê?(+20,000????]ë¥?ì§„í–‰?´ì£¼?¸ìš”.`);
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
            alert(`??[Supabase] ${name} ë§¤ë‹ˆ?€ ê³„ì •???ì„±?˜ì—ˆ?µë‹ˆ??`);
          } catch (err) {
            alert('ê³„ì • ?ì„± ?¤ë¥˜: ' + err.message);
            return;
          }
        } else {
          const mgrId = 'mgr_' + Date.now();
          await window.hqStore.addManager({
            id: mgrId,
            name,
            email,
            phone,
            role: 'manager',
            assignedArtists: []
          });

          let mockUsers = [];
          try {
            mockUsers = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
          } catch (e) { }

          mockUsers.push({
            id: mgrId,
            email: email,
            password: pw,
            name: name,
            role: 'manager',
            company_name: localStorage.getItem('bp_company_name') || 'STAR',
            badge: '?š— ?„ì¥ ë§¤ë‹ˆ?€',
            shortBadge: '?š— ë§¤ë‹ˆ?€',
            color: '#ec4899',
            assignedArtists: []
          });
          localStorage.setItem('mock_registered_users', JSON.stringify(mockUsers));

          alert(`??[ë¡œì»¬] ${name} ë§¤ë‹ˆ?€ ê³„ì •???±ë¡?˜ì—ˆ?µë‹ˆ??`);
        }

        el.formCreateManager.reset();
        window.Admin.updateManagerSlotUI();
        await window.Admin.renderManagerManagementList();
        await populateSelectOptions();
        await renderSidebar();
      });
    }

    // ?„í‹°?¤íŠ¸ ì¶”ê?/?˜ì • ???œì¶œ
    el.formArtistAdd.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const editId = el.formArtistAdd.dataset.editId;
      
      const artData = {
        name: document.getElementById('new-artist-name').value,
        type: document.getElementById('new-artist-type').value,
        members: Number(document.getElementById('new-artist-members').value) || 1,
        color: document.getElementById('new-artist-color').value,
        image: document.getElementById('new-artist-image').value || ''
      };

      if (editId) {
        // ?˜ì • ëª¨ë“œ
        await window.hqStore.updateArtist(editId, artData);
        alert('?„í‹°?¤íŠ¸ ?•ë³´ê°€ ?˜ì •?˜ì—ˆ?µë‹ˆ??');
      } else {
        // ? ê·œ ?±ë¡ ëª¨ë“œ
        artData.id = 'art_' + Date.now();
        artData.status = '?œë™ì¤?;
        await window.hqStore.addArtist(artData);
        alert('?„í‹°?¤íŠ¸ê°€ ?±ë¡?˜ì—ˆ?µë‹ˆ??');
      }

      el.modalArtistForm.classList.remove('active');
      await Admin.renderArtistManagementList(); // ëª¨ë‹¬ ë¦¬ìŠ¤???…ë°?´íŠ¸
      await populateSelectOptions();
      await renderSidebar();
    });

    // ?‘ì?/CSV ?´ë³´?´ê¸°
    el.btnExportExcel.addEventListener('click', async () => {
      const schedules = await window.hqStore.getSchedules();
      let csv = '\uFEFF? ì§œ,?¤ì?ì¤„ëª…,?„í‹°?¤íŠ¸,ë¶„ë¥˜,?œê°„,?´ë‹¹ë§¤ë‹ˆ?€,ë°°ì°¨,?¥ì†Œ,?íƒœ\n';
      schedules.forEach(s => {
        csv += `"${s.date}","${s.title}","${s.artistName}","${s.category}","${s.startTime}~${s.endTime}","${s.managerName}","${s.vehicleName || ''}","${s.location}","${s.status}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `HQ_?„í‹°?¤íŠ¸_?¤ì?ì¤?${fmtDate(new Date())}.csv`;
      link.click();
    });
  }

  // Run
  init();
});
