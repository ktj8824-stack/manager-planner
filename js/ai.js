/* =========================================
   로드플래너 — 로드비서 '로디' (버디플래너 로드비서와 같은 구조)

   앱 → 서버 함수(roadplanner-ai, 버디플래너 프로젝트) → Claude
   - 말·글·사진(스케줄표, 콜시트)으로 스케줄 등록을 '제안' → 확인 카드 → 누르면 등록 창이 채워져 열림
   - 현장 주변 밥집·카페·주차장은 서버가 카카오에서 찾은 실제 장소만 카드로 보여줌
   - 저장·동선 계산은 기존 등록 창(Home.submitScheduleFromModal)이 그대로 함
   ========================================= */

const RoadAI = {
  URL: 'https://iaccdqcthhtvvetmbryr.supabase.co/functions/v1/roadplanner-ai',
  // 버디플래너 프로젝트 공개(anon) 키 — api.js RouteProxy와 같은 공개 값 (함수 문 앞 통과용, 실제 로그인 확인은 로드플래너 토큰으로)
  get ANON() { return (typeof RouteProxy !== 'undefined' && RouteProxy.ANON) || ''; },
  messages: [],
  _ready: false,
  _sending: false,
  _uid: '',
  recognition: null,
  listening: false,
  remaining: null,

  /* ── 화면 ── */
  init() {
    const box = U.$('#screen-ai');
    if (!box) return;
    const uid = window.SupabaseClient?.currentUser?.id || 'guest';
    if (!this._ready || this._uid !== uid) {
      this._uid = uid;
      this.renderLayout(box);
      this.load();
      this._ready = true;
    } else this.scrollDown();
    this.renderInput();
  },

  storeKey() { return 'rp_ai_messages_v1_' + (this._uid || 'guest'); },

  signedIn() { return !!(window.SupabaseClient && SupabaseClient.isConfigured && SupabaseClient.currentUser); },

  renderLayout(box) {
    box.innerHTML = `
      <div class="rpai" id="rpai">
        <div class="rpai-head">
          <div class="rpai-head-l">
            <div class="rpai-ava" aria-hidden="true">🤖</div>
            <div style="min-width:0;">
              <div class="rpai-title">로드비서 로디 <span class="rpai-badge">BETA</span></div>
              <div class="rpai-sub">스케줄 등록 · 스케줄표 사진 · 현장 주변 찾기</div>
            </div>
          </div>
          <button class="rpai-iconbtn" onclick="RoadAI.clearChat()" aria-label="대화 지우기" title="대화 지우기">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
          </button>
        </div>
        <div class="rpai-body" id="rpai-body"></div>
        <div class="rpai-inputwrap">
          <div class="rpai-listening" id="rpai-listening"><span>🎙️ 듣고 있어요… 말씀해 주세요</span><button onclick="RoadAI.stopListening()">취소</button></div>
          <div id="rpai-lock"></div>
          <input type="file" id="rpai-photo" accept="image/*" style="display:none" onchange="RoadAI.onPhoto(this)" />
          <div class="rpai-bar" id="rpai-bar">
            <button class="rpai-iconbtn" onclick="RoadAI.pickPhoto()" aria-label="스케줄표 사진 올리기" title="스케줄표·콜시트 사진">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <button class="rpai-iconbtn" id="rpai-mic" onclick="RoadAI.toggleListening()" aria-label="말로 하기" title="말로 하기">
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
            </button>
            <input type="text" id="rpai-input" class="rpai-input" placeholder="예: 내일 2시 KBS 뮤뱅 사녹" enterkeyhint="send"
              onkeydown="if(event.key==='Enter' && !event.isComposing){RoadAI.sendInput();}"
              onfocus="document.body.classList.add('ai-typing')" onblur="setTimeout(()=>document.body.classList.remove('ai-typing'),150)" />
            <button class="rpai-send" id="rpai-send" onclick="RoadAI.sendInput()" aria-label="보내기">
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2.4" fill="none"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <div class="rpai-left" id="rpai-left"></div>
        </div>
      </div>`;
  },

  renderInput() {
    const bar = U.$('#rpai-bar'), lock = U.$('#rpai-lock');
    if (!bar || !lock) return;
    const ok = this.signedIn();
    bar.style.display = ok ? '' : 'none';
    const demo = localStorage.getItem('bp_provider') === 'demo';
    lock.innerHTML = ok ? '' : demo ? `
      <div class="rpai-lock">
        <b>둘러보기에서는 AI를 쓸 수 없어요</b>
        <span>회사 계정으로 로그인하면 말 한마디로 스케줄 등록, 스케줄표 사진 읽기, 현장 주변 찾기를 할 수 있어요.</span>
      </div>` : `
      <div class="rpai-lock">
        <b>로그인하면 로드비서를 쓸 수 있어요</b>
        <span>말 한마디로 스케줄 등록, 스케줄표 사진 읽기, 현장 주변 찾기까지.</span>
        <button onclick="App.navigate('login')">로그인하기</button>
      </div>`;
    const left = U.$('#rpai-left');
    if (left) left.textContent = ok && this.remaining != null ? `오늘 남은 횟수 ${this.remaining}번` : '';
  },

  load() {
    this.messages = [];
    try { this.messages = JSON.parse(localStorage.getItem(this.storeKey()) || '[]') || []; } catch (e) { this.messages = []; }
    if (!this.messages.length) this.messages = [this.welcome()];
    this.renderAll();
  },

  welcome() {
    const name = window.SupabaseClient?.currentProfile?.name || localStorage.getItem('bp_user_name') || '';
    return {
      id: 'welcome', from: 'bot', time: this.now(), chips: true,
      html: `${name ? esc(name) + '님, ' : ''}안녕하세요! 매니저 업무를 돕는 <b>로드비서 로디</b>예요.<br><br>
        <b>"내일 2시 KBS 뮤뱅 사녹"</b>처럼 말하면 스케줄 등록 창을 채워 드리고,
        📷 버튼으로 <b>스케줄표·콜시트 사진</b>을 올리면 읽어서 정리해 드려요. 현장 근처 밥집·카페·주차장도 찾아 드릴게요.`
    };
  },

  save() {
    try { localStorage.setItem(this.storeKey(), JSON.stringify(this.messages.slice(-40))); } catch (e) { }
  },

  clearChat() {
    if (!confirm('대화 내용을 모두 지울까요?')) return;
    try { localStorage.removeItem(this.storeKey()); } catch (e) { }
    this.messages = [this.welcome()];
    this.renderAll();
  },

  now() {
    const d = new Date(), h = d.getHours();
    return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  renderAll(scroll = true) {
    const body = U.$('#rpai-body');
    if (!body) return;
    body.innerHTML = '';
    this.messages.forEach(m => this.append(m, false));
    if (scroll) this.scrollDown();
  },

  append(m, scroll = true) {
    const body = U.$('#rpai-body');
    if (!body) return;
    const row = document.createElement('div');
    row.className = 'rpai-row ' + (m.from === 'user' ? 'user' : 'bot');
    row.id = 'rpai-m-' + m.id;
    if (m.from === 'user') {
      row.innerHTML = `<div class="rpai-col">
        ${m.image ? `<img class="rpai-photo" src="${m.image}" alt="올린 사진" />` : ''}
        ${m.hadImage && !m.image ? '<div class="rpai-photo-note">📷 사진</div>' : ''}
        ${m.text ? `<div class="rpai-bubble">${esc(m.text)}</div>` : ''}
        <span class="rpai-time">${esc(m.time)}</span></div>`;
    } else {
      row.innerHTML = `<div class="rpai-mini" aria-hidden="true">🤖</div><div class="rpai-col">
        <div class="rpai-bubble">${m.html || ''}${this.extras(m)}</div>
        <span class="rpai-time">${esc(m.time)}</span>
        ${m.chips ? this.chipsHTML() : ''}</div>`;
    }
    body.appendChild(row);
    if (scroll) this.scrollDown();
  },

  chipsHTML() {
    const c = (label, say) => `<button class="rpai-chip" onclick="RoadAI.ask(${escJs(say)})">${esc(label)}</button>`;
    return `<div class="rpai-chips-label">💡 눌러서 바로 물어보기</div><div class="rpai-chips">
      ${c('📅 내일 스케줄 알려줘', '내일 스케줄이랑 출발 시간 알려줘')}
      ${c('🗓️ 이번 주 일정 정리', '이번 주 스케줄 날짜순으로 정리해줘')}
      ${c('➕ 말로 스케줄 등록', '토요일 오후 6시 한양대 축제 일정 잡아줘')}
      <button class="rpai-chip" onclick="RoadAI.pickPhoto()">📷 스케줄표 사진으로 등록</button>
      ${c('🍚 다음 현장 근처 밥집', '다음 스케줄 현장 근처에서 빨리 먹을 수 있는 밥집 찾아줘')}
      ${c('🅿️ 현장 근처 주차장', '다음 스케줄 현장 근처 주차장 찾아줘')}
    </div>`;
  },

  scrollDown() {
    setTimeout(() => { const b = U.$('#rpai-body'); if (b) b.scrollTop = b.scrollHeight; }, 40);
  },

  showTyping() {
    const body = U.$('#rpai-body');
    if (!body || U.$('#rpai-typing')) return;
    const row = document.createElement('div');
    row.className = 'rpai-row bot'; row.id = 'rpai-typing';
    row.innerHTML = '<div class="rpai-mini">🤖</div><div class="rpai-bubble rpai-typing"><span></span><span></span><span></span></div>';
    body.appendChild(row);
    this.scrollDown();
  },
  hideTyping() { U.$('#rpai-typing')?.remove(); },

  botSay(html) {
    const m = { id: 'b' + Date.now(), from: 'bot', time: this.now(), html };
    this.messages.push(m); this.append(m); this.save();
  },

  /* ── 보내기 ── */
  ask(text) { this.send(text); },

  sendInput() {
    const el = U.$('#rpai-input');
    const v = (el?.value || '').trim();
    if (!v) return;
    el.value = '';
    this.send(v);
  },

  pickPhoto() {
    if (!this.signedIn()) { U.toast('로그인 후 쓸 수 있어요.'); return; }
    const el = U.$('#rpai-photo');
    if (el) { el.value = ''; el.click(); }
  },

  async onPhoto(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const dataUrl = await this.compress(file, 1600, 0.82);
      const el = U.$('#rpai-input');
      const t = (el?.value || '').trim();
      if (el) el.value = '';
      this.send(t, dataUrl);
    } catch (e) { U.toast('사진을 불러오지 못했어요.'); }
  },

  /** 글자가 읽히도록 충분한 크기로 줄여서 jpeg로 */
  compress(file, max, q) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', q));
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  },

  async send(text, image) {
    if (this._sending) return;
    if (!this.signedIn()) { this.renderInput(); U.toast('로그인 후 쓸 수 있어요.'); return; }
    const um = { id: 'u' + Date.now(), from: 'user', time: this.now(), text: text || '', image: image || null };
    this.messages.push(um); this.append(um);
    // 대화 기록에는 사진을 남기지 않음 (용량)
    this.messages[this.messages.length - 1] = Object.assign({}, um, { image: null, hadImage: !!image });
    this.save();

    this._sending = true;
    const sendBtn = U.$('#rpai-send'); if (sendBtn) sendBtn.disabled = true;
    this.showTyping();
    try {
      const { data: s } = await SupabaseClient.client.auth.getSession();
      const token = s?.session?.access_token;
      if (!token) throw Object.assign(new Error('login'), { login: true });
      const context = this.context();
      const ids = this._lastIds || [];
      const body = { message: text || '', history: this.history().slice(0, -1), context };
      if (image) body.image = { media_type: 'image/jpeg', data: image.split(',')[1] };
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), image ? 60000 : 40000);
      const res = await fetch(this.URL, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, apikey: this.ANON },
        body: JSON.stringify(body)
      }).finally(() => clearTimeout(timer));
      const data = await res.json().catch(() => ({}));
      this.hideTyping();
      if (!res.ok) {
        const up = data.error === 'daily_limit' && data.indie && !data.paid
          ? `<br><button type="button" class="rpai-btn" style="margin-top:8px;" onclick="App.navigate('upgrade')">유료 알아보기 (월 2만원)</button>` : '';
        if (data.error === 'daily_limit') this.remaining = 0;
        this.botSay(esc(data.message || 'AI가 잠시 대답하지 못했어요. 조금 뒤에 다시 말씀해 주세요.') + up);
        return;
      }
      if (typeof data.remaining === 'number') this.remaining = data.remaining;
      const m = {
        id: 'b' + Date.now(), from: 'bot', time: this.now(), agent: true,
        plain: data.reply || '', html: this.format(data.reply),
        actions: (data.actions || []).map(a => Object.assign({ status: 'pending' }, a)),
        places: data.places || [], ids
      };
      this.messages.push(m); this.append(m); this.save();
      if (window.Ads) setTimeout(() => Ads.moment('ai'), 1500);   // 무료 개인 매니저만 (Ads 안에서 판단)
    } catch (e) {
      this.hideTyping();
      this.botSay(e && e.login ? '로그인이 만료됐어요. 다시 로그인해 주세요.'
        : (navigator.onLine === false ? '인터넷 연결을 확인해 주세요.' : (e && e.name === 'AbortError' ? '대답이 너무 오래 걸려요. 잠시 후 다시 해 주세요.' : 'AI가 잠시 대답하지 못했어요. 조금 뒤에 다시 말씀해 주세요.')));
    } finally {
      this._sending = false;
      if (sendBtn) sendBtn.disabled = false;
      this.renderInput();
    }
  },

  format(t) {
    return esc(t || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
  },

  history() {
    return this.messages
      .filter(m => m.id !== 'welcome' && (m.text || m.plain || m.hadImage || m.html))
      .slice(-12)
      .map(m => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.from === 'user'
          ? [m.hadImage ? '[스케줄표 사진 첨부]' : '', m.text || ''].filter(Boolean).join(' ')
          : (m.plain || String(m.html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
      }));
  },

  /** AI에게 줄 내 정보 (앞으로 2주 스케줄, 계산된 출발 시각 포함) */
  context() {
    const pad = n => String(n).padStart(2, '0');
    const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const now = new Date();
    const today = ymd(now);
    const until = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14));
    let list = [];
    try { list = (window.hqStore?.getSchedules?.() || []); } catch (e) { list = []; }
    const picked = list
      .filter(s => s && s.date && s.date >= today && s.date <= until && !['취소', 'cancelled'].includes(s.status))
      .sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))
      .slice(0, 30);
    // 목록 순서(idx) ↔ 스케줄 id 짝 — AI가 '변경' 제안을 하면 이 짝으로 어느 스케줄인지 찾음
    this._lastIds = picked.map(s => s.id);
    const upcoming = picked
      .map((s, idx) => {
        const d = new Date(s.date + 'T00:00:00');
        // 비공개 일정은 제목·장소·아티스트·샵·출발지를 AI(외부 서버)로 보내지 않음 — 날짜·시각만
        const secret = s.isSecret === true;
        const steps = (Array.isArray(s.timeline) ? s.timeline : [])
          .filter(st => st && st.time && st.label)
          .slice(0, 7)
          .map(st => `${(Number(st.dayOffset) || 0) < 0 ? '전날 ' : ''}${st.time} ${secret ? '이동 단계' : String(st.label).slice(0, 40)}`);
        if (secret) return { idx, date: s.date, weekday: days[d.getDay()], start: s.startTime || '', end: s.endTime || '', title: '비공개 일정', artist: '', place: '', shop: '', departure: '', manager: '', secret: true, steps };
        return {
          idx, date: s.date, weekday: days[d.getDay()], start: s.startTime || '', end: s.endTime || '',
          title: String(s.title || '').slice(0, 60), artist: String(s.artistName || '').slice(0, 30),
          place: String(s.location || '').slice(0, 60), shop: s.shop?.needed ? String(s.shop.name || '').slice(0, 40) : '',
          departure: String((typeof s.departure === 'object' ? (s.departure?.place || '') : s.departure) || '').slice(0, 60),
          manager: String(s.managerName || '').slice(0, 20), steps
        };
      });
    let artists = [];
    try { artists = (window.hqStore?.getArtists?.() || []).map(a => a.name).filter(Boolean).slice(0, 40); } catch (e) { }
    let dep = '';
    try { dep = localStorage.getItem('rp_default_departure') || ''; } catch (e) { }
    return {
      today, weekday: days[now.getDay()], now: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      userName: window.SupabaseClient?.currentProfile?.name || '',
      role: typeof Plan !== 'undefined' && Plan.isIndie() ? 'indie' : (localStorage.getItem('bp_user_role') || 'manager'),
      departure: dep, artists, upcoming
    };
  },

  /* ── 카드 ── */
  extras(m) {
    let h = '';
    (m.places || []).forEach(p => { h += this.placeHTML(p); });
    (m.actions || []).forEach((a, i) => { h += this.actionHTML(a, m.id, i); });
    return h;
  },

  placeHTML(p) {
    const dist = p.distance_m != null ? (p.distance_m >= 1000 ? (p.distance_m / 1000).toFixed(1) + 'km' : p.distance_m + 'm') : '';
    return `<div class="rpai-place">
      <div class="rpai-place-head"><b>${esc(p.name)}</b>${dist ? `<small>${esc(dist)}</small>` : ''}</div>
      <div class="rpai-place-meta">${esc([p.category, p.address].filter(Boolean).join(' · '))}</div>
      <div class="rpai-btns">
        ${p.url ? `<button onclick="RoadAI.open(${escJs(p.url)})">카카오맵</button>` : ''}
        ${p.phone ? `<button onclick="RoadAI.open(${escJs('tel:' + p.phone)})">전화</button>` : ''}
        <button onclick="RoadAI.navi(${escJs(p.name)}, ${escJs(p.address || '')})">길안내</button>
      </div></div>`;
  },

  CAT: { music_show: '음악방송', broadcast: '예능·라디오·인터뷰', shooting: '화보·촬영·광고', event: '행사·콘서트·축제', fansign: '팬미팅·팬사인회', recording: '녹음·연습', overseas: '해외·출국', meeting: '미팅·기타' },

  actionHTML(a, msgId, i) {
    if (a.type === 'update') return this.updateHTML(a, msgId, i);
    if (a.type !== 'schedule') return '';
    const done = a.status !== 'pending';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    let when = a.date || '';
    try { const d = new Date(a.date + 'T00:00:00'); when = `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`; } catch (e) { }
    const addr = a.address || a.found?.addr || '';
    const row = (k, v) => v ? `<span>${esc(k)}</span><b>${esc(v)}</b>` : '';
    return `<div class="rpai-card">
      <div class="rpai-card-title">📅 스케줄 등록</div>
      <div class="rpai-kv">
        ${row('스케줄', a.title)}
        ${row('날짜', when)}
        ${row('시간', a.start + (a.end ? ' ~ ' + a.end : ''))}
        ${row('장소', a.place)}
        ${row('주소', addr)}
        ${row('아티스트', a.artist)}
        ${row('분류', this.CAT[a.category] || '')}
        ${row('샵', a.shop_name)}
        ${row('출발지', a.departure)}
      </div>
      ${done ? `<div class="rpai-btns"><button class="rpai-btn done" disabled>${a.status === 'done' ? '✓ 등록 창을 열었어요' : '취소됨'}</button></div>`
        : `<p class="rpai-note">버튼을 누르면 등록 창이 채워져 열려요. 확인 후 [스케줄 등록 완료]를 눌러 주세요.</p>
           <div class="rpai-btns"><button class="rpai-btn" onclick="RoadAI.confirm('${msgId}',${i})">등록 창 열기</button><button class="rpai-btn ghost" onclick="RoadAI.dismiss('${msgId}',${i})">취소</button></div>`}
    </div>`;
  },

  isHQ() { const r = localStorage.getItem('bp_user_role') || 'manager'; return r === 'ceo' || r === 'hq_admin'; },
  // 스케줄을 직접 고칠 수 있는 사람: 본사, 그리고 자기 일정만 있는 개인 매니저
  canEdit() { return this.isHQ() || (typeof Plan !== 'undefined' && Plan.isIndie()); },

  _md(ymd) {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    try { const d = new Date(ymd + 'T00:00:00'); if (!isNaN(d)) return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`; } catch (e) { }
    return ymd || '';
  },

  /** 기존 스케줄 변경·취소 확인 카드 */
  updateHTML(a, msgId, i) {
    const b = a.before || {};
    const done = a.status !== 'pending';
    const row = (k, v) => v ? `<span>${esc(k)}</span><b>${v}</b>` : '';
    const arrow = (from, to) => to && to !== from ? `${esc(from || '-')} → <span style="color:#3B45C4">${esc(to)}</span>` : esc(from || '');
    const hq = this.canEdit();
    const title = a.cancel ? '🚫 스케줄 취소' : '✏️ 스케줄 변경';
    const doneLabel = a.status === 'done' ? (hq ? (a.cancel ? '✓ 처리했어요' : '✓ 수정 창을 열었어요') : '✓ 로드톡을 열었어요') : '취소됨';
    const note = hq
      ? (a.cancel ? '버튼을 누르면 이 스케줄을 삭제할지 한 번 더 물어봐요.' : '버튼을 누르면 수정 창이 바뀐 값으로 채워져 열려요. 확인 후 저장해 주세요.')
      : '현장 매니저는 스케줄을 직접 바꿀 수 없어요. 버튼을 누르면 로드톡이 열리고 요청 문장이 복사돼요.';
    return `<div class="rpai-card">
      <div class="rpai-card-title">${title}</div>
      <div class="rpai-kv">
        ${row('스케줄', esc(b.title))}
        ${row('장소', esc(b.place))}
        ${row('날짜', arrow(this._md(b.date), a.new_date ? this._md(a.new_date) : ''))}
        ${a.cancel ? '' : row('시간', arrow(b.start + (b.end ? ' ~ ' + b.end : ''), (a.new_start || a.new_end) ? (a.new_start || b.start) + ((a.new_end || b.end) ? ' ~ ' + (a.new_end || b.end) : '') : ''))}
        ${row('이유', esc(a.reason))}
      </div>
      ${done ? `<div class="rpai-btns"><button class="rpai-btn done" disabled>${doneLabel}</button></div>`
        : `<p class="rpai-note">${note}</p>
           <div class="rpai-btns"><button class="rpai-btn" onclick="RoadAI.confirm('${msgId}',${i})">${hq ? (a.cancel ? '삭제하기' : '수정 창 열기') : '본사에 요청'}</button><button class="rpai-btn ghost" onclick="RoadAI.dismiss('${msgId}',${i})">취소</button></div>`}
    </div>`;
  },

  /** 변경 카드 승인: 본사는 기존 수정 창·삭제 흐름, 매니저는 로드톡으로 요청 */
  async confirmUpdate(m, a) {
    const id = (m.ids || [])[a.idx];
    const sch = id && (window.hqStore?.getSchedules?.() || []).find(s => s.id === id);
    const b = a.before || {};
    if (!sch || (b.title && !sch.isSecret && sch.title !== b.title)) { U.toast('그 스케줄을 찾지 못했어요. 스케줄 화면에서 직접 확인해 주세요.'); return; }
    const req = a.cancel
      ? `[변경 요청] ${this._md(sch.date)} ${sch.startTime} "${sch.title}" 스케줄이 취소됐어요.${a.reason ? ' (' + a.reason + ')' : ''}`
      : `[변경 요청] ${this._md(sch.date)} ${sch.startTime} "${sch.title}" → ${a.new_date ? this._md(a.new_date) + ' ' : ''}${a.new_start || sch.startTime}${a.new_end ? '~' + a.new_end : ''}로 바뀌었어요.${a.reason ? ' (' + a.reason + ')' : ''}`;
    if (!this.canEdit()) {
      try { await navigator.clipboard.writeText(req); U.toast('요청 문장을 복사했어요. 로드톡에 붙여 넣어 보내 주세요.'); }
      catch (e) { U.toast(esc(req), 6000); }   // 요청 문장에 스케줄명·AI 글이 들어가서 글자 처리
      if (typeof App !== 'undefined' && App.openMessages) App.openMessages();
      a.status = 'done'; this.save(); this._redraw(m);
      return;
    }
    if (typeof Home === 'undefined') return;
    if (a.cancel) {
      await Home.deleteScheduleFromApp(id);
      const still = (window.hqStore?.getSchedules?.() || []).some(s => s.id === id);
      if (!still) { a.status = 'done'; this.save(); this._redraw(m); }
      return;
    }
    Home.openScheduleRegisterModal(id);
    setTimeout(() => {
      const g = (x) => document.getElementById(x);
      if (a.new_date && g('m-sch-date')) g('m-sch-date').value = a.new_date;
      if (a.new_start && g('m-sch-start')) g('m-sch-start').value = a.new_start;
      if (a.new_end && g('m-sch-end')) { g('m-sch-end').value = a.new_end; g('m-sch-end').dataset.touched = '1'; }
      U.toast('바뀐 값을 확인하고 저장해 주세요.');
      a.status = 'done'; this.save(); this._redraw(m);
    }, 60);
  },

  _find(msgId, i) {
    const m = this.messages.find(x => x.id === msgId);
    return { m, a: m && m.actions && m.actions[i] };
  },

  _redraw() {
    const b = U.$('#rpai-body');
    const top = b ? b.scrollTop : 0;
    this.renderAll(false);
    if (b) b.scrollTop = top;
  },

  dismiss(msgId, i) {
    const { m, a } = this._find(msgId, i);
    if (!a) return;
    a.status = 'dismissed'; this.save(); this._redraw(m);
  },

  /** 기존 스케줄 등록 창을 AI가 읽은 내용으로 채워서 열기 (저장·동선 계산은 기존 흐름) */
  confirm(msgId, i) {
    const { m, a } = this._find(msgId, i);
    if (a && a.type === 'update') return this.confirmUpdate(m, a);
    if (!a || typeof Home === 'undefined') return;
    const p = String(a.date || '').split('-').map(Number);
    if (p.length === 3 && p.every(Number.isFinite)) Home.selectedDate = new Date(p[0], p[1] - 1, p[2]);
    else if (!Home.selectedDate) Home.selectedDate = new Date();
    Home.openScheduleRegisterModal();
    setTimeout(() => {
      this.fillForm(a);
      a.status = 'done'; this.save(); this._redraw(m);
    }, 60);
  },

  fillForm(a) {
    const g = (id) => document.getElementById(id);
    const set = (id, v) => { const el = g(id); if (el && v != null && v !== '') el.value = v; };
    set('m-sch-title', a.title);
    set('m-sch-date', a.date);
    set('m-sch-start', a.start);
    if (a.end) { set('m-sch-end', a.end); const e = g('m-sch-end'); if (e) e.dataset.touched = '1'; }
    else if (a.start && typeof Home !== 'undefined' && Home._autoEnd) Home._autoEnd(a.start);
    set('m-sch-loc', a.place);
    set('m-sch-addr', a.address || a.found?.addr || '');
    set('m-sch-dep', a.departure);
    if (a.category) set('m-sch-category', a.category);
    if (a.artist) {
      const sel = g('m-sch-artist');
      const want = String(a.artist).replace(/\s+/g, '');
      const opt = sel && Array.from(sel.options).find(o => /^(전체|전원)/.test(want) ? o.value === 'ALL' : o.textContent.replace(/\s+/g, '').includes(want));
      if (opt) sel.value = opt.value;
    }
    if (a.shop_name || a.shop_address) {
      const cb = g('m-sch-shop-needed');
      if (cb) { cb.checked = true; const f = g('m-sch-shop-fields'); if (f) f.style.display = 'block'; }
      set('m-sch-shop-name', a.shop_name);
      set('m-sch-shop-addr', a.shop_address);
    }
    U.toast('AI가 채운 내용을 확인하고 등록해 주세요.');
  },

  open(url) {
    if (!/^(https?:|tel:)/.test(String(url))) return;
    if (url.startsWith('tel:')) window.location.href = url; else window.open(url, '_blank');
  },

  navi(name, addr) {
    if (U.showNaviChoiceModal) U.showNaviChoiceModal(name, addr || name);
    else window.open(`https://map.kakao.com/link/search/${encodeURIComponent(addr || name)}`, '_blank');
  },

  /* ── 말로 하기 ── */
  toggleListening() { this.listening ? this.stopListening() : this.startListening(); },

  startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { U.toast('이 기기에서는 음성 입력이 안 돼요. 키보드의 🎤 버튼으로 말해 보세요.'); return; }
    try {
      this.recognition = new SR();
      this.recognition.lang = 'ko-KR';
      this.recognition.interimResults = true;
      this.recognition.continuous = false;
      this.recognition.onstart = () => this.micUI(true);
      this.recognition.onresult = (ev) => {
        let t = '';
        for (let k = ev.resultIndex; k < ev.results.length; k++) t += ev.results[k][0].transcript;
        const el = U.$('#rpai-input'); if (el) el.value = t;
        if (ev.results[ev.results.length - 1].isFinal) { this.stopListening(); if (t.trim()) this.sendInput(); }
      };
      this.recognition.onerror = (e) => { this.stopListening(); if (e.error === 'not-allowed' || e.error === 'service-not-allowed') U.toast('마이크·음성 인식 권한이 꺼져 있어요. 아이폰 설정 → 로드플래너에서 마이크와 음성 인식을 켜 주세요.'); };
      this.recognition.onend = () => this.micUI(false);
      this.recognition.start();
    } catch (e) { this.micUI(false); U.toast('음성 입력을 시작하지 못했어요.'); }
  },

  stopListening() {
    try { if (this.recognition) this.recognition.stop(); } catch (e) { }
    this.micUI(false);
  },

  micUI(on) {
    this.listening = on;
    U.$('#rpai-mic')?.classList.toggle('on', on);
    U.$('#rpai-listening')?.classList.toggle('on', on);
  }
};

window.RoadAI = RoadAI;
