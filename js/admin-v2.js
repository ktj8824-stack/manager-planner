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
    if (real.tl) st.rememberPreviewTimeline(s, real.tl);
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
    box.innerHTML = head + basis
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
