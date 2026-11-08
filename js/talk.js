/* =========================================
   RoadPlanner — 로드톡 (매니저 앱 전용 전체 화면: 공지 | 대화)
   - 공지: 본사가 '전체 공지방'에 보낸 공지. 긴급 공지는 맨 위 빨간 카드 + '확인했어요'
           본사가 볼 수 있게 'N명 중 M명 확인' (전체방 읽음 기록 기준)
   - 대화: 전체 공지방 · 본사 1:1 방 목록과 안 읽은 수 → 누르면 기존 대화창(js/chat.js)
   - chat.js는 본사 웹과 같이 쓰므로 고치지 않고, 여기서는 읽기·열기만 한다
   ========================================= */
const Talk = {
  tab: '공지',
  notices: [],
  reads: null,
  allRoom: null,
  _loading: false,

  open(tab) {
    try { if (window.Chat?.st?.open) window.Chat.close(); } catch (e) { }
    if (tab) this.tab = tab;
    App.navigate('talk');
  },

  online() { return !!(window.Chat && window.Chat.available && window.Chat.available()); },

  _split(body) {
    const m = String(body || '').match(/^\[([^\]]{1,80})\]\s*([\s\S]*)$/);
    return m ? { title: m[1], text: m[2] } : { title: '', text: String(body || '') };
  },
  _when(iso) {
    const d = new Date(iso); if (isNaN(d)) return '';
    const now = new Date();
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    if (d.toDateString() === now.toDateString()) return '오늘 ' + hm;
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return '어제 ' + hm;
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  },
  _ackKey(id) { return 'rp_talk_ack_' + id; },
  _acked(id) { try { return localStorage.getItem(this._ackKey(id)) === '1'; } catch (e) { return false; } },

  render() {
    const el = U.$('#screen-talk');
    if (!el) return;
    const unread = window.Chat?.st?.unread || {};
    const allId = (window.Chat?.st?.rooms || []).find(r => r.kind === 'all')?.id;
    const nUnread = allId ? (unread[allId] || 0) : 0;
    const dUnread = Object.entries(unread).filter(([k]) => k !== allId).reduce((a, [, v]) => a + (v || 0), 0);
    const tabs = [['공지', nUnread], ['대화', dUnread]];
    el.innerHTML = `
      <div class="talk-head">
        <div class="talk-title-row">
          <h1>로드톡</h1>
          <button type="button" class="talk-new" aria-label="본사에 메시지 쓰기" onclick="Talk.openChat()"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg></button>
        </div>
        <div class="talk-tabs" role="tablist">${tabs.map(([t, n]) => `<button type="button" role="tab" aria-selected="${this.tab === t}" class="${this.tab === t ? 'on' : ''}" onclick="Talk.setTab(${escJs(t)})">${t}${n ? `<span class="talk-badge">${n > 99 ? '99+' : n}</span>` : ''}</button>`).join('')}</div>
      </div>
      <div class="screen-scroll talk-body" id="talk-body"></div>`;
    this.draw();
    if (this.online()) this.load();
  },

  setTab(t) { this.tab = t; this.render(); },

  async load() {
    if (this._loading) return;
    this._loading = true;
    try {
      const sc = window.SupabaseClient;
      await window.Chat.refreshList().catch(() => { });
      this.allRoom = (window.Chat.st.rooms || []).find(r => r.kind === 'all') || null;
      if (this.allRoom) {
        const msgs = await sc.chatMessages(this.allRoom.id, { limit: 30 });
        this.notices = msgs.filter(m => m.body).reverse();
        this.reads = await sc.chatReadStatus(this.allRoom.id).catch(() => null);
      } else { this.notices = []; this.reads = null; }
    } catch (e) { this._err = true; }
    this._loading = false;
    if (State.screen === 'talk') this.draw();
  },

  draw() {
    const box = U.$('#talk-body');
    if (!box) return;
    if (this.tab === '공지') box.innerHTML = this._noticesHTML();
    else box.innerHTML = this._roomsHTML();
  },

  _noticesHTML() {
    if (!this.online()) {
      const list = (window.hqStore?.getBroadcasts?.() || []);
      return list.length ? list.map(n => this._card({ id: n.id, title: n.title, text: n.content, when: n.date, urgent: n.urgent, local: true })).join('')
        : `<div class="talk-empty">본사 공지가 없어요.<br>회사 계정으로 로그인하면 본사 공지와 대화를 볼 수 있어요.</div>`;
    }
    if (this._loading && !this.notices.length) return '<div class="talk-empty">불러오는 중...</div>';
    if (!this.notices.length) return '<div class="talk-empty">아직 본사 공지가 없어요.</div>';
    const me = window.SupabaseClient?.currentUser?.id;
    const urgent = this.notices.filter(m => m.is_urgent && m.sender_id !== me && !this._acked(m.id));
    const rest = this.notices.filter(m => !urgent.includes(m));
    const toCard = (m) => { const p = this._split(m.body); return this._card({ id: m.id, title: p.title || (m.is_urgent ? '긴급 공지' : '본사 공지'), text: p.text, when: this._when(m.created_at), urgent: m.is_urgent, mine: m.sender_id === me, sender: m.sender_name, at: m.created_at, needAck: urgent.includes(m) }); };
    return urgent.map(toCard).join('') + rest.map(toCard).join('') +
      `<button type="button" class="talk-more" onclick="Talk.openChat('all')">전체 공지방 대화로 보기</button>`;
  },

  _readCount(at) {
    const reads = this.reads; if (!reads || !reads.length || !at) return '';
    const t = new Date(at).getTime();
    const n = reads.filter(r => r.last_read_at && new Date(r.last_read_at).getTime() >= t).length;
    return `${reads.length}명 중 ${n}명 확인`;
  },

  _card(n) {
    const ack = n.needAck;
    const tag = n.urgent ? (ack ? '긴급 · 확인 필요' : '긴급 공지') : '본사 공지';
    const count = n.local ? '' : this._readCount(n.at);
    return `
      <article class="talk-card${n.urgent ? ' urgent' : ''}${ack ? ' need' : ''}">
        <div class="talk-card-top"><span class="talk-tag">${tag}</span><span class="talk-when">${esc(n.when || '')}</span></div>
        <h2>${esc(n.title)}</h2>
        ${n.text ? `<p>${esc(n.text).replace(/\n/g, '<br>')}</p>` : ''}
        <div class="talk-card-foot">
          <span>${esc([n.sender, count].filter(Boolean).join(' · '))}</span>
          ${ack ? `<button type="button" class="talk-ack" onclick="Talk.ack(${escJs(n.id)})">확인했어요</button>` : (n.urgent && !n.local && !n.mine ? '<span class="talk-acked">확인함</span>' : '')}
        </div>
      </article>`;
  },

  async ack(id) {
    try { localStorage.setItem(this._ackKey(id), '1'); } catch (e) { }
    try {
      if (this.allRoom) {
        await window.SupabaseClient.chatMarkRead(this.allRoom.id);
        this.reads = await window.SupabaseClient.chatReadStatus(this.allRoom.id).catch(() => this.reads);
        window.Chat.refreshList().catch(() => { });
      }
    } catch (e) { }
    U.toast('확인했어요. 본사에 확인 표시가 남아요.');
    this.render();
  },

  _roomsHTML() {
    if (!this.online()) return '<div class="talk-empty">회사 계정으로 로그인하면 본사와 대화할 수 있어요.</div>';
    const items = window.Chat._items ? window.Chat._items() : [];
    if (!items.length) return this._loading ? '<div class="talk-empty">불러오는 중...</div>' : '<div class="talk-empty">아직 대화방이 없어요.</div>';
    const unread = window.Chat.st.unread || {};
    const colors = ['#4f46e5', '#ec4899', '#0891b2', '#475569', '#16a34a', '#ea580c'];
    return `<ul class="talk-rooms">${items.map((it, i) => {
      const n = it.room ? (unread[it.room.id] || 0) : 0;
      const prev = this._split(it.room?.last_message_preview || '').text || it.room?.last_message_preview || it.sub;
      const time = it.room?.last_message_at ? this._when(it.room.last_message_at) : '';
      const target = it.room ? `{ id: ${escJs(it.room.id)} }` : `{ kind: ${escJs(it.kind)}, managerId: ${escJs(it.managerId || '')} }`;
      return `<li><button type="button" class="talk-room" onclick="Talk.openRoom(${target})">
        <span class="talk-av" style="background:${colors[i % colors.length]}">${esc(it.avatar)}</span>
        <span class="talk-room-main"><span class="talk-room-top"><b>${esc(it.name)}</b><small>${esc(time)}</small></span><span class="talk-room-prev">${esc(prev)}</span></span>
        ${n ? `<span class="talk-badge">${n > 99 ? '99+' : n}</span>` : ''}
      </button></li>`;
    }).join('')}</ul>`;
  },

  // 옛 대화방 목록 화면은 앱에서 쓰지 않는다 → 항상 대화방으로 바로 들어가고, 뒤로 가면 로드톡으로
  async openRoom(target) {
    if (!this.online()) return;
    let opts = target || {};
    if (opts.id) {
      const r = (window.Chat.st.rooms || []).find(x => x.id === opts.id);
      opts = r && r.kind === 'all' ? { kind: 'all' } : { managerId: (r && r.manager_id) || window.SupabaseClient?.currentUser?.id };
    } else if (opts.kind !== 'all') opts = { managerId: opts.managerId || window.SupabaseClient?.currentUser?.id };
    await this._openDirect(opts);
  },

  async openChat(kind) {
    if (!this.online()) { U.toast('회사 계정으로 로그인하면 본사와 대화할 수 있어요.'); return; }
    await this._openDirect(kind === 'all' ? { kind: 'all' } : { managerId: window.SupabaseClient?.currentUser?.id });
  },

  async _openDirect(opts) {
    document.body.classList.add('talk-app');
    await window.Chat.open(opts);
    // 방을 못 열었으면 빈 목록을 남기지 않고 닫는다
    setTimeout(() => {
      const root = document.getElementById('chat-root');
      if (window.Chat.st.open && root && !root.classList.contains('conv-open')) { window.Chat.close(); this.render(); }
    }, 2500);
  },
};
window.Talk = Talk;

// 대화방의 '뒤로'·'닫기' → 옛 목록 대신 로드톡 화면으로 (chat.js는 웹과 같이 쓰므로 여기서 가로챔)
document.addEventListener('click', (e) => {
  if (!document.body.classList.contains('talk-app')) return;
  const b = e.target.closest && e.target.closest('#chat-root [data-act="back"], #chat-root [data-act="close"]');
  if (!b) return;
  e.stopPropagation(); e.preventDefault();
  try { window.Chat.close(); } catch (err) { }
  if (State.screen === 'talk') Talk.render(); else Talk.open();
}, true);
