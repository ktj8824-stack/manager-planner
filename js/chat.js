/* 대화창 (웹 관리자·매니저 앱 공용)
   - 본사(대표/관리자): 전체방 + 매니저별 1:1방
   - 매니저: 전체방 + 본사와의 1:1방
   서버: Supabase chat_rooms / chat_messages / chat_reads, 사진은 chat-images 저장소 */
(function () {
  'use strict';
  const PUSH_PUBLIC_KEY = 'BALCnXsE8MK70Vc-0xYyObh8onv97bjYQZ8VayLJmRgI4AmZsX6Py67Y9Mz3RjOWAdratDLAm23nzspDJWlLmCg'; // 공개 키 (비밀 아님)
  // 한 번 눌러 바로 보내는 답장 (운전 중에도 쓰기 쉽게 큰 버튼)
  const QUICK = {
    manager: ['✅ 확인했습니다', '🚗 이동 중입니다', '📍 도착했습니다', '⏱ 10분 늦습니다', '📞 전화 부탁드립니다'],
    hq: ['✅ 확인했습니다', '👍 수고하셨습니다', '📞 전화 드리겠습니다', '📍 현재 위치 알려 주세요']
  };
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const ICON = {
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    image: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.6"/><path d="m21 15-4.5-4.5L6 21"/></svg>'
  };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const Chat = {
    st: { open: false, rooms: [], unread: {}, active: null, msgs: [], seen: new Set(), poll: null, listTimer: null, sending: false, pending: null, hasOlder: false, inited: false, reads: null, query: '', searchTimer: null },
    onUnreadChange: null,   // (총 안 읽은 수) => void
    onIncoming: null,       // (메시지, 방, 보낸사람) => void   (대화창이 닫혀 있거나 다른 방일 때)

    sc() { return window.SupabaseClient; },
    me() {
      const sc = this.sc();
      return { id: sc?.currentUser?.id || '', role: sc?.currentProfile?.role || '', name: sc?.currentProfile?.name || '' };
    },
    isHq() { const r = this.me().role; return r === 'ceo' || r === 'hq_admin'; },
    available() { const sc = this.sc(); return !!(sc && sc.isConfigured && sc.currentUser?.id && sc.currentProfile?.company_id); },
    totalUnread() { return Object.values(this.st.unread).reduce((a, b) => a + b, 0); },

    // 로그인 직후 한 번 호출: 안 읽은 수 계산 + 실시간 수신
    init() {
      if (this.st.inited) return;
      if (!this.available()) {   // 로그인 정보가 아직 준비 안 됐으면 잠시 후 다시 확인
        this._tries = (this._tries || 0) + 1;
        if (this._tries < 20) setTimeout(() => this.init(), 1500);
        return;
      }
      this.st.inited = true;
      this.sc().chatSubscribe((m) => this._incoming(m));
      this._syncPush();
      try {
        navigator.serviceWorker?.addEventListener('message', (ev) => {
          if (ev.data?.type === 'OPEN_CHAT') this._openFromPush(ev.data.roomId);
          else if (ev.data?.type === 'PUSH_RESUBSCRIBE') this._syncPush();
        });
        const rid = new URLSearchParams(location.search).get('chat');
        if (rid !== null) { history.replaceState(null, '', location.pathname); setTimeout(() => this._openFromPush(rid), 600); }
      } catch (e) { }
      this.refreshList().catch(() => { });
      this.st.listTimer = setInterval(() => { if (!document.hidden) this.refreshList().catch(() => { }); }, 45000);
    },

    async _openFromPush(roomId) {
      await this.open();
      if (roomId) this.select({ id: roomId });
    },

    async refreshList() {
      if (!this.available()) return;
      const [rooms, unread] = await Promise.all([this.sc().chatRooms(), this.sc().chatUnread()]);
      this.st.rooms = rooms; this.st.unread = unread;
      this._fireUnread();
      if (this.st.open) this._renderList();
    },
    _fireUnread() { try { this.onUnreadChange && this.onUnreadChange(this.totalUnread()); } catch (e) { } },

    // ── 화면 만들기 ──
    _build() {
      if (document.getElementById('chat-root')) return;
      const root = document.createElement('div');
      root.id = 'chat-root'; root.className = 'chat-root'; root.hidden = true;
      root.innerHTML = `
        <div class="chat-shell" role="dialog" aria-label="로디톡">
          <aside class="chat-list">
            <div class="chat-head"><h2>로디톡</h2><button class="chat-iconbtn" data-act="close" aria-label="닫기">${ICON.close}</button></div>
            <div class="chat-pushbar" id="chat-pushbar" hidden></div>
            <div class="chat-search"><input id="chat-search" type="search" placeholder="대화·이름 검색" autocomplete="off"></div>
            <div class="chat-rooms" id="chat-rooms"></div>
          </aside>
          <section class="chat-conv">
            <div class="chat-head">
              <button class="chat-iconbtn chat-back" data-act="back" aria-label="목록">${ICON.back}</button>
              <div class="chat-title" id="chat-title">대화를 선택하세요</div>
              <button class="chat-iconbtn" data-act="close" aria-label="닫기">${ICON.close}</button>
            </div>
            <div class="chat-msgs" id="chat-msgs"><div class="chat-placeholder">왼쪽에서 대화를 선택하세요.</div></div>
            <div class="chat-attach" id="chat-attach" hidden></div>
            <div class="chat-quick" id="chat-quick" hidden></div>
            <div class="chat-composer" id="chat-composer" hidden>
              <label class="chat-iconbtn" title="사진" style="cursor:pointer">${ICON.image}<input type="file" id="chat-file" accept="image/*" hidden></label>
              <textarea id="chat-input" rows="1" placeholder="메시지 입력" maxlength="2000"></textarea>
              <label class="chat-urgent-toggle" id="chat-urgent-wrap" hidden><input type="checkbox" id="chat-urgent"> 긴급</label>
              <button class="chat-send" id="chat-send">전송</button>
            </div>
          </section>
        </div>`;
      document.body.appendChild(root);
      root.addEventListener('click', (e) => {
        if (e.target === root && window.innerWidth > 760) return this.close();
        const act = e.target.closest('[data-act]')?.dataset.act;
        if (act === 'close') this.close();
        else if (act === 'back') { root.classList.remove('conv-open'); this.st.active = null; this._stopPoll(); this._renderList(); }
        const push = e.target.closest('[data-push]')?.dataset.push;
        if (push === 'on') this.enablePush(); else if (push === 'off') this.disablePush();
        const room = e.target.closest('[data-room]');
        if (room) this.select(room.dataset.room === 'virtual' ? { kind: 'direct', managerId: room.dataset.manager } : { id: room.dataset.room });
      });
      const input = root.querySelector('#chat-input');
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 760 && !e.isComposing) { e.preventDefault(); this.send(); } });
      input.addEventListener('input', () => { input.style.height = 'auto'; input.style.height = Math.min(input.scrollHeight, 120) + 'px'; });
      root.querySelector('#chat-search').addEventListener('input', (e) => {
        this.st.query = e.target.value.trim();
        clearTimeout(this.st.searchTimer);
        this.st.searchTimer = setTimeout(() => this._renderList(), 300);
      });
      root.querySelector('#chat-quick').addEventListener('click', (e) => {
        const b = e.target.closest('[data-quick]'); if (b) this.send(b.dataset.quick);
      });
      root.querySelector('#chat-send').addEventListener('click', () => this.send());
      root.querySelector('#chat-file').addEventListener('change', (e) => this._pickImage(e.target.files?.[0], e.target));
      root.querySelector('#chat-msgs').addEventListener('click', (e) => {
        if (e.target.matches('.chat-img') && e.target.src) this._lightbox(e.target.src);
        if (e.target.matches('.chat-more')) this._loadOlder();
      });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.st.open) this.close(); });
    },

    async open(opts = {}) {
      this._build();
      const root = document.getElementById('chat-root');
      if (!this.available()) {
        this._toast('대화는 로그인한 회사 계정에서 서버에 연결되어 있을 때 사용할 수 있습니다.');
        return;
      }
      this.st.open = true; root.hidden = false; this._askNotifyPermission();
      root.querySelector('#chat-urgent-wrap').hidden = !this.isHq();
      this._renderList();
      try {
        await this.refreshList();
        if (this.isHq()) await this._ensureAllRoom();
        else await this._ensureMyRoom();
        await this.refreshList();
      } catch (e) { this._listMessage('대화방을 불러오지 못했습니다. ' + esc(e.message || '')); return; }
      if (opts.managerId) this.select({ kind: 'direct', managerId: opts.managerId });
      else if (opts.kind === 'all') this.select({ kind: 'all' });
      else if (window.innerWidth > 760 && !this.st.active) { const first = this._items()[0]; if (first) this.select(first.room ? { id: first.room.id } : { kind: first.kind, managerId: first.managerId }); }
    },

    close() {
      this.st.open = false; this.st.active = null; this._stopPoll();
      const root = document.getElementById('chat-root');
      if (root) { root.hidden = true; root.classList.remove('conv-open'); }
      this.refreshList().catch(() => { });
    },

    async _ensureAllRoom() { if (!this.st.rooms.some(r => r.kind === 'all')) await this.sc().chatEnsureRoom('all'); },
    async _ensureMyRoom() { if (!this.st.rooms.some(r => r.kind === 'direct')) await this.sc().chatEnsureRoom('direct', this.me().id); },

    // 목록에 보일 항목 (본사는 아직 대화방이 없는 매니저도 함께 표시)
    _items() {
      const rooms = this.st.rooms;
      const items = [];
      const all = rooms.find(r => r.kind === 'all');
      if (all || this.isHq()) items.push({ key: 'all', kind: 'all', room: all || null, name: '전체 공지방', sub: '모든 매니저가 함께 보는 대화', avatar: '전' });
      if (this.isHq()) {
        let people = [];
        try { people = (window.hqStore?.getManagers?.() || []).filter(m => UUID.test(m.id || '') && !['ceo', 'hq_admin'].includes(m.role)); } catch (e) { }
        const byMgr = new Map(rooms.filter(r => r.kind === 'direct').map(r => [r.manager_id, r]));
        const seen = new Set();
        people.forEach(m => { seen.add(m.id); items.push({ key: m.id, kind: 'direct', managerId: m.id, room: byMgr.get(m.id) || null, name: m.name || m.email || '매니저', sub: '1:1 대화', avatar: (m.name || '?').slice(0, 1) }); });
        byMgr.forEach((r, id) => { if (!seen.has(id)) items.push({ key: id, kind: 'direct', managerId: id, room: r, name: r.manager?.name || r.manager?.email || '매니저', sub: '1:1 대화', avatar: (r.manager?.name || '?').slice(0, 1) }); });
      } else {
        rooms.filter(r => r.kind === 'direct').forEach(r => items.push({ key: r.id, kind: 'direct', managerId: r.manager_id, room: r, name: '본사 (대표)', sub: '1:1 대화', avatar: '본' }));
      }
      const t = (it) => it.room?.last_message_at ? new Date(it.room.last_message_at).getTime() : 0;
      return items.sort((a, b) => (a.kind === 'all' ? -1 : 0) - (b.kind === 'all' ? -1 : 0) || t(b) - t(a));
    },

    _listMessage(html) { const el = document.getElementById('chat-rooms'); if (el) el.innerHTML = `<div class="chat-empty">${html}</div>`; },

    _renderList() {
      const el = document.getElementById('chat-rooms'); if (!el) return;
      const q = this.st.query;
      let items = this._items();
      if (q) items = items.filter(it => it.name.toLowerCase().includes(q.toLowerCase()));
      if (q && q.length >= 2) this._searchMessages(q);
      if (!items.length) { if (q) { el.innerHTML = '<div class="chat-empty" id="chat-hits-note">검색 중...</div><div id="chat-hits"></div>'; } else this._listMessage('아직 대화방이 없습니다.<br>본사가 대화를 시작하면 여기에 나타납니다.'); return; }
      el.innerHTML = items.map(it => {
        const unread = it.room ? (this.st.unread[it.room.id] || 0) : 0;
        const active = this.st.active && it.room && this.st.active.id === it.room.id;
        const prev = it.room?.last_message_preview || it.sub;
        const time = it.room?.last_message_at ? this._shortTime(it.room.last_message_at) : '';
        return `<button class="chat-room${active ? ' active' : ''}" data-room="${it.room ? esc(it.room.id) : 'virtual'}" data-manager="${esc(it.managerId || '')}">
          <span class="chat-avatar${it.kind === 'all' ? ' all' : ''}">${esc(it.avatar)}</span>
          <span class="chat-room-main"><span class="chat-room-top"><span class="chat-room-name">${esc(it.name)}</span><span class="chat-room-time">${esc(time)}</span></span>
          <span class="chat-room-prev"><span>${esc(prev)}</span>${unread ? `<span class="chat-unread">${unread > 99 ? '99+' : unread}</span>` : ''}</span></span></button>`;
      }).join('') + (q && q.length >= 2 ? '<div class="chat-hits-title">메시지 검색 결과</div><div id="chat-hits"><div class="chat-empty" id="chat-hits-note">검색 중...</div></div>' : '');
    },

    // 메시지 내용 검색 결과 (눌러서 그 대화방 열기)
    async _searchMessages(q) {
      const seq = this._searchSeq = (this._searchSeq || 0) + 1;
      let hits = [];
      try { hits = await this.sc().chatSearch(q); } catch (e) { hits = null; }
      if (seq !== this._searchSeq || this.st.query !== q) return;
      const box = document.getElementById('chat-hits'); if (!box) return;
      if (hits === null) { box.innerHTML = '<div class="chat-empty">검색하지 못했습니다.</div>'; return; }
      if (!hits.length) { box.innerHTML = '<div class="chat-empty">일치하는 메시지가 없습니다.</div>'; return; }
      const names = new Map(this._items().filter(i => i.room).map(i => [i.room.id, i.name]));
      const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      box.innerHTML = hits.map(h => {
        const body = esc(h.body || '').slice(0, 160).replace(re, '<mark>$1</mark>');
        return `<button class="chat-room chat-hit" data-room="${esc(h.room_id)}"><span class="chat-room-main"><span class="chat-room-top"><span class="chat-room-name">${esc(names.get(h.room_id) || '대화')}</span><span class="chat-room-time">${esc(this._shortTime(h.created_at))}</span></span><span class="chat-room-prev"><span>${esc(h.sender_name || '')}: ${body}</span></span></span></button>`;
      }).join('');
    },

    // ── 대화방 열기 ──
    async select(target) {
      const root = document.getElementById('chat-root'); if (!root) return;
      let room = target.id ? this.st.rooms.find(r => r.id === target.id) : null;
      try {
        if (!room) room = await this.sc().chatEnsureRoom(target.kind, target.managerId || null);
        if (!this.st.rooms.some(r => r.id === room.id)) this.st.rooms.push(room);
      } catch (e) { this._toast('대화방을 열지 못했습니다. ' + (e.message || '')); return; }
      this.st.active = room; this.st.msgs = []; this.st.seen = new Set(); this.st.reads = null;
      root.classList.add('conv-open');
      const title = room.kind === 'all' ? '전체 공지방' : (this.isHq() ? (room.manager?.name || '매니저') : '본사 (대표)');
      root.querySelector('#chat-title').innerHTML = `${esc(title)}<small>${room.kind === 'all' ? '모든 매니저에게 전달됩니다' : '1:1 대화'}</small>`;
      root.querySelector('#chat-composer').hidden = false;
      const quick = root.querySelector('#chat-quick');
      quick.innerHTML = (this.isHq() ? QUICK.hq : QUICK.manager).map(t => `<button type="button" data-quick="${esc(t)}">${esc(t)}</button>`).join('');
      quick.hidden = false;
      this._renderList();
      const box = root.querySelector('#chat-msgs'); box.innerHTML = '<div class="chat-placeholder">불러오는 중...</div>';
      try {
        const list = await this.sc().chatMessages(room.id, { limit: 40 });
        if (this.st.active?.id !== room.id) return;
        this.st.hasOlder = list.length >= 40;
        list.forEach(m => { this.st.msgs.push(m); this.st.seen.add(m.id); });
        await this._loadReads();
        await this._renderMessages(true);
        this._markRead();
      } catch (e) { box.innerHTML = `<div class="chat-placeholder">메시지를 불러오지 못했습니다.<br>${esc(e.message || '')}</div>`; return; }
      this._startPoll();
      setTimeout(() => root.querySelector('#chat-input')?.focus(), 50);
    },

    async _loadOlder() {
      const room = this.st.active; if (!room || !this.st.msgs.length) return;
      const list = await this.sc().chatMessages(room.id, { before: this.st.msgs[0].created_at, limit: 40 });
      this.st.hasOlder = list.length >= 40;
      list.filter(m => !this.st.seen.has(m.id)).forEach(m => this.st.seen.add(m.id));
      this.st.msgs = [...list, ...this.st.msgs];
      const box = document.getElementById('chat-msgs'); const h = box.scrollHeight;
      await this._renderMessages(false);
      box.scrollTop = box.scrollHeight - h;
    },

    // 상대방이 읽은 시각 (바뀌었으면 true)
    async _loadReads() {
      const room = this.st.active; if (!room) return false;
      let list = null;
      try { list = await this.sc().chatReadStatus(room.id); } catch (e) { return false; }
      if (this.st.active?.id !== room.id) return false;
      const sig = JSON.stringify(list);
      const changed = sig !== this.st.readsSig; this.st.readsSig = sig; this.st.reads = list;
      return changed;
    },

    // 내가 보낸 메시지의 읽음 표시 문구
    _readLabel(m) {
      const reads = this.st.reads; if (!reads || !reads.length) return '';
      const t = new Date(m.created_at).getTime();
      const n = reads.filter(r => r.last_read_at && new Date(r.last_read_at).getTime() >= t).length;
      if (this.st.active?.kind === 'all') return n ? `읽음 ${n}` : '';
      return n ? '읽음' : '';
    },

    _startPoll() {
      this._stopPoll();
      this.st.poll = setInterval(async () => {
        const room = this.st.active; if (!room || document.hidden) return;
        try {
          const last = this.st.msgs[this.st.msgs.length - 1];
          const list = await this.sc().chatMessagesAfter(room.id, last ? last.created_at : '1970-01-01T00:00:00Z');
          const fresh = list.filter(m => !this.st.seen.has(m.id));
          const readsChanged = await this._loadReads();
          if (fresh.length) this._append(fresh); else if (readsChanged) this._renderMessages(false, true);
        } catch (e) { /* 다음 주기에 다시 */ }
      }, 4000);
    },
    _stopPoll() { if (this.st.poll) clearInterval(this.st.poll); this.st.poll = null; },

    _append(list) {
      if (!list.length) return;
      list.forEach(m => { this.st.msgs.push(m); this.st.seen.add(m.id); });
      this._renderMessages(true, true).then(() => this._markRead());
    },

    // 실시간으로 들어온 메시지
    _incoming(m) {
      if (!m || m.sender_id === this.me().id) return;
      const room = this.st.rooms.find(r => r.id === m.room_id);
      if (this.st.open && this.st.active?.id === m.room_id) { if (!this.st.seen.has(m.id)) this._append([m]); return; }
      this.st.unread[m.room_id] = (this.st.unread[m.room_id] || 0) + 1;
      if (room) { room.last_message_at = m.created_at; room.last_message_preview = (m.body || '(사진)').slice(0, 80); }
      this._fireUnread();
      if (this.st.open) this._renderList();
      if (!room) this.refreshList().catch(() => { });
      this._osNotify(m, room);
      try { if (this.onIncoming) this.onIncoming(m, room, m.sender_name); else this._toast((m.sender_name || '새 메시지') + ': ' + (m.body || '(사진)'), m.is_urgent); } catch (e) { }
    },

    async _markRead() {
      const room = this.st.active; if (!room) return;
      this.st.unread[room.id] = 0; this._fireUnread(); this._renderList();
      try { await this.sc().chatMarkRead(room.id); } catch (e) { }
    },

    // ── 메시지 그리기 ──
    async _renderMessages(stick, soft) {
      const box = document.getElementById('chat-msgs'); if (!box) return;
      const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 120;
      const me = this.me().id;
      let html = this.st.hasOlder ? '<button class="chat-more">이전 대화 더 보기</button>' : '';
      if (!this.st.msgs.length) html += '<div class="chat-placeholder">아직 메시지가 없습니다.<br>첫 메시지를 보내 보세요.</div>';
      let day = '', prevSender = '';
      for (const m of this.st.msgs) {
        const d = new Date(m.created_at);
        const dayKey = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
        if (dayKey !== day) { day = dayKey; prevSender = ''; html += `<div class="chat-day"><span>${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일</span></div>`; }
        const mine = m.sender_id === me;
        const showName = !mine && prevSender !== m.sender_id;
        prevSender = m.sender_id;
        const time = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const body = m.body ? `<div class="chat-bubble${m.is_urgent ? ' urgent' : ''}">${m.is_urgent ? '<span class="chat-urgent-tag">긴급</span><br>' : ''}${esc(m.body)}</div>` : '';
        const img = m.image_path ? `<img class="chat-img" data-path="${esc(m.image_path)}" alt="사진" loading="lazy">` : '';
        const rl = mine ? this._readLabel(m) : '';
        html += `<div class="chat-row${mine ? ' mine' : ''}">${mine ? `<span class="chat-time">${rl ? `<b class="chat-read">${esc(rl)}</b><br>` : ''}${time}</span>` : ''}
          <div class="chat-bubble-wrap">${showName ? `<div class="chat-sender">${esc(m.sender_name || '')}</div>` : ''}${img}${body}</div>${mine ? '' : `<span class="chat-time">${time}</span>`}</div>`;
      }
      box.innerHTML = html;
      const paths = this.st.msgs.filter(m => m.image_path).map(m => m.image_path);
      if (paths.length) {
        try {
          const urls = await this.sc().chatImageUrls(paths);
          box.querySelectorAll('.chat-img').forEach(el => { const u = urls[el.dataset.path]; if (u) el.src = u; });
        } catch (e) { /* 사진 주소를 못 받아도 글은 보입니다 */ }
      }
      if (stick && (!soft || nearBottom)) box.scrollTop = box.scrollHeight;
    },

    // ── 보내기 ──
    async _pickImage(file, input) {
      if (!file) return;
      if (!/^image\//.test(file.type)) { this._toast('사진 파일만 보낼 수 있습니다.'); return; }
      try {
        const blob = await this._compress(file);
        this.st.pending = blob;
        const box = document.getElementById('chat-attach');
        box.hidden = false;
        box.innerHTML = '<img alt="첨부 사진"><button aria-label="사진 빼기">×</button>';
        box.querySelector('img').src = URL.createObjectURL(blob);
        box.querySelector('button').onclick = () => this._clearPending();
      } catch (e) { this._toast('사진을 처리하지 못했습니다.'); }
      if (input) input.value = '';
    },
    _clearPending() { this.st.pending = null; const box = document.getElementById('chat-attach'); if (box) { box.hidden = true; box.innerHTML = ''; } },

    // 큰 사진은 가로/세로 1280px, jpeg 82%로 줄여서 올린다 (용량·속도)
    _compress(file) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file); const img = new Image();
        img.onload = () => {
          const max = 1280; const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          c.toBlob((b) => b ? resolve(b) : reject(new Error('변환 실패')), 'image/jpeg', 0.82);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지를 읽을 수 없습니다.')); };
        img.src = url;
      });
    },

    async send(quickText) {
      const room = this.st.active; if (!room || this.st.sending) return;
      const input = document.getElementById('chat-input');
      const isQuick = typeof quickText === 'string';
      const body = isQuick ? quickText.trim() : input.value.trim();
      if (!body && !(this.st.pending && !isQuick)) return;
      const urgent = this.isHq() && document.getElementById('chat-urgent')?.checked;
      const btn = document.getElementById('chat-send');
      this.st.sending = true; btn.disabled = true; btn.textContent = '보내는 중';
      try {
        const m = await this.sc().chatSend(room.id, { body, imageBlob: isQuick ? null : this.st.pending, isUrgent: isQuick ? false : urgent });
        if (!isQuick) {
          input.value = ''; input.style.height = 'auto'; this._clearPending();
          const ck = document.getElementById('chat-urgent'); if (ck) ck.checked = false;
        }
        if (!this.st.seen.has(m.id)) this._append([m]);
        room.last_message_at = m.created_at; room.last_message_preview = (m.body || '(사진)').slice(0, 80);
        this._renderList();
      } catch (e) { this._toast('보내지 못했습니다. ' + (e.message || '다시 시도해 주세요.')); }
      finally { this.st.sending = false; btn.disabled = false; btn.textContent = '전송'; if (!isQuick) input.focus(); }
    },

    // 공지/긴급보고를 대화로 보낸다 (기존 '긴급 공지 발송'과 현장 긴급보고가 이 함수를 씁니다)
    async sendNotice({ targetId = 'ALL', title = '', content = '', isUrgent = false } = {}) {
      if (!this.available()) throw new Error('서버에 연결되어 있어야 보낼 수 있습니다.');
      const text = ((title ? '[' + title + '] ' : '') + content).trim().slice(0, 2000);
      if (!text) throw new Error('내용이 비어 있습니다.');
      let room;
      if (this.isHq()) {
        if (!targetId || targetId === 'ALL') room = await this.sc().chatEnsureRoom('all');
        else if (UUID.test(targetId)) room = await this.sc().chatEnsureRoom('direct', targetId);
        else throw new Error('서버 계정이 없는 매니저에게는 보낼 수 없습니다.');
      } else room = await this.sc().chatEnsureRoom('direct', this.me().id);
      const m = await this.sc().chatSend(room.id, { body: text, isUrgent });
      this.refreshList().catch(() => { });
      return { room, message: m };
    },

    // 화면이 가려져 있을 때 기기 알림 (허용했을 때만; 앱을 완전히 닫으면 오지 않습니다)
    _osNotify(m, room) {
      try {
        if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
        const n = new Notification((m.is_urgent ? '🚨 ' : '💬 ') + (m.sender_name || '로디톡'), { body: m.body || '(사진)', tag: 'chat-' + m.room_id, renotify: true });
        n.onclick = () => { window.focus(); this.open(room?.kind === 'direct' && this.isHq() ? { managerId: room.manager_id } : {}); n.close(); };
      } catch (e) { }
    },
    // ── 푸시 알림 (앱을 닫아도, 내비게이션 앱을 쓰는 중에도 도착) ──
    pushSupported() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; },
    _b64(key) {
      const pad = '='.repeat((4 - key.length % 4) % 4);
      const raw = atob((key + pad).replace(/-/g, '+').replace(/_/g, '/'));
      return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
    },
    async pushState() {   // 'unsupported' | 'denied' | 'off' | 'on'
      if (!this.pushSupported()) return 'unsupported';
      if (Notification.permission === 'denied') return 'denied';
      if (Notification.permission !== 'granted') return 'off';
      try { const reg = await navigator.serviceWorker.getRegistration(); return (reg && await reg.pushManager.getSubscription()) ? 'on' : 'off'; } catch (e) { return 'off'; }
    },
    // 알림 켜기: 사용자가 버튼을 눌렀을 때만 호출 (브라우저 규칙)
    async enablePush() {
      if (!this.pushSupported()) { this._toast('이 기기에서는 푸시 알림을 쓸 수 없습니다. 아이폰은 사파리에서 "홈 화면에 추가"한 앱에서만 가능합니다.'); return false; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { this._toast('알림이 허용되지 않았습니다. 기기 설정에서 알림을 허용해 주세요.'); this._renderPushBar(); return false; }
      try {
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this._b64(PUSH_PUBLIC_KEY) });
        await this.sc().pushSave(sub);
        this._toast('알림이 켜졌습니다. 앱을 닫아도 새 메시지를 알려 드립니다.');
        this._renderPushBar();
        return true;
      } catch (e) { this._toast('알림을 켜지 못했습니다. ' + (e.message || '')); return false; }
    },
    async disablePush() {
      try {
        const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription();
        if (sub) { await this.sc().pushRemove(sub.endpoint).catch(() => { }); await sub.unsubscribe(); }
      } catch (e) { }
      this._toast('알림을 껐습니다.'); this._renderPushBar();
    },
    // 이미 허용된 기기는 조용히 다시 등록해 둔다 (주소가 바뀐 경우 대비)
    async _syncPush() {
      try {
        if (!this.pushSupported() || Notification.permission !== 'granted') return;
        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: this._b64(PUSH_PUBLIC_KEY) });
        await this.sc().pushSave(sub);
      } catch (e) { /* 다음에 다시 */ }
    },
    async _renderPushBar() {
      const bar = document.getElementById('chat-pushbar'); if (!bar) return;
      if (this.isHq()) { bar.hidden = true; return; }   // 본사(PC 웹)는 화면 안 알림만 사용
      const st = await this.pushState();
      if (st === 'on') { bar.innerHTML = '<span>🔔 알림 켜짐</span><button data-push="off">끄기</button>'; }
      else if (st === 'unsupported') { bar.innerHTML = '<span>🔕 이 기기는 푸시 알림 불가 (아이폰은 홈 화면에 추가한 앱에서만)</span>'; }
      else if (st === 'denied') { bar.innerHTML = '<span>🔕 알림이 막혀 있습니다. 기기 설정에서 허용해 주세요.</span>'; }
      else { bar.innerHTML = '<span>🔔 운전·내비 중에도 알림을 받으려면</span><button data-push="on">알림 켜기</button>'; }
      bar.hidden = false;
    },
    _askNotifyPermission() { this._renderPushBar(); },

    // ── 작은 도우미 ──
    _shortTime(iso) {
      const d = new Date(iso), n = new Date();
      if (d.toDateString() === n.toDateString()) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
      return (d.getMonth() + 1) + '/' + d.getDate();
    },
    _lightbox(src) {
      const box = document.createElement('div'); box.className = 'chat-lightbox'; box.innerHTML = '<img alt="사진">';
      box.querySelector('img').src = src; box.onclick = () => box.remove(); document.body.appendChild(box);
    },
    _toast(text, urgent) {
      const t = document.createElement('div'); t.className = 'chat-toast' + (urgent ? ' urgent' : '');
      t.textContent = text; t.onclick = () => { t.remove(); };
      document.body.appendChild(t); setTimeout(() => t.remove(), 5000);
    }
  };
  window.Chat = Chat;
})();
