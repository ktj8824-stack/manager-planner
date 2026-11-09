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
   - 넓은 화면: 왼쪽 입력 · 오른쪽 '매니저 앱에 보이는 동선' (스크롤해도 따라옴)
   - 좁은 화면: 입력 아래에
   - 등록할 때는 실제 교통으로 다시 계산해서 매니저 앱 타임라인에 들어감 (여기는 시간대 기준 추정) */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hm = (v) => String(v || '').slice(-5);
  const toMin = (v) => { const m = /^(\d{1,2}):(\d{2})/.exec(v || ''); return m ? +m[1] * 60 + +m[2] : NaN; };
  const ICON = { 기상: '⏰', 픽업: '🚐', 샵: '💄', 이동: '🚗', 현장: '🎬', 종료: '🏁' };
  let t = null;
  const optText = (id) => { const s = $(id); return s && s.selectedIndex >= 0 ? String(s.options[s.selectedIndex]?.text || '').replace(/\s*\(.*$/, '') : ''; };
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
    }
    return box;
  };
  const draw = () => {
    const box = ensureSide();
    if (!box || !window.hqStore || typeof window.hqStore.generateAutoTimeline !== 'function') return;
    box.hidden = false;
    const start = hm($('form-start-time')?.value);
    const end = hm($('form-end-time')?.value);
    const head = `<h4>매니저 앱에 보이는 동선</h4>`;
    if (!/^\d{2}:\d{2}$/.test(start)) {
      box.innerHTML = head + `<div class="sr-empty">시작 시간을 넣으면<br>기상부터 철수까지 동선이 바로 나와요</div>`;
      return;
    }
    const sch = {
      title: $('form-title')?.value || '스케줄',
      startTime: start, endTime: end || undefined,
      location: $('form-location')?.value || '',
      shop: { needed: !!$('form-shop-needed')?.checked, name: $('form-shop-name')?.value || '', address: $('form-shop-address')?.value || '', durationMin: Number($('form-shop-duration')?.value) || undefined },
      departure: { place: $('form-departure-place')?.value || '' },
    };
    let tl = [];
    try { tl = window.hqStore.generateAutoTimeline(sch) || []; } catch (e) { tl = []; }
    const clean = (l) => String(l || '').replace(/^\[[^\]]+\]\s*/, '');
    const KIND = (l) => /^\[기상/.test(l) ? '기상' : /^\[픽업/.test(l) ? '픽업' : /^\[헤어|샵/.test(l) ? '샵' : /^\[현장 이동/.test(l) ? '이동' : /^\[메인/.test(l) ? '현장' : /^\[현장 철수/.test(l) ? '종료' : '';
    const first = tl.find(x => /^\[(픽업|현장 이동)/.test(x.label || ''));
    const mgrId = $('form-manager')?.value || '';
    const mgr = optText('form-manager');
    const hasMgr = mgrId && !/미지정|선택/.test(mgr);
    // 겹침 확인: 같은 날 같은 매니저·차량
    const warns = [];
    if (end && start && toMin(end) <= toMin(start)) warns.push('종료 시간이 시작보다 빠르거나 같아요 (자정을 넘기는 일정이면 그대로 두세요)');
    try {
      const date = $('form-date')?.value;
      const r = window.hqStore.checkConflict?.({ id: $('form-sch-id')?.value || null, date, startTime: start, endTime: end || start, managerId: mgrId || null, vehicleId: $('form-vehicle')?.value || null });
      (r?.conflicts || []).slice(0, 3).forEach(c => warns.push(`${c.type === 'vehicle' ? '차량 ' + (c.vehicleName || '') : '매니저 ' + (c.managerName || '')} 겹침 · ${c.conflictTime} ${c.conflictArtist ? c.conflictArtist + ' ' : ''}${c.conflictScheduleTitle || ''}`));
    } catch (e) { }
    box.innerHTML = head
      + (first ? `<div class="sr-lead"><span>${hasMgr ? esc(mgr) + ' 출발' : '첫 출발'}</span><b>${esc(first.time)}</b></div>` : '')
      + `<ol class="sr-list">${tl.map(x => { const k = KIND(x.label || ''); return `<li class="k-${esc(k)}"><b>${esc(x.time || '')}</b><span><em>${ICON[k] || '•'}</em>${esc(clean(x.label))}${x.desc ? `<small>${esc(x.desc)}</small>` : ''}</span></li>`; }).join('')}</ol>`
      + warns.map(w => `<div class="sr-warn">⚠️ ${esc(w)}</div>`).join('')
      + `<p class="sr-note">${hasMgr ? `저장하면 ${esc(mgr)} 앱 타임라인에 이대로 들어가요.` : '담당 매니저를 고르면 그 매니저 앱 타임라인에 들어가요.'} 지금은 시간대 기준 추정이고, 저장할 때 실제 교통으로 다시 계산해요.</p>`;
  };
  const later = () => { clearTimeout(t); t = setTimeout(draw, 120); };
  const start = () => {
    const form = $('form-schedule');
    if (!form) return;
    form.addEventListener('input', later);
    form.addEventListener('change', later);
    const modal = $('modal-schedule-form');
    if (modal) new MutationObserver(() => { if (modal.classList.contains('active')) setTimeout(draw, 200); }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    // 시간 바퀴·검색 자동 입력은 이벤트 없이 값만 바뀌므로 주기적으로도 확인
    let key = '';
    setInterval(() => {
      if (!modal || !modal.classList.contains('active')) return;
      const k = ['form-start-time', 'form-end-time', 'form-date', 'form-location', 'form-departure-place', 'form-shop-name', 'form-manager', 'form-vehicle'].map(id => $(id)?.value || '').join('|') + ($('form-shop-needed')?.checked ? 1 : 0);
      if (k !== key) { key = k; draw(); }
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
