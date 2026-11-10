// =========================================
// 현장 메모: 장소별 주차·출입구·대기실·담당자 정보를 회사 안에서 공유
//  - 본사·매니저 누구나 남길 수 있고, 같은 장소 일정마다 자동으로 보입니다.
//  - 화면에 <div data-venue="장소 글자"></div> 를 넣고 VenueNotes.hydrate() 를 부르면 채워집니다.
// =========================================
const VenueNotes = {
  _cache: new Map(),   // key → { at, rows }
  TTL: 60000,

  _norm(s) { return String(s || '').toLowerCase().replace(/특별시|광역시|특별자치시|특별자치도/g, '').replace(/[\s·.,\-()[\]]/g, ''); },
  // 장소 글자 → 찾을 키들 (주소 키 우선 + 이름 키)
  keys(text) {
    const parts = (typeof KakaoAPI !== 'undefined' && KakaoAPI.splitPlace) ? KakaoAPI.splitPlace(text) : { name: String(text || ''), addr: '' };
    const k = [];
    if (parts.addr) k.push('a:' + this._norm(parts.addr));
    if (parts.name) k.push('n:' + this._norm(parts.name));
    return { keys: [...new Set(k.filter(x => x.length > 3))], label: parts.name || parts.addr || String(text || '').trim() };
  },
  _sc() { const sc = window.SupabaseClient; return sc && sc.client && sc.currentUser ? sc : null; },
  _me() { return window.SupabaseClient?.currentUser?.id || ''; },
  _isHq() { const r = localStorage.getItem('admin_bp_user_role') || localStorage.getItem('bp_user_role'); return r === 'ceo' || r === 'hq_admin'; },

  // 저장해 둔 메모를 바로 (시간이 지났어도) — 화면을 다시 그릴 때 깜빡이지 않게
  cached(text) {
    const { keys } = this.keys(text);
    const hit = keys.length ? this._cache.get(keys.join('|')) : null;
    return hit ? hit.rows : null;
  },

  async list(text, force = false) {
    const { keys, label } = this.keys(text);
    if (!keys.length) return [];
    const ck = keys.join('|');
    const hit = this._cache.get(ck);
    if (!force && hit && Date.now() - hit.at < this.TTL) return hit.rows;
    const sc = this._sc();
    if (!sc) return [];
    const cols = 'id, note, author_id, author_name, created_at, place_label';
    // 주소로 남긴 메모 + 같은 장소 이름으로 남긴 메모를 함께 (주소 없이 이름만 쓴 일정도 찾도록)
    const [byKey, byLabel] = await Promise.all([
      sc.client.from('venue_notes').select(cols).in('place_key', keys).order('created_at', { ascending: false }).limit(20),
      label ? sc.client.from('venue_notes').select(cols).eq('place_label', label).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] })
    ]);
    if (byKey.error) { console.warn('현장 메모 불러오기 실패', byKey.error); return hit ? hit.rows : []; }
    const seen = new Set();
    const rows = [...(byKey.data || []), ...(byLabel.data || [])].filter(r => !seen.has(r.id) && seen.add(r.id))
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    this._cache.set(ck, { at: Date.now(), rows });
    return rows;
  },

  async add(text) {
    const sc = this._sc();
    if (!sc) { alert('로그인 후 남길 수 있어요.'); return; }
    const { keys, label } = this.keys(text);
    if (!keys.length) return;
    const note = prompt(`📌 ${label}\n이 장소에 대해 다른 매니저가 알면 좋은 정보를 남겨 주세요.\n(예: 지하 2층 B구역 주차, 출연자 출입구는 정문 오른쪽, 대기실 5층)`, '');
    if (note === null || !note.trim()) return;
    const name = localStorage.getItem('admin_bp_user_name') || localStorage.getItem('bp_user_name') || '';
    const { error } = await sc.client.from('venue_notes').insert({ place_key: keys[0], place_label: label.slice(0, 200), note: note.trim().slice(0, 500), author_id: this._me(), author_name: name.slice(0, 60) });
    if (error) { alert('메모를 저장하지 못했어요: ' + (error.message || '')); return; }
    this._cache.clear();
    this.hydrate(document, true);
  },

  async remove(id) {
    const sc = this._sc();
    if (!sc || !confirm('이 메모를 지울까요?')) return;
    const { error } = await sc.client.from('venue_notes').delete().eq('id', id);
    if (error) { alert('지우지 못했어요: ' + (error.message || '')); return; }
    this._cache.clear();
    this.hydrate(document, true);
  },

  _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  _date(iso) { const d = new Date(iso); return isNaN(d) ? '' : `${d.getMonth() + 1}/${d.getDate()}`; },

  render(el, rows) {
    const text = el.getAttribute('data-venue') || '';
    const compact = el.hasAttribute('data-venue-compact');
    const arg = this._esc(JSON.stringify(text));
    const addBtn = `<button type="button" onclick="event.stopPropagation(); VenueNotes.add(${arg})" style="border:0;background:none;color:#3B45C4;font-size:13px;font-weight:700;cursor:pointer;padding:4px 0;">+ 메모 남기기</button>`;
    const put = (html) => { if (el._vHtml !== html) { el.innerHTML = html; el._vHtml = html; } };
    if (!rows.length) {
      put(compact ? '' : `<div style="margin-top:8px;font-size:13px;color:#5B616E;display:flex;align-items:center;gap:6px;">📌 <span>현장 메모 없음</span> ${addBtn}</div>`);
      return;
    }
    const me = this._me(), hq = this._isHq();
    const shown = rows.slice(0, compact ? 2 : 5);
    put(`
      <div style="margin-top:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:8px 10px;" onclick="event.stopPropagation()">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
          <span style="font-size:12.5px;font-weight:800;color:#92400e;">📌 현장 메모 ${rows.length}</span>${addBtn}
        </div>
        ${shown.map(r => `
          <div style="display:flex;gap:6px;align-items:flex-start;font-size:13.5px;color:#334155;line-height:1.45;padding:3px 0;border-top:1px dashed #fde68a;">
            <span style="flex:1;word-break:keep-all;">${this._esc(r.note)}${compact ? '' : ` <span style="font-size:11.5px;color:#a16207;white-space:nowrap;">· ${this._esc(r.author_name || '')} ${this._date(r.created_at)}</span>`}</span>
            ${(r.author_id === me || hq) ? `<button type="button" onclick="event.stopPropagation(); VenueNotes.remove(${this._esc(JSON.stringify(r.id))})" title="지우기" style="border:0;background:none;color:#b45309;cursor:pointer;font-size:14px;line-height:1;padding:0 2px;">×</button>` : ''}
          </div>`).join('')}
        ${rows.length > shown.length ? `<div style="font-size:12px;color:#a16207;">외 ${rows.length - shown.length}개</div>` : ''}
      </div>`);
  },

  async hydrate(root = document, force = false) {
    const els = [...(root.querySelectorAll ? root.querySelectorAll('[data-venue]') : [])];
    await Promise.all(els.map(async el => {
      const text = el.getAttribute('data-venue');
      if (!text) return;
      try { this.render(el, await this.list(text, force)); } catch (e) { }
    }));
  },

  // 화면이 바뀔 때마다 자동으로 채움
  autoHydrate() {
    if (this._obs || typeof MutationObserver === 'undefined') return;
    let t = null;
    this._obs = new MutationObserver(muts => {
      const added = [];
      muts.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.matches?.('[data-venue]')) added.push(n);
        n.querySelectorAll?.('[data-venue]').forEach(e => added.push(e));
      }));
      if (!added.length) return;
      // 화면을 다시 그린 순간(그리기 전)에 저장된 메모를 바로 채움 → 사라졌다 나타나는 깜빡임 없음
      added.forEach(el => { const rows = this.cached(el.getAttribute('data-venue') || ''); if (rows) { try { this.render(el, rows); } catch (e) { } } });
      clearTimeout(t); t = setTimeout(() => this.hydrate(), 150);
    });
    this._obs.observe(document.body, { childList: true, subtree: true });
  }
};
window.VenueNotes = VenueNotes;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => VenueNotes.autoHydrate());
else VenueNotes.autoHydrate();
