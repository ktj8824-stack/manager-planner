/* =========================================
   RoadPlanner — 위치 정보 동의 · 이용/제공 기록 (위치정보법 준비)
   - 동의 전에는 위치를 한 번도 읽지 않음 (getCurrentPosition 은 Loc.get 만 씀)
   - 동의/철회는 언제든: 내 정보 → 위치 정보
   - 위치를 쓰거나 본사에 제공할 때마다 서버에 확인자료를 남기고(1년 보관), 제공했을 때는 바로 화면에 알림
   ========================================= */
const Loc = {
  TERMS_VERSION: '2026-11-09',
  KEY: 'rp_loc_consent',          // 'yes' | 'no' (이 기기 캐시. 기준은 서버 location_consents)

  _sc() { const sc = window.SupabaseClient; return sc && sc.isConfigured && sc.currentUser ? sc : null; },
  state() { try { const v = localStorage.getItem(this.KEY); return v === 'yes' || v === 'no' ? v : null; } catch (e) { return null; } },
  ok() { return this.state() === 'yes'; },

  // 로그인 후: 서버에 저장된 동의 상태 가져오기 (다른 기기에서 바꾼 경우 포함)
  async sync() {
    const sc = this._sc(); if (!sc) return this.state();
    try {
      const { data } = await sc.client.from('location_consents').select('agreed, terms_version').eq('user_id', sc.currentUser.id).maybeSingle();
      if (data) {
        const v = data.agreed && data.terms_version === this.TERMS_VERSION ? 'yes' : (data.agreed ? null : 'no');
        try { v ? localStorage.setItem(this.KEY, v) : localStorage.removeItem(this.KEY); } catch (e) { }
      } else {
        try { localStorage.removeItem(this.KEY); } catch (e) { }
      }
    } catch (e) { }
    return this.state();
  },

  async _save(agreed) {
    try { localStorage.setItem(this.KEY, agreed ? 'yes' : 'no'); } catch (e) { }
    const sc = this._sc(); if (!sc) return;
    try {
      await sc.client.from('location_consents').upsert({ user_id: sc.currentUser.id, agreed, terms_version: this.TERMS_VERSION });
      await this.log(agreed ? 'consent' : 'withdraw', null, agreed ? '위치 정보 이용 동의' : '위치 정보 이용 동의 철회');
    } catch (e) { }
  },

  // 확인자료 남기기 (위치정보법 제16조) — 실패해도 기능은 막지 않음
  async log(kind, recipient, purpose) {
    const sc = this._sc(); if (!sc) return;
    try { await sc.client.from('location_logs').insert({ user_id: sc.currentUser.id, kind, recipient: recipient || null, purpose: purpose || null }); } catch (e) { }
  },

  // 본사 등 제3자에게 제공했을 때: 기록 + 바로 알림 (위치정보법 제19조 즉시 통보)
  provided(kind, purpose) {
    const to = this.recipient();
    this.log(kind, to, purpose);
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setTimeout(() => { try { U.toast(`📍 ${hm} ${esc(to)}에 위치 정보를 제공했어요 (${purpose}). 내 정보 → 위치 정보에서 볼 수 있어요.`); } catch (e) { } }, 2600);
  },

  recipient() {
    const co = window.SupabaseClient?.currentProfile?.company_name || localStorage.getItem('bp_company_name') || '';
    return (co ? co + ' ' : '소속 회사 ') + '본사';
  },

  // 동의 화면 → true/false
  ask(reason) {
    return new Promise(resolve => {
      const indie = typeof Plan !== 'undefined' && Plan.isIndie && Plan.isIndie();
      const done = (v) => { App.closeModal(); this._save(v); resolve(v); if (window.Profile && State.screen === 'profile') Profile.render(); };
      this._resolve = done;
      App.showModal('위치 정보 이용 동의', `
        <div class="loc-c">
          ${reason ? `<p class="loc-why">${esc(reason)}</p>` : ''}
          <dl class="loc-dl">
            <div><dt>쓰는 때</dt><dd>${indie ? '긴급 상황에서 위치 첨부를 할 때만' : '[출발]을 누른 뒤 이동 중(앱이 켜져 있을 때 약 2분마다) · 긴급 지원 화면을 열었을 때'}</dd></div>
            <div><dt>쓰는 곳</dt><dd>${indie ? '긴급 위치 첨부' : '도착 예상 시각·지연 계산, 긴급보고 위치 첨부'}</dd></div>
            ${indie ? '' : `<div><dt>본사에 가는 것</dt><dd>[본사에 지연 알리기]를 누르면 도착 예상 시각만, 긴급보고를 보내면 그 순간 위치 1곳. 그 밖에는 본사가 내 위치를 볼 수 없어요.</dd></div>`}
            <div><dt>보관</dt><dd>지연 계산용 좌표는 저장하지 않아요. 긴급보고 위치는 보고 글에 담겨 회사 이용 기간 동안 보관돼요. 이용·제공 기록은 1년 뒤 지워져요.</dd></div>
            <div><dt>거부해도</dt><dd>괜찮아요. 일정·알림·[출발]·[도착] 버튼은 그대로 쓸 수 있고, 위치 대신 주소를 직접 적으면 돼요. 동의는 내 정보 → 위치 정보에서 언제든 철회할 수 있어요.</dd></div>
          </dl>
          <a class="loc-link" href="location-terms.html" target="_blank" rel="noopener">위치기반서비스 이용약관 전체 보기</a>
          <div class="loc-btns">
            <button type="button" class="loc-no" onclick="Loc._resolve && Loc._resolve(false)">동의 안 함</button>
            <button type="button" class="loc-yes" onclick="Loc._resolve && Loc._resolve(true)">동의하고 쓰기</button>
          </div>
        </div>`);
      // 바깥을 눌러 닫으면 '결정 안 함' (다음에 다시 물음)
      const bg = U.$('#app-modal');
      bg && bg.addEventListener('click', e => { if (e.target === bg) { this._resolve = null; resolve(false); } });
    });
  },

  // 동의했으면 위치 1번 읽기 (동의 안 했으면 null) — 앱에서 위치를 읽는 유일한 통로
  get(opts) {
    if (!this.ok() || !navigator.geolocation) return Promise.resolve(null);
    return new Promise(res => navigator.geolocation.getCurrentPosition(p => res(p), () => res(null),
      Object.assign({ enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }, opts || {})));
  },

  // 회사 매니저: 로그인 뒤 한 번 물어보기 (결정 안 했을 때만)
  async maybeAsk() {
    if (this._asked) return;
    if (!this._sc() || (typeof Plan !== 'undefined' && Plan.isIndie && Plan.isIndie())) return;
    if (['ceo', 'hq_admin'].includes(localStorage.getItem('bp_user_role'))) return;
    this._asked = true;   // 로그인·역할 확인 뒤에 표시 (로그아웃 뒤 다시 로그인하면 다시 확인)
    const s = await this.sync();
    if (s) return;
    setTimeout(() => { if (!U.$('#app-modal')) this.ask('이동 중 도착 예상 시각을 계산하고 늦을 것 같으면 먼저 알려 드리려면 위치가 필요해요.'); }, 2500);
  },

  // 내 정보 → 위치 정보
  async openSettings() {
    const s = this.state();
    App.showModal('위치 정보', `
      <div class="loc-c">
        <div class="loc-st ${s === 'yes' ? 'on' : ''}"><b>${s === 'yes' ? '동의함' : s === 'no' ? '동의 안 함' : '아직 정하지 않음'}</b>
          <span>${s === 'yes' ? '이동 중 지연 계산과 긴급 위치 첨부에 쓰고 있어요' : '위치를 읽지 않아요. 주소는 직접 적으면 돼요'}</span></div>
        <div class="loc-btns">
          ${s === 'yes' ? `<button type="button" class="loc-no" onclick="Loc._withdraw()">동의 철회</button>` : `<button type="button" class="loc-yes" onclick="App.closeModal(); setTimeout(() => Loc.ask(), 320)">동의하기</button>`}
        </div>
        <h4 class="loc-h">최근 위치 이용 · 제공 내역</h4>
        <ul class="loc-log" id="loc-log"><li class="loc-empty">불러오는 중...</li></ul>
        <a class="loc-link" href="location-terms.html" target="_blank" rel="noopener">위치기반서비스 이용약관</a>
        <a class="loc-link" href="privacy.html#location" target="_blank" rel="noopener">개인정보처리방침 · 위치 항목</a>
      </div>`);
    const box = U.$('#loc-log');
    const sc = this._sc();
    if (!sc) { if (box) box.innerHTML = '<li class="loc-empty">로그인하면 볼 수 있어요</li>'; return; }
    try {
      const { data } = await sc.client.from('location_logs').select('kind, recipient, purpose, created_at').eq('user_id', sc.currentUser.id).order('created_at', { ascending: false }).limit(30);
      const L = { consent: '동의', withdraw: '철회', eta: '지연 계산에 이용', delay_report: '본사에 제공', sos: '본사에 제공' };
      const f = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
      if (box) box.innerHTML = (data || []).length ? data.map(r => `<li><span class="loc-t">${f(r.created_at)}</span><span><b>${esc(L[r.kind] || r.kind)}</b>${r.recipient ? ` · ${esc(r.recipient)}` : ''}${r.purpose ? `<small>${esc(r.purpose)}</small>` : ''}</span></li>`).join('') : '<li class="loc-empty">아직 내역이 없어요</li>';
    } catch (e) { if (box) box.innerHTML = '<li class="loc-empty">불러오지 못했어요</li>'; }
  },

  async _withdraw() {
    await this._save(false);
    App.closeModal();
    U.toast('위치 정보 이용 동의를 철회했어요. 이제 위치를 읽지 않아요.');
    if (window.Profile && State.screen === 'profile') Profile.render();
  },
};
window.Loc = Loc;
