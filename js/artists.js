/* =========================================
   RoadPlanner — 내 아티스트 (개인 매니저 전용)
   개인 매니저는 본사가 없으므로 담당 아티스트를 직접 등록·수정·삭제한다.
   무료는 1명까지 (서버도 같은 제한), 유료는 여러 명.
   ========================================= */

const Artists = {
  TYPES: ['솔로', '그룹', '배우', '방송인', '모델', '기타'],
  COLORS: ['#ec4899', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'],

  list() {
    try { return (window.hqStore?.getArtists?.() || []).filter(a => a && a.id); } catch (e) { return []; }
  },

  _syncAssigned() {
    try { localStorage.setItem('bp_assigned_artists', JSON.stringify(this.list().map(a => a.id))); } catch (e) { }
  },

  render() {
    const el = U.$('#screen-artists');
    if (!el) return;
    const items = this.list();
    const paid = Plan.isPaid();
    const full = !paid && items.length >= Plan.FREE_ARTISTS;
    el.innerHTML = `
      <div class="header">
        <button class="header-btn" onclick="App.navigate('home')" aria-label="뒤로">
          <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="header-title">내 아티스트</h1>
        <div class="header-btn" style="visibility:hidden"></div>
      </div>
      <div class="screen-scroll" style="padding:12px 16px 24px;">
        <div class="art-plan ${paid ? 'paid' : ''}">
          ${paid ? `유료 사용 중 · 아티스트 여러 명 등록 가능 ${Plan.untilText() ? `(${Plan.untilText()})` : ''}`
                 : `무료는 아티스트 ${Plan.FREE_ARTISTS}명까지예요. <button type="button" onclick="App.navigate('upgrade')">유료 알아보기</button>`}
        </div>
        ${items.length ? items.map(a => `
          <div class="art-card">
            <span class="art-dot" style="background:${esc(a.color || '#ec4899')}"></span>
            <div class="art-info">
              <div class="art-name">${esc(a.name)}</div>
              <div class="art-type">${esc(a.type || '기타')}</div>
            </div>
            <button type="button" class="art-btn" onclick="Artists.openForm(${escJs(a.id)})">수정</button>
            <button type="button" class="art-btn danger" onclick="Artists.remove(${escJs(a.id)})">삭제</button>
          </div>`).join('') : `
          <div class="art-empty">
            <b>아직 등록한 아티스트가 없어요</b>
            <span>담당 아티스트를 먼저 등록하면 일정을 넣을 수 있어요.</span>
          </div>`}
        <button type="button" class="art-add ${full ? 'locked' : ''}" onclick="Artists.openForm()">
          ${full ? '🔒 ' : '+ '}아티스트 추가
        </button>
      </div>`;
  },

  openForm(id) {
    const items = this.list();
    const cur = id ? items.find(a => a.id === id) : null;
    if (!cur && !Plan.isPaid() && items.length >= Plan.FREE_ARTISTS) { Plan.upsell('artists'); return; }
    const color = cur?.color || this.COLORS[items.length % this.COLORS.length];
    App.showModal(cur ? '아티스트 수정' : '아티스트 추가', `
      <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
        <label class="art-label">이름 <span style="color:#ef4444;">*</span>
          <input id="art-name" class="form-input art-input" maxlength="40" value="${esc(cur?.name || '')}" placeholder="예: 김하늘" /></label>
        <label class="art-label">구분
          <select id="art-type" class="form-input art-input">${this.TYPES.map(t => `<option ${t === (cur?.type || '솔로') ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <div class="art-label">색 (일정 표시용)
          <div class="art-colors">${this.COLORS.map(c => `<button type="button" class="art-color ${c === color ? 'on' : ''}" data-c="${c}" style="background:${c}" aria-label="색 ${c}" onclick="Artists._pick(this)"></button>`).join('')}</div>
        </div>
        <button type="button" id="art-save" class="btn-primary" style="width:100%; padding:14px; font-weight:800;" onclick="Artists.save(${id ? escJs(id) : 'null'})">${cur ? '저장' : '등록'}</button>
      </div>`);
    setTimeout(() => { try { U.$('#art-name')?.focus(); } catch (e) { } }, 300);
  },

  _pick(btn) {
    btn.parentElement.querySelectorAll('.art-color').forEach(b => b.classList.toggle('on', b === btn));
  },

  async save(id) {
    const name = (U.$('#art-name')?.value || '').trim();
    if (!name) { U.toast('이름을 입력해 주세요.'); return; }
    const type = U.$('#art-type')?.value || '기타';
    const color = U.$('.art-color.on')?.dataset.c || this.COLORS[0];
    const btn = U.$('#art-save'); if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
    try {
      if (id) {
        await window.hqStore.updateArtist(id, { name, type, color });
        U.toast('아티스트를 수정했어요');
      } else {
        const newId = 'art_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await window.hqStore.addArtist({ id: newId, name, type, members: type === '그룹' ? 2 : 1, color, emoji: '✨', status: '활동중' });
        U.toast(`${name}님을 등록했어요`);
      }
      this._syncAssigned();
      App.closeModal();
      this.render();
    } catch (e) {
      const raw = String(e?.cause?.message || e?.message || '');
      if (/FREE_ARTIST_LIMIT/.test(raw)) { App.closeModal(); Plan.upsell('artists'); }
      else U.toast(navigator.onLine === false ? '인터넷 연결을 확인해 주세요.' : '저장하지 못했어요. 잠시 후 다시 해 주세요.');
      if (btn) { btn.disabled = false; btn.textContent = id ? '저장' : '등록'; }
    }
  },

  async remove(id) {
    const a = this.list().find(x => x.id === id);
    if (!a) return;
    if (!confirm(`${a.name}님을 삭제할까요?\n이 아티스트의 일정도 함께 지워져요.`)) return;
    try {
      await window.hqStore.deleteArtist(id);
      this._syncAssigned();
      U.toast('삭제했어요');
      this.render();
    } catch (e) {
      U.toast(navigator.onLine === false ? '인터넷 연결을 확인해 주세요.' : '삭제하지 못했어요. 잠시 후 다시 해 주세요.');
    }
  },
};
window.Artists = Artists;
