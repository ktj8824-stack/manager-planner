/* =========================================
   본사 웹 · 시안 반영 — 오른쪽 패널 안쪽 화면
   아티스트 관리 · 차량·배차 관리 · 경비 정산(승인·반려) · 매니저 · 머리말
   admin.js / hq-expenses.js 뒤에 읽어서 목록 그리는 부분만 바꿔 끼움 (데이터·저장 방식은 그대로)
   ========================================= */
(function () {
  const $ = (id) => document.getElementById(id);
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const J = (v) => E(JSON.stringify(String(v ?? '')));
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const short = (n) => String(n || '').replace(/\s*\([^)]*\)\s*$/, '');
  const CLOSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  // 패널 머리말: 큰 제목 + 한 줄 설명 + 오른쪽 × (기존 닫기 방식 그대로)
  function head(modalId, title, sub, closeAttr) {
    const m = $(modalId); if (!m) return;
    const h = m.querySelector('.modal-header'); if (!h) return;
    const closeBtn = closeAttr || `data-close="${modalId}"`;
    h.classList.add('p2-head');
    h.innerHTML = `<div class="p2-title"><h3>${E(title)}</h3><small>${E(sub || '')}</small></div><button type="button" class="p2-x" ${closeBtn} aria-label="닫기">${CLOSE}</button>`;
  }
  // data-close 버튼이 동적으로 생겨도 닫히게
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.p2-x[data-close]');
    if (b) { const m = $(b.dataset.close); if (m) m.classList.remove('active'); }
  });

  const A = window.Admin;
  if (!A) return;

  /* ── 1. 소속 아티스트 관리 ── */
  let artistQuery = '';
  A.renderArtistManagementList = async function () {
    const box = $('artist-management-list'); if (!box) return;
    const artists = await window.hqStore.getArtists();
    const schedules = await window.hqStore.getSchedules();
    const managers = await window.hqStore.getManagers();
    const vehicles = await window.hqStore.getVehicles();
    const month = ymd(new Date()).slice(0, 7);
    head('modal-artist-management', '소속 아티스트 관리', `${artists.length}팀 · 담당 매니저, 케어 메모, 전담 차량을 관리해요`);
    // 맨 위 안내 상자 → 검색 + 신규 버튼
    const intro = box.previousElementSibling;
    if (intro && !intro.classList.contains('p2-tools')) {
      intro.outerHTML = `<div class="p2-tools"><input type="search" id="p2-artist-q" class="p2-search" placeholder="아티스트 이름 검색" aria-label="아티스트 이름 검색"><button type="button" class="p2-primary" onclick="Admin.openArtistFormModal()">+ 신규 아티스트</button></div>`;
      $('p2-artist-q')?.addEventListener('input', (e) => { artistQuery = e.target.value.trim(); A.renderArtistManagementList(); });
    }
    const q = artistQuery.toLowerCase();
    const list = artists.filter(a => !q || String(a.name || '').toLowerCase().includes(q));
    if (!artists.length) { box.innerHTML = '<div class="p2-empty"><b>등록된 아티스트가 없어요</b><span>위 [+ 신규 아티스트]로 추가해 주세요.</span></div>'; return; }
    if (!list.length) { box.innerHTML = '<div class="p2-empty">검색 결과가 없어요.</div>'; return; }
    box.innerHTML = list.map(art => {
      const nMonth = schedules.filter(s => s.artistId === art.id && String(s.date || '').startsWith(month)).length;
      const mgrs = managers.filter(m => (m.assignedArtists || []).includes(art.id));
      const field = mgrs.filter(m => !['ceo', 'hq_admin'].includes(m.role));
      const who = (field.length ? field : mgrs).slice(0, 2).map(m => m.name).join(', ');
      const raw = art.care || art.careInfo || art.care_info;
      let care = '';
      if (typeof raw === 'string') care = raw;
      else if (raw && typeof raw === 'object') care = [raw.allergies, raw.beverages, raw.vehicle_pref, raw.emergency, raw.notes].filter(Boolean).join(' · ');
      const veh = vehicles.find(v => v.defaultArtist && (v.defaultArtist === art.name || short(v.defaultArtist) === short(art.name)));
      const active = (art.status || '활동중') === '활동중';
      const line3 = [care ? `케어 메모: ${care}` : '', veh ? veh.name : ''].filter(Boolean).join(' · ');
      return `<button type="button" class="p2-row" onclick="Admin.openArtistFormModal(${J(art.id)})">
        <span class="p2-av" style="background:${E(art.color || '#6366f1')}">${E(short(art.name).slice(0, 1))}</span>
        <span class="p2-main">
          <span class="l1"><b>${E(short(art.name))}</b><small>${E(art.type || '')} · ${E(art.members || 1)}명</small><em class="${active ? 'ok' : ''}">${E(active ? '활동 중' : (art.status || '휴식'))}</em></span>
          <span class="l2">${who ? '담당 ' + E(who) : '담당 매니저 없음'} · 이번 달 스케줄 ${nMonth}건</span>
          ${line3 ? `<span class="l3">${E(line3)}</span>` : ''}
        </span><span class="p2-chev" aria-hidden="true">›</span></button>`;
    }).join('') + '<p class="p2-foot">줄을 누르면 편집 화면이 열려요 · 삭제는 편집 화면 맨 아래에 있어요</p>';
  };

  // 아티스트 편집 화면 맨 아래 삭제
  const _openArtistForm = A.openArtistFormModal;
  A.openArtistFormModal = async function (id = null) {
    await _openArtistForm.call(this, id);
    const form = $('form-artist-add'); if (!form) return;
    form.querySelector('.p2-del')?.remove();
    if (id) {
      const art = (await window.hqStore.getArtists()).find(a => a.id === id);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'p2-del'; b.textContent = '이 아티스트 삭제';
      b.onclick = async () => { await A.deleteArtist(id, art ? art.name : ''); if (!(await window.hqStore.getArtists()).some(a => a.id === id)) $('modal-artist-form')?.classList.remove('active'); };
      form.appendChild(b);
    }
  };

  /* ── 2. 차량 · 배차 관리 ── */
  A.renderVehicleManagementList = async function () {
    const box = $('vehicle-management-list'); if (!box) return;
    const vehicles = await window.hqStore.getVehicles();
    const today = ymd(new Date());
    const schedules = (await window.hqStore.getSchedules()).filter(s => s.date === today);
    const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
    const toMin = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? (+m[1]) * 60 + (+m[2]) : null; };
    const clean = (l) => String(l || '').replace(/^\[[^\]]+\]\s*/, '');
    const thr = parseInt(localStorage.getItem('hq_late_minutes') || '10', 10) || 10;
    const rows = vehicles.map(v => {
      const mine = schedules.filter(s => s.vehicleId === v.id || (s.vehicleName && s.vehicleName === v.name)).sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
      let st = 'idle', label = v.status === '정비중' ? '정비 중' : '대기', today = '';
      const live = mine.find(s => { const tl = s.timeline || []; return tl.some(t => t.done || t.moving) && !tl.every(t => t.done); });
      if (v.status === '정비중') st = 'fix';
      else if (live) {
        st = 'run'; label = '운행 중';
        const tl = live.timeline || []; const mv = tl.find(t => t.moving && !t.done); const ld = [...tl].reverse().find(t => t.done);
        today = mv ? `${clean(mv.label)} 이동` : ld ? `${clean(ld.label)}` : clean(live.title);
      } else if (mine.length) {
        const s = mine.find(x => !(x.timeline || []).every(t => t.done)) || mine[0];
        const first = (s.timeline || []).find(t => !t.done && !/^\[기상/.test(t.label || ''));
        const fm = first ? toMin(first.time) : null;
        if (first && fm !== null && nowMin - fm >= thr) { st = 'late'; label = '미출발'; today = `${clean(first.label).slice(0, 12)} · ${first.time} 출발 예정`; }
        else if ((s.timeline || []).every(t => t.done) && (s.timeline || []).length) { label = '오늘 운행 끝'; today = clean(s.title); }
        else { label = '배차됨'; st = 'set'; today = `${first ? first.time : s.startTime || ''} 배차 · ${clean(s.title)}`; }
      } else today = v.defaultArtist ? '오늘 배차 없음' : '공용 · 오늘 배차 없음';
      return { v, st, label, today, mgr: (live || mine[0] || {}).managerName || v.driver || '' };
    });
    const cnt = (k) => rows.filter(r => r.st === k).length;
    head('modal-vehicle-management', '차량 · 배차 관리', `${vehicles.length}대 · 오늘 배차 현황`);
    const intro = box.previousElementSibling;
    if (intro && !intro.classList.contains('p2-sum')) intro.style.display = 'none';
    box.innerHTML = `
      <div class="p2-sum"><div><span>운행 중</span><b>${cnt('run')}</b></div><div class="${cnt('late') ? 'bad' : ''}"><span>미출발</span><b>${cnt('late')}</b></div><div><span>대기 · 배차됨</span><b>${cnt('idle') + cnt('set')}</b></div></div>
      ${rows.length ? rows.map(r => `<button type="button" class="p2-row" onclick="Admin.openVehicleFormModal(${J(r.v.id)})">
        <span class="p2-ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14v-5l-2-5H7l-2 5z"/><path d="M3 12h18"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg></span>
        <span class="p2-main"><span class="l1"><b>${E(r.v.name)}</b><small>${E(r.v.number || '번호 미등록')}</small><em class="v-${r.st}">${E(r.label)}</em></span>
          <span class="l2">${r.v.defaultArtist ? '전담 ' + E(short(r.v.defaultArtist)) : '공용 차량'}${r.mgr ? ' · 담당 ' + E(r.mgr) : ''}</span>
          <span class="l3 strong">오늘: ${E(r.today)}</span></span><span class="p2-chev" aria-hidden="true">›</span></button>`).join('')
        : '<div class="p2-empty"><b>등록된 차량이 없어요</b><span>아래 [+ 신규 차량 등록]으로 추가해 주세요.</span></div>'}
      <div class="p2-bottom"><button type="button" class="p2-primary" onclick="Admin.openVehicleFormModal()">+ 신규 차량 등록</button></div>`;
  };
  const _openVehForm = A.openVehicleFormModal;
  A.openVehicleFormModal = async function (id = null) {
    await _openVehForm.call(this, id);
    const form = $('form-vehicle-add'); if (!form) return;
    form.querySelector('.p2-del')?.remove();
    if (id && typeof A.deleteVehicle === 'function') {
      const v = (await window.hqStore.getVehicles()).find(x => x.id === id);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'p2-del'; b.textContent = '이 차량 삭제';
      b.onclick = async () => { await A.deleteVehicle(id, v ? v.name : ''); if (!(await window.hqStore.getVehicles()).some(x => x.id === id)) $('modal-vehicle-form')?.classList.remove('active'); };
      form.appendChild(b);
    }
  };

  /* ── 3. 매니저 계정 · 담당 아티스트 배정: 머리말 (슬롯 정보는 설명 줄로) ── */
  const _renderMgr = A.renderManagerManagementList;
  if (_renderMgr) A.renderManagerManagementList = async function () {
    await _renderMgr.call(this);
    try {
      const n = (await window.hqStore.getManagers()).length;
      let slot = '';
      try { const sub = window.hqStore.getSubscription(); slot = `슬롯 ${sub.activeManagerCount} / ${sub.totalSlots}석 (${sub.availableSlots}석 남음)`; } catch (e) { }
      head('modal-manager-management', '매니저 계정 · 담당 아티스트 배정', `${n}명${slot ? ' · ' + slot : ''}`);
    } catch (e) { }
  };

  /* ── 4. 매니저 경비 정산: 승인 대기 → 승인 / 반려, 매니저별 합계 ── */
  const H = window.HqExpenses;
  if (H) {
    const ST = { pending: '승인 대기', approved: '승인', rejected: '반려' };
    H.CATS = Object.assign({}, H.CATS, { repair: '정비·세차' });
    H.draw = function () {
      const body = $('hq-exp-body'); if (!body) return;
      const [y, m] = this.month.split('-').map(Number);
      const thisM = ymd(new Date()).slice(0, 7);
      const prev = (() => { const t = new Date(); t.setDate(1); t.setMonth(t.getMonth() - 1); return ymd(t).slice(0, 7); })();
      const all = this.items;
      const total = all.reduce((s, x) => s + Number(x.amount || 0), 0);
      const pend = all.filter(x => (x.status || 'pending') === 'pending');
      const byMgr = {}; all.forEach(x => { byMgr[x.user_id] = (byMgr[x.user_id] || 0) + Number(x.amount || 0); });
      const schedules = window.hqStore?.getSchedules?.() || [];
      const art = (x) => { const s = x.schedule_id && schedules.find(z => z.id === x.schedule_id); return s ? short(s.artistName || '') : ''; };
      const row = (x, actions) => `
        <div class="ex2-row ${E(x.status || 'pending')}">
          ${x.receipt_path ? `<button type="button" class="ex2-rc" onclick="HqExpenses.receipt(${J(x.receipt_path)})">영수증<br>보기</button>` : '<span class="ex2-rc none">영수증<br>없음</span>'}
          <span class="ex2-main"><b>${E(this.CATS[x.category] || x.category)} · ${this.won(x.amount)}</b>
            <small>${E(x.date.slice(5).replace('-', '/').replace(/^0/, ''))} · ${E(this.name(x.user_id))}${art(x) ? ' · ' + E(art(x)) : ''}${x.memo ? ' · ' + E(x.memo) : ''}</small>
            ${x.status === 'rejected' && x.review_note ? `<small class="bad">반려 사유: ${E(x.review_note)}</small>` : ''}</span>
          ${actions ? `<span class="ex2-act"><button type="button" class="ex2-no" onclick="HqExpenses.review(${J(x.id)}, 'rejected')">반려</button><button type="button" class="ex2-ok" onclick="HqExpenses.review(${J(x.id)}, 'approved')">승인</button></span>`
                    : `<span class="ex2-st ${E(x.status)}">${E(ST[x.status] || '')}</span>`}
        </div>`;
      body.innerHTML = `
        <div class="ex2-top">
          <div class="ex2-tabs" role="tablist">
            <button type="button" role="tab" aria-selected="${this.month === thisM}" class="${this.month === thisM ? 'on' : ''}" onclick="HqExpenses.month='${thisM}'; HqExpenses.load()">${+thisM.slice(5)}월</button>
            <button type="button" role="tab" aria-selected="${this.month === prev}" class="${this.month === prev ? 'on' : ''}" onclick="HqExpenses.month='${prev}'; HqExpenses.load()">${+prev.slice(5)}월</button>
            ${this.month !== thisM && this.month !== prev ? `<button type="button" class="on">${y}년 ${m}월</button>` : ''}
            <button type="button" aria-label="이전 달" onclick="HqExpenses.shift(-1)">‹</button>
          </div>
          <button type="button" class="ex2-xls" onclick="HqExpenses.csv()" ${all.length ? '' : 'disabled'}>엑셀로 내려받기</button>
        </div>
        <div class="ex2-kpi"><div><span>${m}월 합계 · ${all.length}건</span><b>${this.won(total)}</b></div><div class="${pend.length ? 'warn' : ''}"><span>승인 대기</span><b>${pend.length}건</b></div></div>
        ${pend.length ? `<h4>승인 대기</h4>${pend.map(x => row(x, true)).join('')}` : ''}
        ${Object.keys(byMgr).length ? `<h4>매니저별 ${m}월 합계</h4><div class="ex2-mgr">${Object.entries(byMgr).sort((a, b) => b[1] - a[1]).map(([id, v]) => `<div><span>${E(this.name(id))}</span><b>${this.won(v)}</b></div>`).join('')}</div>` : ''}
        ${all.length - pend.length ? `<h4>처리한 경비</h4>${all.filter(x => (x.status || 'pending') !== 'pending').map(x => row(x, false)).join('')}` : ''}
        ${!all.length ? '<div class="p2-empty">이 달에는 기록된 경비가 없어요.<br>매니저가 앱 \'경비 기록\'에 올린 영수증이 여기로 모여요.</div>' : ''}
        <p class="p2-foot">매니저가 앱 '경비 기록'에 올린 영수증이 여기로 모여요 · 매니저가 고치면 다시 승인 대기로 와요</p>`;
      head('modal-hq-expenses', '매니저 경비 정산', '영수증 확인 · 승인 · 월별 합계', 'onclick="HqExpenses.close()"');
    };
    H.review = async function (id, status) {
      let note = null;
      if (status === 'rejected') { note = prompt('반려 사유를 적어 주세요 (매니저에게 보여요)', ''); if (note === null) return; }
      try {
        const { error } = await window.SupabaseClient.client.rpc('expense_review', { p_id: id, p_status: status, p_note: note });
        if (error) throw error;
        const it = this.items.find(x => x.id === id); if (it) { it.status = status; it.review_note = note; }
        this.draw();
      } catch (e) { alert('처리하지 못했어요. 대표·관리자 계정인지, 인터넷 연결을 확인해 주세요.'); }
    };
    const _csv = H.csv;
    H.csv = function () { return _csv.call(this); };
  }

  // 아티스트 관리 머리말은 열 때마다
  const _openArtists = A.openArtistModal;
  if (_openArtists) A.openArtistModal = async function () { artistQuery = ''; const q = $('p2-artist-q'); if (q) q.value = ''; return _openArtists.call(this); };
})();

/* 신규 스케줄: 아티스트를 색 칩으로 고르기 (원래 선택 칸과 자동으로 맞춤) */
(function () {
  const $ = (id) => document.getElementById(id);
  const E = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const draw = () => {
    const sel = $('form-artist'); if (!sel) return;
    let box = $('form-artist-chips');
    const group = sel.closest('.form-group');
    if (!box) {
      box = document.createElement('div');
      box.id = 'form-artist-chips'; box.className = 'sch-chips'; box.setAttribute('role', 'radiogroup'); box.setAttribute('aria-label', '아티스트');
      const lab = document.createElement('div'); lab.className = 'form-label'; lab.innerHTML = '아티스트 <span style="color:#ef4444;">*</span>';
      const wrap = document.createElement('div'); wrap.className = 'form-group sch-chip-group'; wrap.append(lab, box);
      const row = group && group.parentElement;
      if (row) { row.parentElement.insertBefore(wrap, row); group.style.display = 'none'; row.style.gridTemplateColumns = '1fr'; }
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-v]'); if (!b) return;
        sel.value = b.dataset.v; sel.dispatchEvent(new Event('change', { bubbles: true })); draw();
      });
    }
    let arts = []; try { arts = window.hqStore.getArtists() || []; } catch (e) { }
    box.innerHTML = [...sel.options].filter(o => o.value).map(o => {
      const a = arts.find(x => x.id === o.value);
      const on = sel.value === o.value;
      const color = a ? (a.color || '#4f46e5') : '#52525b';
      const label = a ? String(a.name || '').replace(/\s*\([^)]*\)\s*$/, '') : (o.value === 'ALL' ? '전원' : o.textContent);
      return `<button type="button" role="radio" aria-checked="${on}" data-v="${E(o.value)}" class="${on ? 'on' : ''} ${o.value === 'ALL' ? 'all' : ''}" style="--c:${E(color)}">${E(label)}</button>`;
    }).join('');
  };
  const start = () => {
    const modal = $('modal-schedule-form'); const sel = $('form-artist');
    if (!modal || !sel) return;
    new MutationObserver(() => { if (modal.classList.contains('active')) setTimeout(draw, 120); }).observe(modal, { attributes: true, attributeFilter: ['class'] });
    sel.addEventListener('change', draw);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* 관리자 설정 머리말 (창 마크업이 스크립트보다 뒤에 있어서 다 읽은 뒤에) */
document.addEventListener('DOMContentLoaded', function () {
  const m = document.getElementById('modal-admin-settings'); if (!m) return;
  const h = m.querySelector('.modal-header'); if (!h) return;
  h.classList.add('p2-head');
  h.innerHTML = '<div class="p2-title"><h3>관리자 설정</h3><small>회사 정보 · 동선 계산 · 지연 판단 기준 · 알림 · 권한</small></div><button type="button" class="p2-x" onclick="Admin.closeAdminSettingsModal()" aria-label="닫기"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
});
