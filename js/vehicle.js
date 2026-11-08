/* =========================================
   RoadPlanner — 내 차량 (개인 매니저)
   - 차량 정보(무료): 차종·번호·연료·보험사·긴급출동 번호 → 이 기기 + 내 계정에 저장
   - 차량 비용(유료, 경비 기록과 같은 데이터): 이번 달 주유·주차·통행료·정비 합계와 최근 기록, 바로 추가
   ========================================= */
const Vehicle = {
  FUELS: ['휘발유', '경유', 'LPG', '전기', '하이브리드'],
  CAR_CATS: ['fuel', 'parking', 'toll', 'repair'],
  KEY: 'rp_vehicle',
  items: [],

  get() {
    try { const v = JSON.parse(localStorage.getItem(this.KEY) || 'null'); if (v && typeof v === 'object') return v; } catch (e) { }
    const old = localStorage.getItem('bp_user_vehicle');   // 예전 한 줄 입력값
    return old ? { model: old } : {};
  },
  title() { const v = this.get(); return [v.model, v.plate].filter(Boolean).join(' · '); },

  open() { App.navigate('vehicle'); },

  // 다른 기기에서 저장한 차량 정보 가져오기 (내 계정 메타데이터)
  _pull() {
    try {
      const m = window.SupabaseClient?.currentUser?.user_metadata?.vehicle;
      if (m && typeof m === 'object' && !localStorage.getItem(this.KEY)) {
        localStorage.setItem(this.KEY, JSON.stringify(m));
        if (m.model || m.plate) localStorage.setItem('bp_user_vehicle', [m.model, m.plate].filter(Boolean).join(' '));
      }
    } catch (e) { }
  },

  async render() {
    const el = U.$('#screen-vehicle');
    if (!el) return;
    this._pull();
    const v = this.get();
    const has = !!(v.model || v.plate);
    const tel = String(v.insTel || '').replace(/[^0-9+]/g, '');
    const can = typeof Plan === 'undefined' || Plan.can('expenses');
    el.innerHTML = `
      <div class="header">
        <button class="header-btn" onclick="App.navigate('profile')" aria-label="뒤로"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
        <h1 class="header-title">내 차량</h1>
        <div class="header-btn" style="visibility:hidden"></div>
      </div>
      <div class="screen-scroll" style="padding:12px 16px 28px;">
        <section class="veh-card">
          ${has ? `
            <div class="veh-top"><span class="veh-ico">🚗</span><span class="veh-name"><b>${esc(v.model || '차종 미입력')}</b><span class="veh-plate">${esc(v.plate || '번호 미입력')}</span></span>
              <button type="button" class="art-btn" onclick="Vehicle.openForm()">수정</button></div>
            <dl class="veh-info">
              <div><dt>연료</dt><dd>${esc(v.fuel || '-')}</dd></div>
              <div><dt>보험사</dt><dd>${esc(v.insurer || '-')}</dd></div>
            </dl>
            ${tel.length >= 4 ? `<a class="veh-call" href="tel:${esc(tel)}">📞 ${esc(v.insurer || '보험사')} 긴급출동 전화 <small>${esc(v.insTel)}</small></a>` : `<button type="button" class="veh-call none" onclick="Vehicle.openForm()">긴급출동 번호를 넣어 두면 사고·고장 때 바로 걸 수 있어요</button>`}`
          : `
            <div class="veh-empty"><span class="veh-ico">🚗</span><b>아직 등록한 차량이 없어요</b><span>차종·번호·보험사 긴급출동 번호를 넣어 두세요.</span>
              <button type="button" class="btn-primary" style="width:auto; padding:10px 18px; font-weight:800;" onclick="Vehicle.openForm()">차량 등록</button></div>`}
        </section>

        <section class="veh-cost">
          <div class="veh-cost-h"><h2>이번 달 차량 비용</h2>${can ? '<button type="button" class="exp-link" onclick="Expenses.open()">경비 전체 보기 ›</button>' : ''}</div>
          ${can ? `
            <div class="veh-quick">${this.CAR_CATS.map(id => { const c = Expenses.cat(id); return `<button type="button" onclick="Vehicle.add(${escJs(id)})"><span>${c.icon}</span>${esc(c.label)}</button>`; }).join('')}</div>
            <div id="veh-cost-body"><div class="exp-empty">불러오는 중...</div></div>`
          : `
            <div class="art-add locked" style="display:flex;">
              <span class="art-lock-t">🔒 주유·정비 비용 기록</span>
              <span class="art-lock-s">영수증 사진과 함께 남기고, 달마다 차량 비용을 모아 볼 수 있어요</span>
              <button type="button" onclick="App.navigate('upgrade')">유료 혜택 보기</button>
            </div>`}
        </section>
      </div>`;
    if (can) this.load();
  },

  async load() {
    const box = U.$('#veh-cost-body');
    const month = Expenses.ymd(new Date()).slice(0, 7);
    Expenses.month = month;
    try {
      const [from, to] = Expenses.range();
      Expenses.items = Expenses.online() ? await SupabaseClient.expensesList(from, to)
        : Expenses._local().filter(x => x.date >= from && x.date <= to).sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      if (box) box.innerHTML = `<div class="exp-empty">${navigator.onLine === false ? '인터넷 연결을 확인해 주세요.' : '비용을 불러오지 못했어요.'}</div>`;
      return;
    }
    const me = window.SupabaseClient?.currentUser?.id;
    this.items = Expenses.items.filter(x => this.CAR_CATS.includes(x.category) && (!me || !x.user_id || x.user_id === me));
    if (!box || !box.isConnected) return;
    const total = this.items.reduce((s, x) => s + Number(x.amount || 0), 0);
    const by = this.CAR_CATS.map(id => ({ c: Expenses.cat(id), sum: this.items.filter(x => x.category === id).reduce((s, x) => s + Number(x.amount || 0), 0) })).filter(x => x.sum > 0);
    box.innerHTML = `
      <div class="exp-total">
        <div class="exp-total-label">${+month.slice(5)}월 차량 비용 · ${this.items.length}건</div>
        <div class="exp-total-amt">${Expenses.won(total)}</div>
        ${by.length ? `<div class="exp-cats">${by.map(x => `<span>${x.c.icon} ${esc(x.c.label)} ${Expenses.won(x.sum)}</span>`).join('')}</div>` : ''}
      </div>
      ${this.items.length ? `<div class="exp-list">${this.items.slice(0, 6).map(x => { const c = Expenses.cat(x.category); return `
        <button type="button" class="exp-item" onclick="Expenses.openForm(${escJs(x.id)})">
          <span class="exp-ico">${c.icon}</span>
          <span class="exp-info"><b>${esc(c.label)}${x.memo ? ' · ' + esc(x.memo) : ''}</b><small>${+x.date.slice(5, 7)}월 ${+x.date.slice(8, 10)}일</small></span>
          <span class="exp-amt">${Expenses.won(x.amount)}</span>
        </button>`; }).join('')}</div>`
        : '<div class="exp-empty">이번 달 차량 비용 기록이 없어요.<br>위 버튼으로 주유·주차 영수증을 바로 남겨 보세요.</div>'}`;
  },

  add(category) { Expenses.openForm(null, { category }); },

  openForm() {
    const v = this.get();
    App.showModal('내 차량', `
      <form id="veh-form" onsubmit="event.preventDefault(); if (event.submitter === null) return; Vehicle.save()" style="display:flex; flex-direction:column; gap:12px; text-align:left;">
        <label class="art-label">차종 <input id="veh-model" class="art-input" maxlength="40" placeholder="예: 카니발 하이리무진" value="${esc(v.model || '')}" /></label>
        <label class="art-label">차량 번호 <input id="veh-plate" class="art-input" maxlength="20" placeholder="예: 12가 3456" value="${esc(v.plate || '')}" /></label>
        <div class="art-label">연료
          <div class="exp-cat-pick">${this.FUELS.map(f => `<button type="button" data-c="${esc(f)}" class="${f === v.fuel ? 'on' : ''}" onclick="Expenses._pick(this)">${esc(f)}</button>`).join('')}</div></div>
        <label class="art-label">보험사 <input id="veh-ins" class="art-input" maxlength="30" placeholder="예: 삼성화재" value="${esc(v.insurer || '')}" /></label>
        <label class="art-label">긴급출동 번호 <input id="veh-tel" class="art-input" maxlength="20" inputmode="tel" placeholder="예: 1588-5114" value="${esc(v.insTel || '')}" /></label>
        <button type="submit" class="btn-primary" style="width:100%; padding:14px; font-weight:800;">저장</button>
      </form>`);
    const form = document.getElementById('veh-form');
    form?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing && e.target.tagName === 'INPUT') { e.preventDefault(); e.target.blur(); } });
  },

  async save() {
    const val = (id) => (U.$(id)?.value || '').trim();
    const v = { model: val('#veh-model'), plate: val('#veh-plate'), fuel: U.$('#veh-form .exp-cat-pick button.on')?.dataset.c || '', insurer: val('#veh-ins'), insTel: val('#veh-tel') };
    if (!v.model && !v.plate) { U.toast('차종이나 차량 번호를 넣어 주세요.'); return; }
    try {
      localStorage.setItem(this.KEY, JSON.stringify(v));
      localStorage.setItem('bp_user_vehicle', [v.model, v.plate].filter(Boolean).join(' '));
    } catch (e) { }
    App.closeModal();
    U.toast('차량 정보를 저장했어요');
    const sc = window.SupabaseClient;
    if (sc?.isConfigured && sc.currentUser) {
      sc.client.auth.updateUser({ data: { vehicle: v } }).catch(() => { });
    }
    this.render();
  },
};
window.Vehicle = Vehicle;
