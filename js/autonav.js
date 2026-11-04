// =========================================
// 차에 타면 자동 길안내 (1단계)
//   앱 주소 뒤에 ?go=next 를 붙여 열면, 오늘 '지금 할 일'(다음 단계)의 목적지로
//   기본 내비(티맵/카카오내비)를 3초 뒤 자동으로 엽니다.
//   - 아이폰: 단축어 자동화 "CarPlay에 연결되면 → URL 열기"
//   - 갤럭시: 모드 및 루틴 "차량 블루투스 연결 시 → 링크 열기"
//   - iOS 앱(Xcode): roadplanner://next → 이 주소로 열림
// =========================================
const AutoNav = {
  LINK: 'https://ktj8824-stack.github.io/manager-planner-app/?go=next',
  WAIT_MS: 20000,
  COUNTDOWN: 3,
  _timer: null,

  // 주소에 go=next 가 있는지 보고, 있으면 지우고 true
  _consumeFlag() {
    try {
      const u = new URL(location.href);
      const q = u.searchParams.get('go');
      const h = (u.hash || '').replace(/^#/, '');
      if (q !== 'next' && h !== 'go=next' && h !== 'next') return false;
      u.searchParams.delete('go');
      if (h === 'go=next' || h === 'next') u.hash = '';
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      return true;
    } catch (e) { return false; }
  },

  init() {
    if (!this._consumeFlag()) return;
    this.start();
  },

  // 오늘 다음 단계 찾기 — 홈 '지금 할 일' 카드와 같은 규칙
  nextStep() {
    if (typeof State === 'undefined' || !State.calculateDailyEvents) return null;
    const now = new Date();
    let events = [];
    try { events = State.calculateDailyEvents(now.getFullYear(), now.getMonth(), now.getDate()) || []; } catch (e) { return null; }
    const seen = new Set();
    const uniq = events.filter(ev => {
      if (!ev) return false;
      const k = `${ev.time}_${(ev.title || '').trim()}`;
      if (seen.has(k)) return false;
      seen.add(k); return true;
    });
    const pending = uniq.filter(e => !e.done);
    const ev = pending.find(e => e.moving === true) || pending[0];
    if (!ev) return { total: uniq.length, ev: null };
    const raw = String(ev.title || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    const bm = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
    const name = (bm ? bm[2] : raw) || raw;
    let dest = '';
    if (raw.includes('숙소 픽업') || raw.includes('픽업 및 출발')) dest = ev.shopAddress || ev.shopName || ev.locationAddress || ev.location || '';
    else if (raw.includes('복귀') || raw.includes('철수')) dest = ev.departureAddress || ev.departurePlace || '';
    else dest = ev.locationAddress || ev.location || '';
    return { total: uniq.length, ev, name, tag: bm ? bm[1] : '', time: ev.time || '', dest: String(dest || '').trim() };
  },

  _loggedIn() {
    return !!localStorage.getItem('bp_logged_in') || !!localStorage.getItem('bp_user_role');
  },

  // 로그인·일정 불러오기가 끝날 때까지 잠깐 기다렸다가 안내
  start() {
    this._overlay('<div class="an-t">오늘 일정을 확인하는 중…</div>', false);
    const began = Date.now();
    const tick = () => {
      const r = this._loggedIn() ? this.nextStep() : null;
      if (r && r.ev) return this._ready(r);
      if (Date.now() - began < this.WAIT_MS) { this._timer = setTimeout(tick, 500); return; }
      if (!this._loggedIn()) return this._message('로그인이 필요해요', '앱에서 한 번 로그인해 두면 다음부터 바로 안내됩니다.');
      if (r && r.total) return this._message('오늘 일정이 모두 끝났어요', '수고하셨습니다.');
      return this._message('오늘 남은 일정이 없어요', '');
    };
    tick();
  },

  _ready(r) {
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const target = r.dest || r.name;
    const pref = localStorage.getItem('bp_preferred_navi') || 'choice';
    const app = pref === 'tmap' ? '티맵' : pref === 'kakao' ? '카카오내비' : '';
    if (!target) return this._message('목적지가 비어 있어요', '일정에 장소를 넣어 주면 자동 안내됩니다.');
    this._target = target;
    let left = this.COUNTDOWN;
    const body = () => `
      <div class="an-k">다음 일정${r.time ? ' · ' + esc(r.time) : ''}</div>
      <div class="an-t">${esc(r.name)}</div>
      <div class="an-d">📍 ${esc(target)}</div>
      <div class="an-c">${app ? `<b>${left}</b>초 뒤 ${app}${app === '티맵' ? '으로' : '로'} 안내를 시작합니다` : '어느 내비로 안내할까요?'}</div>
      <div class="an-b">
        <button type="button" class="an-x" onclick="AutoNav.cancel()">취소</button>
        <button type="button" class="an-go" onclick="AutoNav.go()">${app ? '지금 안내' : '내비 고르기'}</button>
      </div>`;
    this._overlay(body(), true);
    if (!app) return; // 기본 내비가 없으면 직접 고르게 함
    const step = () => {
      left -= 1;
      if (left <= 0) return this.go();
      const box = document.getElementById('an-box');
      if (!box) return;
      box.innerHTML = body();
      this._timer = setTimeout(step, 1000);
    };
    this._timer = setTimeout(step, 1000);
  },

  go() {
    clearTimeout(this._timer);
    const t = this._target;
    this._close();
    if (t && typeof U !== 'undefined' && U.openNavigation) U.openNavigation(t, '');
  },

  cancel() {
    clearTimeout(this._timer);
    this._close();
  },

  _message(title, sub) {
    clearTimeout(this._timer);
    this._overlay(`<div class="an-t">${title}</div>${sub ? `<div class="an-d">${sub}</div>` : ''}
      <div class="an-b"><button type="button" class="an-go" onclick="AutoNav.cancel()">확인</button></div>`, true);
  },

  _overlay(html, closable) {
    let bg = document.getElementById('an-bg');
    if (!bg) {
      if (!document.getElementById('an-style')) {
        const st = document.createElement('style');
        st.id = 'an-style';
        st.textContent = `
#an-bg{position:fixed;inset:0;z-index:10050;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center;padding:16px 16px calc(20px + env(safe-area-inset-bottom));}
#an-box{width:100%;max-width:440px;background:#fff;border-radius:20px;padding:20px 18px 16px;box-shadow:0 20px 50px rgba(0,0,0,.25);color:#0f172a;}
#an-box .an-k{font-size:13px;font-weight:800;color:#4f46e5;margin-bottom:4px;}
#an-box .an-t{font-size:20px;font-weight:800;letter-spacing:-.02em;line-height:1.35;}
#an-box .an-d{font-size:14.5px;color:#475569;margin-top:6px;line-height:1.45;word-break:keep-all;}
#an-box .an-c{font-size:14px;color:#334155;margin-top:14px;font-weight:600;}
#an-box .an-c b{color:#4f46e5;font-size:17px;}
#an-box .an-b{display:flex;gap:8px;margin-top:16px;}
#an-box .an-b button{flex:1;height:48px;border-radius:12px;font-size:15.5px;font-weight:800;border:0;cursor:pointer;}
#an-box .an-x{background:#f1f5f9;color:#334155;}
#an-box .an-go{background:#4f46e5;color:#fff;}`;
        document.head.appendChild(st);
      }
      bg = document.createElement('div');
      bg.id = 'an-bg';
      bg.innerHTML = '<div id="an-box" role="dialog" aria-live="polite"></div>';
      document.body.appendChild(bg);
    }
    bg.onclick = closable ? (e => { if (e.target === bg) this.cancel(); }) : null;
    document.getElementById('an-box').innerHTML = html;
  },

  _close() {
    const bg = document.getElementById('an-bg');
    if (bg) bg.remove();
  },

  copyLink(el) {
    const done = () => { if (typeof U !== 'undefined') U.toast('링크를 복사했어요.'); if (el) { el.textContent = '복사됨 ✓'; setTimeout(() => { el.textContent = '링크 복사'; }, 1600); } };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(this.LINK).then(done, () => prompt('아래 링크를 복사하세요', this.LINK));
    else prompt('아래 링크를 복사하세요', this.LINK);
  },

  // 내 정보 > 설정 안내
  openGuide() {
    const isAndroid = /Android/i.test(navigator.userAgent);
    const pref = localStorage.getItem('bp_preferred_navi') || 'choice';
    const opt = (v, label) => `<button type="button" class="setting-opt-btn${pref === v ? ' active' : ''}" onclick="Profile.setNavi('${v}', this)">${label}</button>`;
    const S = 'font-size:14px;line-height:1.6;color:var(--text-200,#334155);';
    const ios = `
      <div style="font-weight:800;font-size:15px;margin:14px 0 6px;">아이폰</div>
      <ol style="${S}padding-left:22px;margin:0;list-style:decimal;">
        <li><b>단축어</b> 앱 → 아래 <b>자동화</b> → <b>＋</b></li>
        <li><b>CarPlay</b> 선택 → <b>연결될 때</b> → <b>즉시 실행</b></li>
        <li>동작에서 <b>URL 열기</b> 추가 → 아래 링크 붙여넣기</li>
      </ol>
      <div style="font-size:12.5px;color:#64748b;margin-top:6px;">CarPlay가 없으면 2번에서 <b>블루투스</b> → 차량 이름을 고르세요. 로드플래너 앱(아이폰 앱)이나 로그인된 Safari에서 열려야 합니다.</div>`;
    const android = `
      <div style="font-weight:800;font-size:15px;margin:14px 0 6px;">갤럭시</div>
      <ol style="${S}padding-left:22px;margin:0;list-style:decimal;">
        <li><b>설정</b> → <b>모드 및 루틴</b> → <b>루틴</b> → <b>＋</b></li>
        <li>조건: <b>블루투스 기기 연결</b> → 차량 선택 (Android Auto도 가능)</li>
        <li>실행: <b>앱 → 웹페이지 열기</b>(또는 링크 열기) → 아래 링크</li>
      </ol>`;
    const html = `
      <div style="${S}">차에 타서 휴대폰이 차와 연결되면, 로드플래너가 열리면서 <b>오늘 다음 일정</b>으로 내비가 자동으로 켜집니다.</div>
      <div style="font-weight:800;font-size:15px;margin:16px 0 8px;">1. 기본 내비</div>
      <div class="setting-options" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">${opt('tmap', '티맵')}${opt('kakao', '카카오내비')}${opt('choice', '매번 선택')}</div>
      <div style="font-weight:800;font-size:15px;margin:18px 0 8px;">2. 자동 실행 링크</div>
      <div style="display:flex;gap:6px;align-items:center;">
        <input readonly value="${this.LINK}" onclick="this.select()" style="flex:1;min-width:0;height:42px;border:1px solid #e2e8f0;border-radius:10px;padding:0 10px;font-size:13px;background:#f8fafc;color:#0f172a;">
        <button type="button" onclick="AutoNav.copyLink(this)" style="height:42px;padding:0 14px;border-radius:10px;border:0;background:#4f46e5;color:#fff;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;">링크 복사</button>
      </div>
      <div style="font-weight:800;font-size:15px;margin:18px 0 0;">3. 휴대폰에 자동 실행 등록</div>
      ${isAndroid ? android + ios : ios + android}
      <button type="button" onclick="App.closeModal(); AutoNav.test()" style="width:100%;height:46px;margin-top:18px;border-radius:12px;border:1px solid #c7d2fe;background:#eef2ff;color:#4338ca;font-weight:800;font-size:15px;cursor:pointer;">지금 시험해 보기</button>`;
    App.showModal('🚗 차에 타면 자동 길안내', html);
  },

  test() { this.start(); },
};

window.AutoNav = AutoNav;
