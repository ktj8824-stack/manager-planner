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

/* 신규·수정 스케줄: 입력하면서 매니저 동선(기상 → 픽업 → 샵 → 현장)을 바로 계산해 보여 줌
   - 등록할 때는 실제 교통으로 다시 계산해서 매니저 앱 타임라인에 들어감 (여기는 시간대 기준 추정) */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let t = null;
  const draw = () => {
    const box = $('sch-route-preview');
    if (!box || !window.hqStore || typeof window.hqStore.generateAutoTimeline !== 'function') return;
    const start = ($('form-start-time')?.value || '').slice(-5);
    if (!/^\d{2}:\d{2}$/.test(start)) { box.hidden = true; return; }
    const sch = {
      title: $('form-title')?.value || '스케줄',
      startTime: start,
      endTime: ($('form-end-time')?.value || '').slice(-5) || undefined,
      location: $('form-location')?.value || '',
      shop: { needed: !!$('form-shop-needed')?.checked, name: $('form-shop-name')?.value || '', durationMin: Number($('form-shop-duration')?.value) || undefined },
      departure: { place: $('form-departure-place')?.value || '' },
    };
    let tl = [];
    try { tl = window.hqStore.generateAutoTimeline(sch) || []; } catch (e) { tl = []; }
    if (!tl.length) { box.hidden = true; return; }
    const sel = $('form-manager');
    const mgr = sel && sel.selectedIndex >= 0 ? String(sel.options[sel.selectedIndex]?.text || '').replace(/\s*\(.*$/, '') : '';
    const clean = (l) => String(l || '').replace(/^\[[^\]]+\]\s*/, '');
    const KIND = (l) => /^\[기상/.test(l) ? '기상' : /^\[픽업/.test(l) ? '픽업' : /^\[헤어|샵/.test(l) ? '샵' : /^\[현장 이동/.test(l) ? '이동' : /^\[메인/.test(l) ? '현장' : /^\[현장 철수/.test(l) ? '종료' : '';
    box.innerHTML = `<h4>자동으로 계산한 매니저 동선</h4><ol>${tl.map(x => `<li><b>${esc(x.time || '')}</b><i class="k-${esc(KIND(x.label || ''))}"></i><span>${esc(clean(x.label))}</span></li>`).join('')}</ol>
      <p>${mgr && !/미지정|선택/.test(mgr) ? `저장하면 ${esc(mgr)} 앱 타임라인에 들어가요` : '담당 매니저를 고르면 그 매니저 앱 타임라인에 들어가요'} · 지금은 시간대 기준 추정이고, 저장할 때 실제 교통으로 다시 계산해요</p>`;
    box.hidden = false;
  };
  const later = () => { clearTimeout(t); t = setTimeout(draw, 150); };
  const start = () => {
    const form = $('form-schedule');
    if (!form) return;
    form.addEventListener('input', later);
    form.addEventListener('change', later);
    const modal = $('modal-schedule-form');
    if (modal) new MutationObserver(() => { if (modal.classList.contains('active')) setTimeout(draw, 200); }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    // 시간 바퀴로 고르면 숨은 칸 값만 바뀌므로 주기적으로도 확인
    setInterval(() => { if (modal && modal.classList.contains('active')) { const k = ($('form-start-time')?.value || '') + ($('form-end-time')?.value || ''); if (k !== start._k) { start._k = k; draw(); } } }, 700);
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
