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
        <div class="art-count">등록 <b>${items.length}${paid ? '' : ` / ${Plan.FREE_ARTISTS}`}명</b> · ${paid ? '유료' : '무료'}</div>
        ${items.length ? items.map(a => {
          const nx = this.nextOf(a.id);
          return `
          <button type="button" class="art-card" onclick="Artists.openDetail(${escJs(a.id)})">
            <span class="art-dot" style="background:${esc(a.color || '#ec4899')}"></span>
            <span class="art-info">
              <span class="art-name">${esc(a.name)} <small class="art-type">${esc(a.type || '기타')}</small></span>
              <span class="art-next${nx ? '' : ' none'}">${nx ? esc(nx.text) : '다가오는 일정 없음'}</span>
            </span>
            <svg class="art-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
          </button>`;
        }).join('') : `
          <div class="art-empty">
            <b>아직 등록한 아티스트가 없어요</b>
            <span>담당 아티스트를 먼저 등록하면 일정을 넣을 수 있어요.</span>
          </div>`}
        ${full ? `
          <div class="art-add locked">
            <span class="art-lock-t">🔒 아티스트 더 추가하기</span>
            <span class="art-lock-s">유료로 바꾸면 여러 명을 함께 관리할 수 있어요</span>
            <button type="button" onclick="App.navigate('upgrade')">유료 혜택 보기</button>
          </div>` : `<button type="button" class="art-add" onclick="Artists.openForm()">+ 아티스트 추가</button>`}
      </div>`;
  },

  // 이 아티스트의 다음(오늘 남은 것 포함) 일정 한 줄
  _ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
  upcoming(artistId, max = 3) {
    try {
      const now = new Date(), today = this._ymd(now);
      const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      return (window.hqStore?.getSchedules?.() || [])
        .filter(s => s.artistId === artistId && s.date && (s.date > today || (s.date === today && (s.endTime || s.startTime || '23:59') >= hm)))
        .sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))
        .slice(0, max);
    } catch (e) { return []; }
  },
  _label(s) {
    const now = new Date(), today = this._ymd(now);
    const t = new Date(now); t.setDate(now.getDate() + 1);
    const day = s.date === today ? '오늘' : s.date === this._ymd(t) ? '내일' : `${+s.date.slice(5, 7)}/${+s.date.slice(8, 10)}`;
    return `${day}${s.startTime ? ' ' + s.startTime : ''} · ${s.isSecret ? '비공개 일정' : (s.title || '일정')}`;
  },
  nextOf(artistId) {
    const s = this.upcoming(artistId, 1)[0];
    return s ? { text: this._label(s), s } : null;
  },

  openDetail(id) {
    const a = this.list().find(x => x.id === id);
    if (!a) return;
    const up = this.upcoming(id, 3);
    App.showModal(a.name, `
      <div class="art-detail">
        <div class="art-detail-top"><span class="art-dot" style="background:${esc(a.color || '#ec4899')}"></span><span class="art-type">${esc(a.type || '기타')}</span></div>
        <div class="art-detail-h">다가오는 일정</div>
        ${up.length ? `<ul class="art-up">${up.map(s => `<li>${esc(this._label(s))}${s.location && !s.isSecret ? `<small>${esc(s.location)}</small>` : ''}</li>`).join('')}</ul>`
                    : '<div class="art-up-none">다가오는 일정이 없어요</div>'}
        <div class="art-detail-btns">
          <button type="button" class="art-btn" onclick="App.closeModal(); setTimeout(() => Artists.openForm(${escJs(id)}), 320)">정보 수정</button>
          <button type="button" class="art-btn danger" onclick="App.closeModal(); setTimeout(() => Artists.remove(${escJs(id)}), 320)">삭제</button>
        </div>
      </div>`);
  },

  openForm(id) {
    const items = this.list();
    const cur = id ? items.find(a => a.id === id) : null;
    if (!cur && !Plan.isPaid() && items.length >= Plan.FREE_ARTISTS) { Plan.upsell('artists'); return; }
    const color = cur?.color || this.COLORS[items.length % this.COLORS.length];
    App.showModal(cur ? '아티스트 수정' : '아티스트 추가', `
      <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
        <label class="art-label"><span>이름 <span style="color:#ef4444;">*</span></span>
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
