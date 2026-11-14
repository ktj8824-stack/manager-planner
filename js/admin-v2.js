/* 본사 웹 · 시안 반영: 계정 칩(동그란 첫 글자 + '이름 대표'), 왼쪽 위 회사 첫 글자 */
(function () {
  const sync = () => {
    const nm = document.getElementById('header-user-name');
    const av = document.getElementById('header-user-av');
    if (nm) {
      const t = nm.textContent.trim();
      const short = t.replace(/님$/, '');
      if (short !== t) nm.textContent = short;
      if (av) av.textContent = (short.replace(/^\s+/, '')[0] || '대');
    }
    const brand = document.getElementById('hq-brand-title');
    const ini = document.getElementById('hq-brand-initial');
    if (brand && ini) {
      const b = brand.textContent.replace(/\s*SCHEDULER$/i, '').trim();
      ini.textContent = (b && b !== 'SCHEDULER' ? b[0] : 'R').toUpperCase();
    }
  };
  const start = () => {
    sync();
    ['header-user-name', 'hq-brand-title'].forEach(id => {
      const el = document.getElementById(id);
      if (el) new MutationObserver(sync).observe(el, { childList: true, characterData: true, subtree: true });
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* 신규·수정 스케줄: 입력하는 옆에 매니저 동선을 바로 보여 줌 (CEO 플래너 일정 등록창 방식)
   - 넓은 화면: 왼쪽 입력 · 오른쪽 '매니저 앱에 보이는 동선' (스크롤해도 따라옴) + 맨 아래 등록 버튼
   - 입력하면 먼저 시간대 추정으로 바로 그리고, 입력이 멈추면 매니저 앱과 같은 방식(그날 교통 예측)으로 다시 계산
   - 저장할 때는 여기서 계산한 동선을 그대로 씀 (hqStore.rememberPreviewTimeline → buildTimelineCapped) */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toMin = (v) => { const m = /^(\d{1,2}):(\d{2})/.exec(v || ''); return m ? +m[1] * 60 + +m[2] : NaN; };
  const ICON = { 기상: '⏰', 픽업: '🚐', 샵: '💄', 이동: '🚗', 현장: '🎬', 종료: '🏁' };
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  let t = null, tReal = null, seq = 0;
  let real = { key: '', tl: null, state: 'idle' };          // state: idle | busy | done | fail
  const optText = (id) => { const s = $(id); return s && s.selectedIndex >= 0 ? String(s.options[s.selectedIndex]?.text || '').replace(/\s*\(.*$/, '') : ''; };
  const val = (id) => ($(id)?.value || '').trim();

  const ensureSide = () => {
    const modal = $('modal-schedule-form'); const box = $('sch-route-preview');
    if (!modal || !box) return null;
    let side = $('sch-side');
    if (!side) {
      const body = modal.querySelector('.modal-body');
      side = document.createElement('aside');
      side.id = 'sch-side'; side.className = 'sch-side';
      body.appendChild(side);
      body.classList.add('sch-split');
      side.appendChild(box);
      const go = document.createElement('button');
      go.type = 'button'; go.id = 'sch-side-submit'; go.className = 'sch-side-submit';
      go.addEventListener('click', () => {
        const f = $('form-schedule'); if (!f) return;
        if (f.requestSubmit) f.requestSubmit(f.querySelector('[type="submit"]')); else f.querySelector('[type="submit"]')?.click();
      });
      side.appendChild(go);
    }
    return box;
  };
  // 오른쪽 등록 버튼 = 폼 맨 아래 버튼과 같은 글씨·상태
  const syncBtn = () => {
    const go = $('sch-side-submit'); const sub = $('form-schedule')?.querySelector('[type="submit"]');
    if (!go || !sub) return;
    const txt = sub.textContent.trim() || '저장하고 매니저에게 알림';
    if (go.textContent !== txt) go.textContent = txt;
    go.disabled = !!sub.disabled;
  };

  const readForm = () => {
    let date = val('form-date'), start = val('form-start-time'), end = val('form-end-time');
    if (start.includes('T')) { date = start.split('T')[0]; start = start.split('T')[1]; }
    if (end.includes('T')) end = end.split('T')[1];
    start = start.slice(0, 5); end = end.slice(0, 5);
    return {
      title: val('form-title') || '스케줄', date, startTime: start, endTime: end || undefined,
      location: val('form-location'), locationAddress: val('form-location-address'),
      lat: val('form-location-lat') ? Number(val('form-location-lat')) : undefined, lng: val('form-location-lng') ? Number(val('form-location-lng')) : undefined,
      shop: { needed: !!$('form-shop-needed')?.checked, name: val('form-shop-name'), address: val('form-shop-address'), durationMin: Number(val('form-shop-duration')) || 90 },
      departure: { place: val('form-departure-place'), address: val('form-departure-address') },
    };
  };
  const canReal = (s) => s.date && /^\d{2}:\d{2}$/.test(s.startTime) && (s.location || s.locationAddress) && (s.departure.place || s.departure.address);

  // 매니저 앱과 같은 계산 (그날 교통 예측). 입력이 0.9초 멈추면 실행, 같은 입력은 다시 안 함
  const runReal = async () => {
    const st = window.hqStore; if (!st || typeof st.buildTimelineCapped !== 'function') return;
    const s = readForm();
    if (!canReal(s)) { real = { key: '', tl: null, state: 'idle' }; draw(); return; }
    const key = st.timelineKey(s);
    if (key === real.key && real.state !== 'fail') return;
    const my = ++seq;
    real = { key, tl: null, state: 'busy' }; draw();
    let tl = null;
    try { st._previewTL = null; tl = await st.buildTimelineCapped(JSON.parse(JSON.stringify(s)), 12000); } catch (e) { tl = null; }
    if (my !== seq) return;                                   // 그 사이 입력이 바뀜
    const ok = Array.isArray(tl) && tl.length && tl.some(x => /교통 예측|현재 교통/.test(x.desc || ''));
    real = { key, tl: Array.isArray(tl) && tl.length ? tl : null, state: ok ? 'done' : 'fail' };
    if (real.tl && ok) st.rememberPreviewTimeline(s, real.tl);   // 교통 조회 실패(추정)면 저장 때 다시 계산
    draw();
  };

  const draw = () => {
    const box = ensureSide();
    syncBtn();
    if (!box || !window.hqStore || typeof window.hqStore.generateAutoTimeline !== 'function') return;
    box.hidden = false;
    const s = readForm();
    const head = `<h4>매니저 앱에 보이는 동선</h4>`;
    if (!/^\d{2}:\d{2}$/.test(s.startTime)) {
      box.innerHTML = head + `<div class="sr-empty">시작 시간을 넣으면<br>기상부터 철수까지 동선이 바로 나와요</div>`;
      return;
    }
    const key = window.hqStore.timelineKey ? window.hqStore.timelineKey(s) : '';
    const useReal = real.tl && real.key === key;
    let tl = [];
    if (useReal) tl = real.tl;
    else { try { tl = window.hqStore.generateAutoTimeline(s) || []; } catch (e) { tl = []; } }
    const clean = (l) => String(l || '').replace(/^\[[^\]]+\]\s*/, '');
    const KIND = (l) => /^\[기상/.test(l) ? '기상' : /^\[픽업/.test(l) ? '픽업' : /^\[헤어|샵/.test(l) ? '샵' : /^\[현장 이동/.test(l) ? '이동' : /^\[메인/.test(l) ? '현장' : /^\[현장 철수/.test(l) ? '종료' : '';
    const first = tl.find(x => /^\[(픽업|현장 이동)/.test(x.label || ''));
    const mgrId = val('form-manager');
    const mgr = optText('form-manager');
    const hasMgr = mgrId && !/미지정|선택/.test(mgr);
    const dlabel = s.date ? (() => { const d = new Date(s.date + 'T12:00:00'); return `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`; })() : '';
    // 계산 기준 표시
    let basis;
    if (!canReal(s)) basis = `<div class="sr-basis est">시간대 기준 추정 · 장소와 출발 장소를 넣으면 실제 교통으로 계산해요</div>`;
    else if (real.key === key && real.state === 'busy') basis = `<div class="sr-basis busy"><i></i>${esc(dlabel)} 실제 교통으로 계산 중…</div>`;
    else if (useReal && real.state === 'done') basis = `<div class="sr-basis ok">✓ ${esc(dlabel)} 그날 교통 예측 기준 · 매니저 앱에 이대로 들어가요</div>`;
    else if (useReal) basis = `<div class="sr-basis est">교통 정보를 못 받아 거리·시간대로 추정했어요 <button type="button" class="sr-retry" onclick="window.__schRealRetry && window.__schRealRetry()">다시 계산</button></div>`;
    else basis = `<div class="sr-basis busy"><i></i>${esc(dlabel)} 실제 교통으로 계산 중…</div>`;
    // 겹침 확인: 같은 날 같은 매니저·차량
    const warns = [];
    if (s.endTime && toMin(s.endTime) <= toMin(s.startTime)) warns.push('종료 시간이 시작보다 빠르거나 같아요 (자정을 넘기는 일정이면 그대로 두세요)');
    try {
      const r = window.hqStore.checkConflict?.({ id: val('form-sch-id') || null, date: s.date, startTime: s.startTime, endTime: s.endTime || s.startTime, managerId: mgrId || null, vehicleId: val('form-vehicle') || null });
      (r?.conflicts || []).slice(0, 3).forEach(c => warns.push(`${c.type === 'vehicle' ? '차량 ' + (c.vehicleName || '') : '매니저 ' + (c.managerName || '')} 겹침 · ${c.conflictTime} ${c.conflictArtist ? c.conflictArtist + ' ' : ''}${c.conflictScheduleTitle || ''}`));
    } catch (e) { }
    // 앞 일정이 끝나기 전에 이 일정 첫 출발이 잡히는지 (같은 날 같은 매니저)
    try {
      const f0 = first && String(first.time || '').slice(0, 5);
      if (hasMgr && s.date && /^\d{2}:\d{2}$/.test(f0 || '') && toMin(f0) < toMin(s.startTime)) {
        const myId = val('form-sch-id');
        const prev = (window.hqStore.getSchedules() || []).filter(x => x && x.id !== myId && x.date === s.date && x.managerId === mgrId && x.status !== '취소'
          && /^\d{2}:\d{2}/.test(String(x.startTime || '')) && toMin(String(x.startTime).slice(0, 5)) < toMin(s.startTime)
          && /^\d{2}:\d{2}/.test(String(x.endTime || '')) && toMin(String(x.endTime).slice(0, 5)) > toMin(f0));
        prev.sort((a, b) => toMin(String(b.endTime).slice(0, 5)) - toMin(String(a.endTime).slice(0, 5)));
        if (prev[0]) { const x = prev[0]; const art = String(x.artistName || '').replace(/\s*\([^)]*\)\s*$/, ''); warns.push(`앞 일정(${art ? art + ' ' : ''}${x.title || ''} ~${String(x.endTime).slice(0, 5)})이 끝나기 전에 ${f0} 출발해야 해요 · 시간이나 담당 매니저를 확인해 주세요`); }
      }
    } catch (e) { }
    // 실제 이동 기록 (같은 길을 3번 이상 다녔으면 평균) — CEO플래너 '이동 시간 학습'
    let learnHtml = '';
    try {
      if (window.Learn && s.date && (s.departure.place || s.departure.address) && (s.location || s.locationAddress)) {
        const all = window.hqStore.getSchedules() || [];
        const shopOn = s.shop.needed && (s.shop.address || s.shop.name);
        const legs = [];
        if (shopOn) legs.push({ name: '집·회사 → 샵', from: s.departure, to: s.shop, step: tl.find(x => /^\[픽업/.test(x.label || '')) });
        legs.push({ name: shopOn ? '샵 → 현장' : '출발지 → 현장', from: shopOn ? s.shop : s.departure, to: s.locationAddress || s.location, step: tl.find(x => /^\[현장 이동/.test(x.label || '')) });
        legs.forEach(L => {
          const hm = String(L.step && L.step.time || '').slice(0, 5);
          const at = /^\d{2}:\d{2}$/.test(hm) ? `${s.date}T${hm}:00+09:00` : null;
          const r = Learn.travel(all, { from: L.from, to: L.to, at });
          if (!r) return;
          const plan = Number((String(L.step && L.step.desc || '').match(/이동 약 (\d+)분/) || [])[1]) || 0;
          const diff = plan ? r.avg - plan : 0;
          learnHtml += `<div class="sr-learn"><b>📊 실제 기록 · ${esc(L.name)}</b> 평균 ${r.avg}분${r.slot ? ` (${esc(r.slot)} ${r.n}번)` : ` (${r.n}번)`}`
            + (diff >= 5 ? ` · <em>계획(${plan}분)보다 ${diff}분 더 걸렸어요. 출발을 당기는 걸 권해요</em>` : diff <= -10 ? ` · 계획보다 ${-diff}분 빨랐어요` : '') + `</div>`;
        });
      }
    } catch (e) { }
    box.innerHTML = head + basis + learnHtml
      + (first ? `<div class="sr-lead"><span>${hasMgr ? esc(mgr) + ' 출발' : '첫 출발'}</span><b>${esc(first.time)}</b></div>` : '')
      + `<ol class="sr-list${useReal ? '' : ' est'}">${tl.map(x => { const k = KIND(x.label || ''); return `<li class="k-${esc(k)}"><b>${esc(x.time || '')}</b><span><em>${ICON[k] || '•'}</em>${esc(clean(x.label))}${x.desc ? `<small>${esc(x.desc)}</small>` : ''}</span></li>`; }).join('')}</ol>`
      + warns.map(w => `<div class="sr-warn">⚠️ ${esc(w)}</div>`).join('')
      + `<p class="sr-note">${hasMgr ? `저장하면 ${esc(mgr)} 앱 타임라인에 이 동선이 들어가요.` : '담당 매니저를 고르면 그 매니저 앱 타임라인에 들어가요.'}</p>`;
  };
  window.__schRealRetry = () => { real = { key: '', tl: null, state: 'idle' }; runReal(); };
  const later = () => { clearTimeout(t); t = setTimeout(draw, 120); clearTimeout(tReal); tReal = setTimeout(runReal, 900); };
  const start = () => {
    const form = $('form-schedule');
    if (!form) return;
    form.addEventListener('input', later);
    form.addEventListener('change', later);
    const modal = $('modal-schedule-form');
    if (modal) new MutationObserver(() => {
      if (modal.classList.contains('active')) { seq++; real = { key: '', tl: null, state: 'idle' }; setTimeout(() => { draw(); runReal(); }, 250); }
      else { seq++; if (window.hqStore) window.hqStore._previewTL = null; }
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    // 시간 바퀴·검색 자동 입력은 이벤트 없이 값만 바뀌므로 주기적으로도 확인
    let key = '';
    setInterval(() => {
      if (!modal || !modal.classList.contains('active')) return;
      syncBtn();
      const k = ['form-start-time', 'form-end-time', 'form-date', 'form-location', 'form-location-address', 'form-departure-place', 'form-departure-address', 'form-shop-name', 'form-shop-address', 'form-shop-duration', 'form-manager', 'form-vehicle'].map(id => $(id)?.value || '').join('|') + ($('form-shop-needed')?.checked ? 1 : 0);
      if (k !== key) { key = k; later(); }
    }, 600);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* 긴급 공지: 매니저 앱에서 어떻게 보이는지 미리보기 + 받는 사람 수가 들어간 보내기 버튼 */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const count = () => {
    const sel = $('msg-target-manager');
    if (!sel || sel.value !== 'ALL') return 1;
    try { const list = window.hqStore?.getManagers?.() || []; const n = (Array.isArray(list) ? list : []).filter(m => !['ceo', 'hq_admin'].includes(m.role)).length; return n || (sel.options.length - 1) || 1; } catch (e) { return sel.options.length - 1 || 1; }
  };
  const draw = () => {
    const form = $('form-send-message');
    if (!form) return;
    let box = $('msg-app-preview');
    if (!box) {
      box = document.createElement('section');
      box.id = 'msg-app-preview'; box.className = 'msg-prev';
      const actions = form.querySelector('button[type="submit"]')?.parentElement;
      form.insertBefore(box, actions && actions.parentElement === form ? actions : null);
    }
    const urgent = !!$('msg-is-urgent')?.checked;
    const title = ($('msg-title')?.value || '').trim() || (urgent ? '긴급 공지' : '본사 공지');
    const body = ($('msg-content')?.value || '').trim() || '내용을 쓰면 여기에 그대로 보여요';
    const n = count();
    box.innerHTML = `<h4>매니저 앱 미리보기</h4><div class="msg-prev-phone"><article class="msg-prev-card${urgent ? ' urgent' : ''}">
        <span class="tag">${urgent ? '긴급 · 확인 필요' : '본사 공지'}</span><b>${esc(title)}</b><p>${esc(body.length > 90 ? body.slice(0, 90) + '…' : body)}</p>
        ${urgent ? '<span class="ack">확인했어요</span>' : ''}</article></div>
      <p class="msg-prev-note">${urgent ? '매니저 앱 로드톡 맨 위에 빨간 카드로 뜨고 소리 알림이 가요. ' : '매니저 앱 로드톡 · 공지 탭에 들어가요. '}보낸 뒤 로드톡에서 몇 명이 확인했는지 볼 수 있어요.</p>`;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.textContent = `${n > 1 ? n + '명에게 ' : ''}${urgent ? '긴급 발송' : '공지 보내기'}`; btn.classList.toggle('msg-send-urgent', urgent); }
    const h = $('modal-send-message')?.querySelector('.modal-header h3');
    if (h && !h.dataset.v2) { h.dataset.v2 = '1'; h.innerHTML = '<span class="msg-h">매니저에게 공지 보내기<small>매니저 앱 로드톡 · 공지 탭으로 전달돼요</small></span>'; }
  };
  const start = () => {
    const form = $('form-send-message'); const modal = $('modal-send-message');
    if (!form || !modal) return;
    form.addEventListener('input', draw); form.addEventListener('change', draw);
    new MutationObserver(() => { if (modal.classList.contains('active')) setTimeout(draw, 50); }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* v3 심플 본사 화면 (2026-11-10 시안)
   - 왼쪽 흰 메뉴: 오늘 현황·캘린더는 보기 전환, 나머지는 기존 버튼을 그대로 누름
   - 제목·날짜: 지금 보기에 맞춰 바뀜
   - 오른쪽 '확인할 것': 지연 · 변경 확인 안 함 · 경비 승인 대기 · 내일 담당 미지정 (오늘 현황에서만) */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const TITLE = { gantt: '오늘 현황', month: '캘린더', week: '주간 시간표', kanban: '실시간 상황판', map: '관제 지도', analytics: '활동 분석' };
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  let expPending = null;

  const view = () => document.querySelector('.view-tab-btn.active')?.dataset.view || 'gantt';
  const syncHead = () => {
    const v = view();
    const t = $('hq-page-title'); if (t && t.textContent !== TITLE[v]) t.textContent = TITLE[v] || '오늘 현황';
    const d = new Date();
    const pd = $('hq-page-date'); if (pd) pd.textContent = `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAYS[d.getDay()]}요일 · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    document.querySelectorAll('.hq-menu [data-go]').forEach(b => b.classList.toggle('on', (b.dataset.go === 'month' && v !== 'gantt') || b.dataset.go === v));
    document.body.classList.toggle('hq-today-view', v === 'gantt');
    const cb = $('chat-badge'), mb = $('hq-menu-chat-badge');
    if (cb && mb) { mb.hidden = cb.hidden || !cb.textContent || cb.textContent === '0'; mb.textContent = cb.textContent; }
  };

  async function loadExpPending() {
    try {
      const sc = window.SupabaseClient;
      if (!sc || !sc.isConfigured || !sc.client) return;
      const { data } = await sc.client.from('expenses').select('id, amount, date').eq('status', 'pending').order('date').limit(200);
      expPending = Array.isArray(data) ? { n: data.length, sum: data.reduce((a, r) => a + (Number(r.amount) || 0), 0), month: String(data[0]?.date || '').slice(0, 7) } : null;
      const ed = await sc.client.from('expenses').select('id, date').eq('status', 'approved').not('edited_after_approval_at', 'is', null).order('date').limit(200);
      if (expPending && Array.isArray(ed.data)) { expPending.edited = ed.data.length; expPending.editedMonth = String(ed.data[0]?.date || '').slice(0, 7); }
    } catch (e) { expPending = null; }
  }

  // 매니저 위치 동의 상태 · 본사 긴급 전화번호 (본사 '확인할 것'과 매니저 목록에 씀)
  let hints = null;
  async function loadHints() {
    try {
      const sc = window.SupabaseClient;
      if (!sc || !sc.isConfigured || !sc.client || !sc.currentUser) return;
      const [pr, lc] = await Promise.all([
        sc.client.from('profiles').select('id, name, role, phone'),
        sc.client.from('location_consents').select('user_id, agreed'),
      ]);
      if (pr.error) return;
      const agreed = {}; (lc.data || []).forEach(r => { agreed[r.user_id] = !!r.agreed; });
      const people = pr.data || [];
      hints = {
        agreed,
        noConsent: people.filter(p => p.role === 'manager' && agreed[p.id] !== true),
        hqPhone: people.some(p => ['ceo', 'hq_admin'].includes(p.role) && String(p.phone || '').replace(/[^0-9]/g, '').length >= 8),
      };
      window.HqHints = hints;
    } catch (e) { }
  }
  async function setMyPhone() {
    const v = prompt('매니저 앱 [긴급] 화면에 보일 내 휴대폰 번호를 넣어 주세요', '');
    if (v === null) return;
    const tel = String(v).replace(/[^0-9-]/g, '');
    if (tel.replace(/-/g, '').length < 9) { alert('번호를 다시 확인해 주세요.'); return; }
    try {
      const sc = window.SupabaseClient;
      const { error } = await sc.client.from('profiles').update({ phone: tel }).eq('id', sc.currentUser.id);
      if (error) throw error;
      await loadHints(); drawTodo();
      alert('저장했어요. 매니저 [긴급] 화면에 이 번호로 전화 버튼이 보여요.');
    } catch (e) { alert('저장하지 못했어요. 인터넷 연결을 확인해 주세요.'); }
  }

  // 경비 창을 해당 경비가 있는 달로 열기 (다른 달 경비면 이번 달 창에 안 보이므로)
  function openExp(month) {
    if (month && /^\d{4}-\d{2}$/.test(month) && window.HqExpenses) HqExpenses.month = month;
    $('btn-open-expenses')?.click();
  }

  function drawTodo() {
    const box = $('hq-todo'); const st = window.hqStore;
    if (!box || !st) return;
    const items = [];
    try {
      (window.Admin?._lateList?.() || []).slice(0, 3).forEach(r => items.push({
        k: 'late', title: `${r.s.managerName || '담당 미지정'} · ${r.late}분 늦음`, sub: `${String(r.s.artistName || '').replace(/\s*\([^)]*\)\s*$/, '')} ${r.s.title || ''} · ${String(r.note || '').replace(/^\[[^\]]+\]\s*/, '')}`,
        act: '로드톡', run: () => { try { Chat.open(r.s.managerId ? { managerId: r.s.managerId } : undefined); } catch (e) { $('btn-open-chat')?.click(); } }
      }));
    } catch (e) { }
    try {
      const t0 = new Date(); t0.setHours(0, 0, 0, 0);
      const ack = (st.getSchedules() || []).filter(s => { const d = new Date((s.date || '') + 'T00:00:00'); if (isNaN(d) || d < t0) return false; const a = st.ackState && st.ackState(s); return a && a.pending; });
      if (ack.length) items.push({ k: 'info', title: `변경 확인 안 함 ${ack.length}건`, sub: `${ack[0].managerName || '담당 미지정'} · ${String(ack[0].artistName || '').replace(/\s*\([^)]*\)\s*$/, '')} ${ack[0].title || ''}${ack.length > 1 ? ` 외 ${ack.length - 1}건` : ''}`, act: '보기', run: () => window.Admin?.openScheduleDetail?.(ack[0].id) });
    } catch (e) { }
    // 매니저의 일정 조정 요청 (겹침) — 아직 본사가 확인 안 한 것
    try {
      const t0 = new Date(); t0.setHours(0, 0, 0, 0);
      const adj = (st.getSchedules() || []).filter(s => { const d = new Date((s.date || '') + 'T00:00:00'); if (isNaN(d) || d < t0) return false; const a = st.adjustState && st.adjustState(s); return a && a.stage === 'asked'; })
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
      adj.slice(0, 3).forEach(s => items.unshift({ k: 'late', title: `조정 요청 · ${s.managerName || '매니저'}`, sub: `${String(s.date).slice(5).replace('-', '/')} ${String(s.artistName || '').replace(/\s*\([^)]*\)\s*$/, '')} ${s.title || ''} · ${String(st.adjustState(s).request.label || '').replace(/^\[[^\]]+\]\s*/, '')}`, act: '확인했어요',
        run: async () => { try { await st.seeAdjust(s.id); } catch (e) { } drawTodo(); window.Admin?.openScheduleDetail?.(s.id); } }));
    } catch (e) { }
    if (expPending && expPending.n) items.push({ k: 'info', title: `경비 승인 대기 ${expPending.n}건`, sub: `합계 ${expPending.sum.toLocaleString('ko-KR')}원`, act: '승인하기', run: () => openExp(expPending.month) });
    if (expPending && expPending.edited) items.push({ k: 'info', title: `승인 후 수정된 경비 ${expPending.edited}건`, sub: '매니저가 승인된 경비를 고쳤어요', act: '확인하기', run: () => openExp(expPending.editedMonth) });
    try {
      const tm = new Date(); tm.setDate(tm.getDate() + 1);
      const un = (st.getSchedules() || []).filter(s => s.date === ymd(tm) && !s.managerId && s.status !== 'cancelled');
      if (un.length) items.push({ k: 'mute', title: `내일 담당 미지정 ${un.length}건`, sub: `${tm.getMonth() + 1}/${tm.getDate()} ${un[0].startTime || ''} ${un[0].title || ''}`, act: '배정', run: () => window.Admin?.openScheduleDetail?.(un[0].id) });
    } catch (e) { }
    if (hints && !hints.hqPhone) items.push({ k: 'late', title: '긴급 지원 전화가 비어 있어요', sub: '매니저가 [긴급]을 눌러도 본사로 전화할 번호가 없어요', act: '내 번호 넣기', run: setMyPhone });
    if (hints && hints.noConsent.length) items.push({ k: 'mute', title: `위치 미동의 매니저 ${hints.noConsent.length}명`, sub: `${hints.noConsent.slice(0, 3).map(p => p.name || '이름 없음').join(', ')}${hints.noConsent.length > 3 ? ` 외 ${hints.noConsent.length - 3}명` : ''} · 이동 중 지연 예상이 오지 않아요`, act: '로드톡', run: () => { try { Chat.open({ managerId: hints.noConsent[0].id }); } catch (e) { $('btn-open-chat')?.click(); } } });
    box._items = items;
    box.innerHTML = `<h3>확인할 것 <span>${items.length}</span></h3>` + (items.length
      ? items.map((it, i) => `<div class="hq-todo-row ${it.k}"><span class="d" aria-hidden="true"></span><div class="t"><b>${esc(it.title)}</b><small>${esc(it.sub)}</small></div><button type="button" data-i="${i}">${esc(it.act)}</button></div>`).join('')
      : '<p class="hq-todo-empty">지금 확인할 것이 없어요.</p>');
  }

  const start = () => {
    document.querySelectorAll('.hq-menu button').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.go) document.querySelector(`.view-tab-btn[data-view="${b.dataset.go}"]`)?.click();
      else if (b.dataset.click) $(b.dataset.click)?.click();
      setTimeout(syncHead, 50);
    }));
    $('hq-todo')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-i]'); if (!btn) return;
      const it = ($('hq-todo')._items || [])[+btn.dataset.i]; if (it && it.run) it.run();
    });
    document.querySelectorAll('.view-tab-btn').forEach(b => b.addEventListener('click', () => setTimeout(syncHead, 30)));
    const brief = $('today-brief');
    if (brief) new MutationObserver(() => { drawTodo(); syncHead(); }).observe(brief, { childList: true });
    const cb = $('chat-badge'); if (cb) new MutationObserver(syncHead).observe(cb, { attributes: true, childList: true, characterData: true, subtree: true });
    syncHead(); drawTodo();
    Promise.all([loadExpPending(), loadHints()]).then(drawTodo);
    setInterval(() => { syncHead(); Promise.all([loadExpPending(), loadHints()]).then(drawTodo); }, 60000);
  };
  window.HqTodo = { draw: drawTodo };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* 반복 일정 (CEO플래너에서 가져옴): 매주 · 평일 · 격주 · 매월
   - 새 일정 등록 창의 날짜 줄 아래에 [반복] 고르기 + 몇 번
   - 저장하면 나머지 날짜도 같은 내용으로 만들고(날짜마다 동선은 그날 교통으로 따로 계산), 묶음(series)으로 기억
   - 반복 일정을 고치거나 지우면 "이후 반복 일정도 같이?" 물어봄 */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const short = (d) => { const x = new Date(d + 'T12:00:00'); return `${x.getMonth() + 1}/${x.getDate()}(${DAYS[x.getDay()]})`; };
  const isUuid = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v || '');
  const who = () => (localStorage.getItem('admin_bp_user_name') || localStorage.getItem('bp_user_name') || '본사') + ' (본사)';
  const ackFor = (mid) => (isUuid(mid) && mid !== window.SupabaseClient?.currentUser?.id) ? { need: true, managerId: mid } : null;
  // 이후 반복 일정에 같이 옮기는 칸 (날짜·묶음·동선·기록·진행 상태는 그대로)
  const SHARED = ['title', 'artistId', 'artistIds', 'artistName', 'targetMembers', 'category', 'startTime', 'endTime', 'durationMin', 'managerId', 'managerName', 'vehicleId', 'vehicleName',
    'location', 'locationAddress', 'lat', 'lng', 'outfit', 'contactName', 'contactPhone', 'notes', 'isSecret', 'secretLevel', 'shop', 'departure'];

  const ensureRow = () => {
    const date = $('form-date'); if (!date) return null;
    let row = $('sch-repeat-row');
    if (!row) {
      row = document.createElement('div');
      row.id = 'sch-repeat-row'; row.className = 'sch-repeat';
      row.innerHTML = `<label class="form-label" for="form-repeat">반복</label>
        <div class="sch-repeat-in">
          <select id="form-repeat" class="form-input"><option value="">안 함</option>${Object.entries(Repeat.KINDS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
          <label class="sch-repeat-n"><input type="number" id="form-repeat-count" class="form-input" min="2" max="${Repeat.MAX}" value="4"> 번</label>
        </div>
        <div id="sch-repeat-hint" class="sch-repeat-hint"></div>`;
      const formRow = date.closest('.form-row') || date.closest('.form-group');
      formRow.insertAdjacentElement('afterend', row);
      row.addEventListener('input', draw); row.addEventListener('change', draw);
    }
    return row;
  };
  const current = () => { try { return (window.hqStore.getSchedules() || []).find(x => x.id === $('form-sch-id')?.value) || null; } catch (e) { return null; } };
  const draw = () => {
    const row = ensureRow(); if (!row || !window.Repeat) return;
    const editing = !!$('form-sch-id')?.value;
    const sel = $('form-repeat'), cnt = $('form-repeat-count'), hint = $('sch-repeat-hint');
    const inp = row.querySelector('.sch-repeat-in');
    if (editing) {
      const s = current();
      const later = s && s.series ? Repeat.later(window.hqStore.getSchedules(), s) : [];
      inp.hidden = true;
      row.hidden = !(s && s.series);
      hint.innerHTML = s && s.series ? `🔁 ${esc(Repeat.KINDS[s.series.kind] || '반복')} 반복 일정${later.length ? ` · 이후 ${later.length}건 (저장할 때 같이 바꿀지 물어봐요)` : ''}` : '';
      return;
    }
    row.hidden = false; inp.hidden = false;
    cnt.closest('.sch-repeat-n').style.visibility = sel.value ? 'visible' : 'hidden';   // '번' 글자까지 같이 숨김
    if (!sel.value || !$('form-date').value) { hint.textContent = ''; return; }
    const ds = Repeat.dates($('form-date').value, sel.value, cnt.value);
    hint.textContent = `${ds.length}건 등록: ${ds.slice(0, 6).map(short).join(', ')}${ds.length > 6 ? ` … ${short(ds[ds.length - 1])}` : ''}`;
  };

  const AdminRepeat = {
    /** 저장 직전: 새 일정에 반복을 골랐으면 묶음 표시를 붙이고 날짜 목록을 돌려줌 */
    decorate(schData) {
      if (!window.Repeat || $('form-sch-id')?.value) return null;
      const kind = $('form-repeat')?.value;
      if (!kind) return null;
      const dates = Repeat.dates(schData.date, kind, $('form-repeat-count')?.value);
      if (dates.length < 2) return null;
      schData.series = { id: 'ser_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kind, idx: 0, count: dates.length };
      return dates;
    },
    /** 저장한 뒤: 나머지 반복 일정 만들기 / 이후 반복 일정 같이 바꾸기 */
    async afterSave(prev, schData, dates, btn) {
      const st = window.hqStore;
      // 1) 새 반복 일정
      if (!prev && dates && dates.length > 1 && schData.series) {
        let made = 0;
        for (let i = 1; i < dates.length; i++) {
          if (btn) btn.textContent = `반복 일정 저장 중… (${i + 1}/${dates.length})`;
          const copy = JSON.parse(JSON.stringify(schData));
          delete copy.timeline; delete copy.statusLogs; delete copy.remoteId; delete copy.syncStatus;
          copy.id = 'sch_' + Date.now() + '_' + i;
          copy.date = dates[i];
          copy.series = { ...schData.series, idx: i };
          try {
            await st.saveSchedule(copy);
            await st.addStatusLog(copy.id, { label: '[일정 등록] 본사에서 반복 일정을 등록했습니다', managerName: who(), ack: ackFor(copy.managerId) });
            made++;
          } catch (e) { if (e && e.localSaved) made++; else console.warn('반복 일정 저장 실패', dates[i], e); }
        }
        return `🔁 반복 일정 ${made + 1}건을 등록했어요 (${short(dates[0])} ~ ${short(dates[dates.length - 1])}).`;
      }
      // 2) 반복 일정을 고침 → 이후 것도 같이?
      if (prev && prev.series) {
        const later = Repeat.later(st.getSchedules(), prev);
        if (!later.length) return '';
        const changed = SHARED.filter(k => JSON.stringify(prev[k] ?? '') !== JSON.stringify(schData[k] ?? ''));
        if (!changed.length) return '';
        if (!confirm(`이후 반복 일정 ${later.length}건(${short(later[0].date)}~)도 같이 바꿀까요?\n\n날짜는 그대로 두고 바꾼 내용(시간·장소·담당 등)만 옮겨요.\n[취소]를 누르면 이 일정만 바뀌어요.`)) return '';
        let n = 0;
        for (const sib of later) {
          if (btn) btn.textContent = `이후 반복 일정 바꾸는 중… (${n + 1}/${later.length})`;
          const before = JSON.parse(JSON.stringify(sib));
          const next = { ...JSON.parse(JSON.stringify(sib)) };
          changed.forEach(k => { next[k] = schData[k] === undefined ? undefined : JSON.parse(JSON.stringify(schData[k])); });
          try {
            await st.saveSchedule(next);
            const diff = window.ScheduleNotify?.historyDiff ? window.ScheduleNotify.historyDiff(before, next) : null;
            if (diff && diff.length) await st.addStatusLog(next.id, { label: '[일정 수정] ' + diff.join(' · ') + ' (반복 일정 함께)', managerName: who(), ack: ackFor(next.managerId) });
            if (window.ScheduleNotify) window.ScheduleNotify.afterSave(before, next).catch(() => { });
            n++;
          } catch (e) { if (e && e.localSaved) n++; }
        }
        return `🔁 이후 반복 일정 ${n}건도 같이 바꿨어요.`;
      }
      return '';
    },
    /** 지운 뒤: 이후 반복 일정도 같이 지울지 */
    async afterDelete(del) {
      if (!del || !del.series) return '';
      const st = window.hqStore;
      const later = Repeat.later(st.getSchedules(), del);
      if (!later.length || !confirm(`이후 반복 일정 ${later.length}건(${short(later[0].date)}~)도 같이 지울까요?`)) return '';
      let n = 0;
      for (const sib of later) {
        try { await st.deleteSchedule(sib.id); if (window.ScheduleNotify) window.ScheduleNotify.afterDelete(sib).catch(() => { }); n++; } catch (e) { }
      }
      return `🔁 이후 반복 일정 ${n}건도 지웠어요.`;
    },
  };
  window.AdminRepeat = AdminRepeat;

  const start = () => {
    const modal = $('modal-schedule-form');
    if (!modal) return;
    new MutationObserver(() => {
      if (!modal.classList.contains('active')) return;
      ensureRow();
      if ($('form-repeat') && !$('form-sch-id')?.value) $('form-repeat').value = '';
      setTimeout(draw, 300);
    }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    $('form-date')?.addEventListener('change', draw);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
