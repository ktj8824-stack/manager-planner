// =========================================
// 차에 타면 자동 길안내 (1단계)
//   앱 주소 뒤에 ?go=next 를 붙여 열면, 오늘 '지금 할 일'(다음 단계)의 목적지로
//   기본 내비(티맵/카카오내비)를 3초 뒤 자동으로 엽니다.
//   - 아이폰: 단축어 자동화 "CarPlay에 연결되면 → URL 열기"
//   - 갤럭시: 모드 및 루틴 "차량 블루투스 연결 시 → 링크 열기"
//   - iOS 앱(Xcode): roadplanner://next → 이 주소로 열림
// =========================================
const AutoNav = {
  get LINK() { return (window.SITE ? SITE.APP : 'https://ktj8824-stack.github.io/manager-planner-app/') + '?go=next'; },   // 주소는 js/site-config.js
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
    this.startWatch();
    if (!this._consumeFlag()) return;
    try { localStorage.setItem('rp_autonav_used', String(Date.now())); } catch (e) { }   // 설정 끝 → 홈 홍보 줄 숨김
    this.start();
  },

  // 개인 매니저 무료: 알림·자동 길안내 없음 (회사 계정은 항상 true)
  _can(feature) { return typeof Plan === 'undefined' || Plan.can(feature); },

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
    const pending = uniq.filter(e => !e.done && e.stepCategory !== 'rest' && !/^\[기상/.test(String(e.title || '')));   // 기상·준비는 길안내 대상 아님
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
      if (this._loggedIn() && !this._can('autonav')) {
        return this._message('자동 길안내는 유료 기능이에요', '앱의 내 정보 → 유료 알아보기에서 시작할 수 있어요. 홈의 길안내 버튼은 무료로 쓸 수 있어요.');
      }
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
#an-box{width:100%;max-width:440px;background:#fff;border-radius:20px;padding:20px 18px 16px;box-shadow:0 20px 50px rgba(0,0,0,.25);color:#14161A;}
#an-box .an-k{font-size:13px;font-weight:800;color:#3B45C4;margin-bottom:4px;}
#an-box .an-t{font-size:20px;font-weight:800;letter-spacing:-.02em;line-height:1.35;}
#an-box .an-d{font-size:14.5px;color:#475569;margin-top:6px;line-height:1.45;word-break:keep-all;}
#an-box .an-c{font-size:14px;color:#334155;margin-top:14px;font-weight:600;}
#an-box .an-c b{color:#3B45C4;font-size:17px;}
#an-box .an-b{display:flex;gap:8px;margin-top:16px;}
#an-box .an-b button{flex:1;height:48px;border-radius:12px;font-size:15.5px;font-weight:800;border:0;cursor:pointer;}
#an-box .an-x{background:#f1f5f9;color:#334155;}
#an-box .an-go{background:#3B45C4;color:#fff;}`;
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
      <div style="font-size:12.5px;color:#5B616E;margin-top:6px;">CarPlay가 없으면 2번에서 <b>블루투스</b> → 차량 이름을 고르세요. 로드플래너 앱(아이폰 앱)이나 로그인된 Safari에서 열려야 합니다.</div>`;
    const android = `
      <div style="font-weight:800;font-size:15px;margin:14px 0 6px;">갤럭시</div>
      <ol style="${S}padding-left:22px;margin:0;list-style:decimal;">
        <li><b>설정</b> → <b>모드 및 루틴</b> → <b>루틴</b> → <b>＋</b></li>
        <li>조건: <b>블루투스 기기 연결</b> → 차량 선택 (Android Auto도 가능)</li>
        <li>실행: <b>앱 열기</b> → <b>로드플래너 길안내</b> (로드플래너 안드로이드 앱을 설치하면 생기는 파란 길안내 아이콘)</li>
      </ol>
      <div style="font-size:13px;color:#5B616E;margin-top:6px;">앱 대신 브라우저로 쓰는 경우: 실행을 <b>웹페이지 열기</b>(또는 링크 열기) → 아래 링크로 하세요. 앱 아이콘을 길게 누르면 나오는 <b>다음 일정 길안내</b>도 같은 기능이에요.</div>`;
    const html = `
      <div style="${S}">차에 타서 휴대폰이 차와 연결되면, 로드플래너가 열리면서 <b>오늘 다음 일정</b>으로 내비가 자동으로 켜집니다.</div>
      <div style="font-weight:800;font-size:15px;margin:16px 0 8px;">1. 기본 내비</div>
      <div class="setting-options" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">${opt('tmap', '티맵')}${opt('kakao', '카카오내비')}${opt('choice', '매번 선택')}</div>
      <div style="font-weight:800;font-size:15px;margin:18px 0 8px;">2. 자동 실행 링크</div>
      <div style="display:flex;gap:6px;align-items:center;">
        <input readonly value="${this.LINK}" onclick="this.select()" style="flex:1;min-width:0;height:42px;border:1px solid #e2e8f0;border-radius:10px;padding:0 10px;font-size:13px;background:#f8fafc;color:#14161A;">
        <button type="button" onclick="AutoNav.copyLink(this)" style="height:42px;padding:0 14px;border-radius:10px;border:0;background:#3B45C4;color:#fff;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;">링크 복사</button>
      </div>
      <div style="font-weight:800;font-size:15px;margin:18px 0 0;">3. 휴대폰에 자동 실행 등록</div>
      ${isAndroid ? android + ios : ios + android}
      <a href="autonav-guide.html?os=${isAndroid ? 'android' : 'ios'}" style="display:flex;align-items:center;justify-content:center;width:100%;height:46px;margin-top:18px;border-radius:12px;background:#3B45C4;color:#fff;font-weight:800;font-size:15px;text-decoration:none;">그림으로 보는 설정 가이드</a>
      <button type="button" onclick="App.closeModal(); AutoNav.test()" style="width:100%;height:46px;margin-top:8px;border-radius:12px;border:1px solid #D5D9F7;background:#EEF0FD;color:#2B338F;font-weight:800;font-size:15px;cursor:pointer;">지금 시험해 보기</button>`;
    App.showModal('🚗 차에 타면 자동 길안내', html);
  },

  test() { this.start(); },

  // 오늘 화면 홍보 줄: 한 번도 자동 실행된 적 없고, ✕ 안 눌렀을 때만
  promoHtml() {
    try {
      if (localStorage.getItem('rp_autonav_used') || localStorage.getItem('rp_autonav_promo_off')) return '';
      const role = localStorage.getItem('bp_user_role');
      if (role === 'ceo' || role === 'hq_admin') return '';
    } catch (e) { return ''; }
    const os = /Android/i.test(navigator.userAgent) ? 'android' : 'ios';
    return `<div class="an-promo" role="note">
      <a class="an-promo-go" href="autonav-guide.html?os=${os}">
        <span class="an-promo-ic" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M6 17l1.5-5h9L18 17M7.5 12l1.2-3.6A2 2 0 0 1 10.6 7h2.8a2 2 0 0 1 1.9 1.4L16.5 12"/><circle cx="8" cy="17" r="1.6"/><circle cx="16" cy="17" r="1.6"/></svg></span>
        <span class="an-promo-t"><b>차에 타면 길안내가 저절로</b><small>차에 연결되면 다음 일정 내비 자동 실행</small></span>
        <span class="an-promo-btn">1분 설정</span>
      </a>
      <button type="button" class="an-promo-x" aria-label="다시 보지 않기" onclick="AutoNav.hidePromo()">✕</button>
    </div>`;
  },
  hidePromo() {
    try { localStorage.setItem('rp_autonav_promo_off', '1'); } catch (e) { }
    document.querySelectorAll('.an-promo').forEach(el => el.remove());
  },

  // ── 출발 15분 전 화면 알림 (앱이 켜져 있을 때) + 아이폰 앱 네이티브 알림 예약 전달 ──
  //  서버(예약 알림 함수)는 푸시로 보내고, 앱이 켜져 있으면 여기서 바로 화면에 띄운다
  _myDriveSteps() {
    const role = localStorage.getItem('bp_user_role');
    if (role === 'ceo' || role === 'hq_admin') return [];   // 본사 계정은 매니저 출발 알림 대상 아님
    const me = window.SupabaseClient?.currentUser?.id;
    if (!me || typeof State === 'undefined' || !State.calculateDailyEvents) return [];
    const out = [];
    for (let k = 0; k < 2; k++) {                               // 오늘·내일
      const d = new Date(); d.setDate(d.getDate() + k);
      let evs = [];
      try { evs = State.calculateDailyEvents(d.getFullYear(), d.getMonth(), d.getDate()) || []; } catch (e) { }
      const ymd = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      for (const ev of evs) {
        const label = String(ev.title || '');
        const wake = /^\[기상/.test(label);
        if (!ev.time || ev.done || ev.moving || (!wake && !/출발|이동|픽업/.test(label)) || /철수/.test(label)) continue;
        if (ev.stepCategory === 'rest') continue;
        const sch = ev.hqScheduleId && window.hqStore?.getSchedules?.().find(s => s.id === ev.hqScheduleId);
        if (sch && sch.managerId && sch.managerId !== me) continue;
        const base = new Date(`${ymd}T${ev.time}:00`);
        if (isNaN(base)) continue;
        base.setDate(base.getDate() + (ev.dayOffset || 0));   // 전날·다음날 단계
        const at = base.getTime();
        const realYmd = base.getFullYear() + '-' + String(base.getMonth() + 1).padStart(2, '0') + '-' + String(base.getDate()).padStart(2, '0');
        const id = `${ev.hqScheduleId || ev.id}|${ev.timelineIdx ?? ''}|${realYmd}|${ev.time}`;
        if (out.some(o => o.id === id)) continue;              // 오늘 목록·내일 목록에 같은 단계가 두 번 나오는 경우
        out.push({ ev, at, ymd: realYmd, sch, id, wake });
      }
    }
    return out.sort((a, b) => a.at - b.at);
  },

  _watchTick() {
    if (document.hidden) return;
    const steps = this._can('alerts') ? this._myDriveSteps() : [];
    this._sendNative(steps);
    const now = Date.now();
    const due = steps.find(s => !s.wake && (s.at - now) / 60000 <= 15 && (s.at - now) / 60000 > -5);
    if (!due) return;
    const key = 'rp_dep_alert_' + due.id;
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, String(now)); } catch (e) { }
    const left = Math.max(0, Math.round((due.at - now) / 60000));
    const raw = String(due.ev.title || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    const name = raw.replace(/^\[[^\]]+\]\s*/, '');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    try { navigator.vibrate && navigator.vibrate([250, 120, 250]); } catch (e) { }
    this._overlay(`
      <div class="an-k">🚗 ${left ? left + '분 뒤 출발' : '지금 출발할 시간'} · ${esc(due.ev.time)}</div>
      <div class="an-t">${esc(name)}</div>
      ${due.sch && !due.sch.isSecret ? `<div class="an-d">${esc((due.sch.artistName ? due.sch.artistName + ' · ' : '') + (due.sch.title || ''))}</div>` : ''}
      <div class="an-b">
        <button type="button" class="an-x" onclick="AutoNav.cancel()">닫기</button>
        <button type="button" class="an-go" onclick="AutoNav.cancel(); AutoNav.start()">길안내 시작</button>
      </div>`, true);
  },

  // 아이폰 앱(Xcode)에 다음 24시간 출발 알림 목록을 넘긴다 → 앱이 꺼져 있어도 폰이 알림 (앱 쪽 연결은 다음 빌드에서)
  _sendNative(steps) {
    const h = window.webkit?.messageHandlers?.roadplanner;   // 아이폰 앱
    const a = window.RoadPlannerAndroid;                       // 안드로이드 앱
    if (!h && !a) return;
    const items = steps.filter(s => s.at - Date.now() > 0 && s.at - Date.now() < 36 * 3600e3).map(s => ({
      id: s.id, fireAt: new Date(s.wake ? s.at : s.at - 15 * 60000).toISOString(),
      title: s.wake ? `⏰ 기상·준비 시간 · ${s.ev.time}` : `🚗 15분 뒤 출발 · ${s.ev.time}`,
      body: String(s.ev.title || '').replace(/^\[[^\]]+\]\s*/, ''),
      url: this.LINK
    }));
    const sig = JSON.stringify(items);
    if (sig === this._nativeSig) return;
    this._nativeSig = sig;
    try { if (h) h.postMessage({ type: 'reminders', items }); } catch (e) { }
    try { if (a && a.setReminders) a.setReminders(JSON.stringify(items)); } catch (e) { }
  },

  // ── 이동 중 지연 예상: [출발]을 누른 단계가 있으면 2분마다 내 위치 → 목적지 실시간 소요시간으로 도착 예상 ──
  //   목표 도착(다음 단계 시각)보다 5분 이상 늦을 것 같으면 알려 주고, 버튼 하나로 본사에 지연 보고
  async _delayCheck() {
    if (document.hidden || !navigator.geolocation || typeof TmapAPI === 'undefined') return;
    if (!window.Loc || !Loc.ok()) return;                     // 위치 동의 전에는 위치를 읽지 않음 (버튼 시각만으로 동작)
    if (typeof Plan !== 'undefined' && Plan.isIndie()) return;   // 본사 지연 보고 기능 → 개인 매니저는 없음
    if (Date.now() - (this._lastDelayCheck || 0) < 110000) return;
    const me = window.SupabaseClient?.currentUser?.id;
    if (!me) return;
    const todayYmd = (() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();
    const sch = (window.hqStore?.getSchedules?.() || []).find(s => s.managerId === me && s.date === todayYmd && Array.isArray(s.timeline) && s.timeline.some(st => st.moving && !st.done));
    if (!sch) return;
    const idx = sch.timeline.findIndex(st => st.moving && !st.done);
    const step = sch.timeline[idx], next = sch.timeline[idx + 1];
    if (!next || !next.time) return;
    this._lastDelayCheck = Date.now();
    const label = String(step.label || '');
    let dest = '';
    if (/픽업/.test(label) && sch.shop && sch.shop.needed) dest = sch.shop.address || sch.shop.name;
    else if (/복귀|철수/.test(label)) dest = (sch.departure && (sch.departure.address || sch.departure.place)) || '';
    else dest = sch.locationAddress || sch.location || '';
    if (!dest) return;
    const wait = /^\[메인 일정\]/.test(next.label || '') ? Number((String(next.desc || '').match(/(\d+)분 전\(/) || [])[1] || 10) : 0;
    const [h, m] = next.time.split(':').map(Number);
    const target = new Date(); target.setHours(h, m - wait, 0, 0);
    // 목표 시각이 이미 1시간 넘게 지났으면 '이동중' 표시가 남은 옛 단계 → 지연 계산 안 함 (707분 같은 엉뚱한 값 방지)
    if (Date.now() - target.getTime() > 60 * 60000) return;
    const pos = await Loc.get();
    if (!pos) return;
    const logKey = 'rp_loc_eta_' + sch.id + '_' + idx;          // 확인자료: 같은 이동 구간은 1번만 기록
    try { if (!sessionStorage.getItem(logKey)) { sessionStorage.setItem(logKey, '1'); Loc.log('eta', null, '이동 중 도착 예상·지연 계산'); } } catch (e) { }
    const pt = await KakaoAPI.geocode(dest);
    if (!pt) return;
    const eta = await TmapAPI.getRouteTime(pos.coords.longitude, pos.coords.latitude, pt.x, pt.y);
    if (!eta) return;
    const arrive = new Date(Date.now() + eta * 60000);
    const late = Math.round((arrive - target) / 60000);
    const key = 'rp_delay_' + sch.id + '_' + idx;
    let prev = 0; try { prev = Number(localStorage.getItem(key) || 0); } catch (e) { }
    if (late > 180) return;                                  // 3시간 넘는 지연은 계산 오류로 보고 알리지 않음
    if (late < 5 || late < prev + 10 && prev) return;      // 5분 미만이면 조용히, 이미 알린 뒤엔 10분 더 늦어질 때만
    try { localStorage.setItem(key, String(late)); } catch (e) { }
    const hhmm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    const name = label.replace(/^\[[^\]]+\]\s*/, '');
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    this._pendingDelay = { sch, late, arrive: hhmm(arrive), target: hhmm(target), name };
    try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { }
    this._overlay(`
      <div class="an-k" style="color:#dc2626;">⏰ 지연 예상 약 ${late}분</div>
      <div class="an-t">${esc(name)}</div>
      <div class="an-d">지금 교통이면 도착 예상 <b>${hhmm(arrive)}</b> (목표 ${hhmm(target)})</div>
      <div class="an-b">
        <button type="button" class="an-x" onclick="AutoNav.cancel()">닫기</button>
        <button type="button" class="an-go" style="background:#dc2626;" onclick="AutoNav.reportDelay()">본사에 지연 알리기</button>
      </div>`, true);
  },

  async reportDelay() {
    const d = this._pendingDelay;
    this.cancel();
    if (!d) return;
    const who = d.sch.isSecret ? '비공개 일정' : `${d.sch.artistName ? d.sch.artistName + ' · ' : ''}${d.sch.title || ''}`;
    try {
      if (window.Chat && window.Chat.available && window.Chat.available()) {
        await window.Chat.sendNotice({ title: `⏰ 지연 예상 약 ${d.late}분`, content: `${who}\n${d.name} · 도착 예상 ${d.arrive} (목표 ${d.target}, 현재 교통 기준)`, isUrgent: d.late >= 15 });
      }
      if (window.hqStore?.addStatusLog) await window.hqStore.addStatusLog(d.sch.id, { label: `[지연 예상] 약 ${d.late}분 · 도착 예상 ${d.arrive} (목표 ${d.target})` });
      if (window.Loc) Loc.provided('delay_report', '위치로 계산한 도착 예상 시각');
      if (typeof U !== 'undefined') U.toast('본사에 지연을 알렸어요.');
    } catch (e) { if (typeof U !== 'undefined') U.toast('알리지 못했어요. 로드톡으로 직접 보내 주세요.'); }
  },

  startWatch() {
    if (this._watching) return;
    this._watching = true;
    setTimeout(() => this._watchTick(), 4000);
    setInterval(() => { this._watchTick(); this._delayCheck().catch(() => { }); }, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => this._watchTick(), 1500); });
    window.addEventListener('hq-store-change', () => { clearTimeout(this._wt); this._wt = setTimeout(() => this._sendNative(this._can('alerts') ? this._myDriveSteps() : []), 1500); });
  },
};

window.AutoNav = AutoNav;
