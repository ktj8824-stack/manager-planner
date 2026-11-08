/* =========================================
   RoadPlanner — 긴급 지원 (소속 매니저, 전체 화면)
   - 맨 위 큰 빨간 버튼: 본사 관제실(대표·관리자)에게 전화
   - 긴급 보고: 상황 하나만 골라도 보낼 수 있음, 지금 일정·위치·시각 자동 첨부
   - 실수 방지: 두 번 눌러야 보내짐, 보낸 뒤 상태 표시
   ========================================= */
const Sos = {
  TYPES: ['교통 지연', '차량 사고 · 고장', '아티스트 건강', '현장 안전 · 인파', '일정 변경 필요', '기타'],
  st: { type: null, stage: 'idle', gps: null, photo: null, phones: null },

  open() {
    try { if (window.Chat && window.Chat.st && window.Chat.st.open) window.Chat.close(); } catch (e) { }
    this.st = { type: null, stage: 'idle', gps: null, photo: null, phones: this.st.phones };
    App.navigate('sos');
  },

  // 지금(또는 다음) 내 일정 한 줄
  _current() {
    try {
      const now = new Date();
      const ymd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const me = localStorage.getItem('bp_manager_id');
      const list = (window.hqStore?.getSchedules?.() || []).filter(s => s.date === ymd && (!me || !s.managerId || s.managerId === me));
      if (!list.length) return null;
      const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const s = list.find(x => (x.endTime || '23:59') >= hm) || list[list.length - 1];
      const artist = (window.hqStore.getArtists() || []).find(a => a.id === s.artistId);
      const step = (s.timeline || []).find(t => !t.done && t.time);
      return { text: `${artist ? String(artist.name).replace(/\s*\([^)]*\)/g, '') + ' · ' : ''}${s.isSecret ? '비공개 일정' : s.title}${step ? ` (${step.time} ${String(step.label || '').replace(/^\[[^\]]+\]\s*/, '').slice(0, 20)})` : ''}`, place: s.isSecret ? '' : (s.location || '') };
    } catch (e) { return null; }
  },

  render() {
    const el = U.$('#screen-sos');
    if (!el) return;
    const cur = this._current();
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    el.innerHTML = `
      <div class="header sos-header">
        <h1 class="header-title" style="color:#b91c1c;">긴급 지원</h1>
        <button class="header-btn" onclick="App.navigate('home')" aria-label="닫기"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
      </div>
      <div class="screen-scroll sos-wrap">
        <section class="sos-info">
          <span class="sos-info-h">보고에 함께 보내는 정보</span>
          <span class="sos-info-main">${esc(cur ? cur.text : '오늘 내 일정 없음')}</span>
          <span class="sos-info-sub" id="sos-gps-line">${this.st.gps ? '현재 위치' : '위치 확인 중'} · ${hm} 시각 자동 첨부</span>
        </section>

        <div id="sos-call"><button type="button" class="sos-call" disabled>본사 연락처 불러오는 중...</button></div>

        <section class="sos-box">
          <h2>긴급 보고 보내기</h2>
          <span class="sos-hint">무슨 일인가요? 하나만 골라도 바로 보낼 수 있어요</span>
          <div class="sos-types">${this.TYPES.map(t => `<button type="button" aria-pressed="${this.st.type === t}" class="${this.st.type === t ? 'on' : ''}" onclick="Sos.pick(${escJs(t)})">${esc(t)}</button>`).join('')}</div>
          <label class="sos-label">한 줄 메모 (선택)
            <textarea id="sos-memo" rows="2" maxlength="300" placeholder="예: 올림픽대로 사고로 정체, 20분 늦을 것 같아요"></textarea></label>
          <label class="sos-photo"><input type="file" accept="image/*" capture="environment" hidden onchange="Sos.photo(this)"><span id="sos-photo-txt">${this.st.photo ? '📷 사진 1장 첨부됨' : '📷 사진 추가'}</span></label>
          <button type="button" id="sos-send" onclick="Sos.send()"></button>
        </section>

        <div class="sos-119">
          <span>생명이 위험하면</span>
          <a href="tel:119">119</a>
          <a href="tel:112">112</a>
        </div>
      </div>`;
    this._sendBtn();
    this._loadPhones();
    this._gps();
  },

  pick(t) { this.st.type = t; this.st.stage = 'idle'; document.querySelectorAll('.sos-types button').forEach(b => { const on = b.textContent === t; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); this._sendBtn(); },

  photo(input) { this.st.photo = input.files && input.files[0] || null; const t = U.$('#sos-photo-txt'); if (t) t.textContent = this.st.photo ? '📷 사진 1장 첨부됨' : '📷 사진 추가'; },

  _sendBtn() {
    const b = U.$('#sos-send'); if (!b) return;
    const st = this.st;
    let label = '보낼 내용을 골라 주세요', cls = 'idle';
    if (st.type && st.stage === 'idle') { label = '본사에 보고 보내기'; cls = 'ready'; }
    if (st.stage === 'confirm') { label = '한 번 더 누르면 보내져요'; cls = 'confirm'; }
    if (st.stage === 'sending') { label = '보내는 중...'; cls = 'confirm'; }
    if (st.stage === 'sent') { label = '보냈어요 · 본사가 확인하면 알려 드려요'; cls = 'sent'; }
    b.textContent = label; b.className = 'sos-send ' + cls;
    b.disabled = st.stage === 'sending';
  },

  _gps() {
    if (this.st.gps || !navigator.geolocation) { if (!navigator.geolocation) { const l = U.$('#sos-gps-line'); if (l) l.textContent = l.textContent.replace('위치 확인 중', '위치 없음'); } return; }
    navigator.geolocation.getCurrentPosition(pos => {
      this.st.gps = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
      const l = U.$('#sos-gps-line'); if (l) l.textContent = l.textContent.replace('위치 확인 중', '현재 위치');
    }, () => { const l = U.$('#sos-gps-line'); if (l) l.textContent = l.textContent.replace('위치 확인 중', '위치 권한 없음'); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  },

  // 같은 회사 본사(대표·관리자) 전화번호 — 샘플 번호는 쓰지 않음
  async _loadPhones() {
    const box = U.$('#sos-call'); if (!box) return;
    const draw = () => {
      const rows = this.st.phones || [];
      box.innerHTML = rows.length
        ? rows.slice(0, 3).map((p, i) => `<a class="sos-call${i ? ' sub' : ''}" href="tel:${esc(p.tel)}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>${i ? esc(p.name) + '에게 전화' : '본사 관제실에 전화' + (rows.length > 1 ? ` · ${esc(p.name)}` : '')}</a>`).join('')
        : `<div class="sos-call none">본사 전화번호가 아직 등록되지 않았어요. 아래 긴급 보고로 먼저 알려 주세요.</div>`;
    };
    if (this.st.phones) { draw(); return; }
    try {
      const sc = window.SupabaseClient;
      if (!sc?.client || !sc.currentUser) { this.st.phones = []; draw(); return; }
      const { data, error } = await sc.client.from('profiles').select('name, phone, role').in('role', ['ceo', 'hq_admin']);
      if (error) throw error;
      this.st.phones = (data || []).map(p => ({ name: p.name || '본사', tel: String(p.phone || '').replace(/[^0-9+]/g, '') })).filter(p => p.tel.length >= 8);
    } catch (e) { this.st.phones = []; }
    draw();
  },

  async send() {
    const st = this.st;
    if (!st.type || st.stage === 'sending') return;
    if (st.stage === 'sent') { st.stage = 'idle'; st.type = null; this.render(); return; }
    if (st.stage === 'idle') { st.stage = 'confirm'; this._sendBtn(); U.haptic && U.haptic(); return; }
    // confirm → 보내기
    if (!window.Chat || !window.Chat.available()) { U.toast('서버에 연결되어 있지 않아 보내지 못했어요. 위 전화 버튼으로 연락해 주세요.'); st.stage = 'idle'; this._sendBtn(); return; }
    st.stage = 'sending'; this._sendBtn();
    const user = localStorage.getItem('bp_user_name') || '현장 매니저';
    const cur = this._current();
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const memo = (U.$('#sos-memo')?.value || '').trim();
    const lines = [
      `일정: ${cur ? cur.text : '오늘 내 일정 없음'}`,
      cur && cur.place ? `현장: ${cur.place}` : '',
      st.gps ? `현재 위치: https://map.kakao.com/link/map/긴급위치,${st.gps.lat},${st.gps.lng}` : '현재 위치: 확인 못 함',
      `시각: ${hm}`,
      memo ? `메모: ${memo}` : '',
    ].filter(Boolean);
    try {
      await window.Chat.sendNotice({ targetId: 'ALL', title: `🚨 현장 긴급보고 · ${st.type} (${user})`, content: lines.join('\n'), isUrgent: true, imageFile: st.photo });
      st.stage = 'sent'; st.photo = null;
      this._sendBtn();
      U.haptic && U.haptic();
    } catch (err) {
      st.stage = 'confirm'; this._sendBtn();
      U.toast(navigator.onLine === false ? '인터넷 연결을 확인하고 다시 눌러 주세요.' : '보내지 못했어요. 다시 누르거나 전화로 알려 주세요.');
    }
  },
};
window.Sos = Sos;
