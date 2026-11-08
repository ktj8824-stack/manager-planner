/* =========================================
   RoadPlanner — 경비 기록 (매니저 앱)
   주유·주차·통행료·식비 등을 영수증 사진과 함께 남기고, 월별 합계를 복사·엑셀(CSV)로 받는다.
   - 회사 매니저: 본사 웹 '경비 정산'에서 같은 회사 매니저 기록을 모아 봄
   - 개인 매니저: 유료 기능 (서버도 막음)
   - 로그인 전·둘러보기: 이 기기에만 저장
   ========================================= */

const Expenses = {
  CATS: [
    { id: 'fuel', label: '주유', icon: '⛽' },
    { id: 'parking', label: '주차', icon: '🅿️' },
    { id: 'toll', label: '통행료', icon: '🛣️' },
    { id: 'meal', label: '식비', icon: '🍚' },
    { id: 'transport', label: '교통', icon: '🚕' },
    { id: 'supplies', label: '소모품', icon: '🧴' },
    { id: 'repair', label: '정비·세차', icon: '🔧', indie: true },   // 개인 매니저 차량 관리용 (본사 웹에는 안 보이게 회사 매니저는 숨김)
    { id: 'etc', label: '기타', icon: '🧾' },
  ],
  cats() { const indie = typeof Plan !== 'undefined' && Plan.isIndie(); return this.CATS.filter(c => !c.indie || indie); },
  month: null,          // 'YYYY-MM'
  items: [],
  _receipt: null,       // 등록 창에서 고른 영수증 사진 (Blob)

  cat(id) { return this.CATS.find(c => c.id === id) || this.CATS.find(c => c.id === 'etc'); },
  won(n) { return (Number(n) || 0).toLocaleString() + '원'; },
  ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
  online() { const sc = window.SupabaseClient; return !!(sc?.isConfigured && sc.currentUser?.id); },
  _local() { try { return JSON.parse(localStorage.getItem('rp_expenses_local') || '[]') || []; } catch (e) { return []; } },
  _saveLocal(list) { try { localStorage.setItem('rp_expenses_local', JSON.stringify(list)); } catch (e) { } },

  range() {
    const [y, m] = this.month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return [`${this.month}-01`, `${this.month}-${String(last).padStart(2, '0')}`];
  },

  open() {
    if (typeof Plan !== 'undefined' && Plan.isIndie() && window.Vehicle) { App.navigate('vehicle'); return; }   // 개인 매니저: 차량관리 화면 안에서
    if (typeof Plan !== 'undefined' && !Plan.require('expenses')) return;
    App.navigate('expenses');
  },
  rerender() { if (State.screen === 'vehicle' && window.Vehicle) Vehicle.render(); else this.render(); },

  async render() {
    const el = U.$('#screen-expenses');
    if (!el) return;
    if (!this.month) this.month = this.ymd(new Date()).slice(0, 7);
    const [y, m] = this.month.split('-').map(Number);
    el.innerHTML = `
      <div class="header">
        <button class="header-btn" onclick="App.navigate('profile')" aria-label="뒤로"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
        <h1 class="header-title">경비 기록</h1>
        <div class="header-btn" style="visibility:hidden"></div>
      </div>
      <div class="screen-scroll" style="padding:12px 16px 28px;">
        <div class="exp-month">
          <button type="button" aria-label="이전 달" onclick="Expenses.shift(-1)">‹</button>
          <b>${y}년 ${m}월</b>
          <button type="button" aria-label="다음 달" onclick="Expenses.shift(1)">›</button>
        </div>
        <div id="exp-body"><div class="exp-empty">불러오는 중...</div></div>
      </div>`;
    await this.load();
  },

  shift(d) {
    const [y, m] = this.month.split('-').map(Number);
    const t = new Date(y, m - 1 + d, 1);
    this.month = this.ymd(t).slice(0, 7);
    this.rerender();
  },

  async load() {
    const [from, to] = this.range();
    try {
      this.items = this.online() ? await SupabaseClient.expensesList(from, to)
        : this._local().filter(x => x.date >= from && x.date <= to).sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) {
      const box = U.$('#exp-body');
      if (box) box.innerHTML = `<div class="exp-empty">${navigator.onLine === false ? '인터넷 연결을 확인해 주세요.' : '경비를 불러오지 못했어요. 잠시 후 다시 해 주세요.'}</div>`;
      return;
    }
    this.draw();
  },

  draw() {
    const box = U.$('#exp-body');
    if (!box) return;
    const me = window.SupabaseClient?.currentUser?.id;
    const mine = this.items.filter(x => !me || !x.user_id || x.user_id === me);
    const total = mine.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const byCat = this.CATS.map(c => ({ ...c, sum: mine.filter(x => x.category === c.id).reduce((s, x) => s + Number(x.amount || 0), 0) })).filter(c => c.sum > 0);
    const schedules = window.hqStore?.getSchedules?.() || [];
    const title = (id) => { const s = id && schedules.find(x => x.id === id); return s ? (s.isSecret ? '비공개 일정' : s.title) : ''; };
    let lastDate = '';
    const rows = mine.map(x => {
      const c = this.cat(x.category);
      const d = new Date(x.date + 'T00:00:00');
      const head = x.date !== lastDate ? `<div class="exp-date">${d.getMonth() + 1}월 ${d.getDate()}일 (${U.DAYS[d.getDay()]})</div>` : '';
      lastDate = x.date;
      return `${head}
        <button type="button" class="exp-item" onclick="Expenses.openForm(${escJs(x.id)})">
          <span class="exp-ico">${c.icon}</span>
          <span class="exp-info"><b>${esc(c.label)}${x.memo ? ' · ' + esc(x.memo) : ''}</b>${title(x.schedule_id) ? `<small>${esc(title(x.schedule_id))}</small>` : ''}${x.status === 'rejected' && x.review_note ? `<small class="exp-bad">반려 사유: ${esc(x.review_note)}</small>` : ''}</span>
          ${x.receipt_path || x.receipt_local ? '<span class="exp-rc" title="영수증 있음">📷</span>' : ''}
          <span class="exp-amt">${this.won(x.amount)}${x.status === 'approved' ? '<small class="exp-st ok">승인</small>' : x.status === 'rejected' ? '<small class="exp-st bad">반려</small>' : ''}</span>
        </button>`;
    }).join('');
    box.innerHTML = `
      <div class="exp-total">
        <div class="exp-total-label">이번 달 합계 · ${mine.length}건</div>
        <div class="exp-total-amt">${this.won(total)}</div>
        ${byCat.length ? `<div class="exp-cats">${byCat.map(c => `<span>${c.icon} ${esc(c.label)} ${this.won(c.sum)}</span>`).join('')}</div>` : ''}
      </div>
      <button type="button" class="exp-add" onclick="Expenses.openForm()">+ 경비 추가</button>
      ${mine.length ? `
        <div class="exp-tools">
          <button type="button" onclick="Expenses.copy()">내역 복사 (청구용)</button>
          <button type="button" onclick="Expenses.csv()">엑셀(CSV) 받기</button>
        </div>
        <div class="exp-list">${rows}</div>`
        : `<div class="exp-empty">이번 달 기록이 없어요.<br>주유·주차·식비 영수증을 바로 남겨 두면 정산이 쉬워요.</div>`}
      ${this.online() && !(typeof Plan !== 'undefined' && Plan.isIndie()) ? '<p class="exp-note">본사에서 회사 매니저 경비를 모아 볼 수 있어요.</p>' : ''}`;
  },

  // 등록·수정 창 (opts: { scheduleId, date } — 일정 카드에서 열 때)
  openForm(id = null, opts = {}) {
    if (typeof Plan !== 'undefined' && !Plan.require('expenses')) return;
    const cur = id ? this.items.find(x => x.id === id) : null;
    this._receipt = null;
    const date = cur?.date || opts.date || this.ymd(new Date());
    const catSel = cur?.category || opts.category || 'parking';
    const mySch = (window.hqStore?.getSchedules?.() || []).filter(s => s.date === date);
    const schSel = cur?.schedule_id || opts.scheduleId || '';
    App.showModal(cur ? '경비 수정' : '경비 추가', `
      <form id="exp-form" onsubmit="event.preventDefault(); if (event.submitter === null) return; Expenses.save(${cur ? escJs(cur.id) : 'null'})" style="display:flex; flex-direction:column; gap:12px; text-align:left;">
        <div class="exp-cat-pick">${this.cats().map(c => `<button type="button" data-c="${c.id}" class="${c.id === catSel ? 'on' : ''}" onclick="Expenses._pick(this)">${c.icon} ${c.label}</button>`).join('')}</div>
        <label class="art-label"><span>금액 (원) <span style="color:#ef4444;">*</span></span>
          <input id="exp-amount" class="art-input" inputmode="numeric" pattern="[0-9,]*" placeholder="예: 5000" value="${cur ? esc(String(cur.amount)) : ''}" oninput="this.value=this.value.replace(/[^0-9]/g,'')" /></label>
        <label class="art-label">날짜
          <input id="exp-date" type="date" class="art-input" value="${esc(date)}" onchange="Expenses._schOptions(this.value)" /></label>
        <label class="art-label">관련 일정 (선택)
          <select id="exp-sch" class="art-input">${this._schOpts(mySch, schSel)}</select></label>
        <label class="art-label">메모 (선택)
          <input id="exp-memo" class="art-input" maxlength="100" placeholder="예: KBS 주차장" value="${esc(cur?.memo || '')}" /></label>
        <div class="art-label">영수증 사진 (선택)
          <label class="exp-photo"><input id="exp-file" type="file" accept="image/*" capture="environment" hidden onchange="Expenses._file(this)" />
            <span id="exp-photo-txt">${cur?.receipt_path || cur?.receipt_local ? '📷 영수증 있음 · 바꾸려면 누르기' : '📷 사진 찍기 / 고르기'}</span></label>
          ${cur?.receipt_path ? `<button type="button" class="exp-link" onclick="Expenses.viewReceipt(${escJs(cur.receipt_path)})">영수증 보기</button>` : ''}
        </div>
        <button type="submit" id="exp-save" class="btn-primary" style="width:100%; padding:14px; font-weight:800;">${cur ? '저장' : '추가'}</button>
        ${cur ? `<button type="button" class="btn-secondary" style="width:100%; padding:12px; color:#dc2626;" onclick="Expenses.remove(${escJs(cur.id)})">삭제</button>` : ''}
      </form>`);
    const form = document.getElementById('exp-form');
    form?.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing && e.target.tagName === 'INPUT') { e.preventDefault(); e.target.blur(); } });
  },

  _schOpts(list, sel) {
    return '<option value="">선택 안 함</option>' + list.map(s => `<option value="${esc(s.id)}" ${s.id === sel ? 'selected' : ''}>${esc((s.startTime || '') + ' ' + (s.isSecret ? '비공개 일정' : s.title))}</option>`).join('');
  },
  _schOptions(date) {
    const sel = U.$('#exp-sch');
    if (sel) sel.innerHTML = this._schOpts((window.hqStore?.getSchedules?.() || []).filter(s => s.date === date), '');
  },
  _pick(btn) { btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn)); },

  async _file(input) {
    const f = input.files && input.files[0];
    if (!f) return;
    try {
      this._receipt = window.Chat?._compress ? await window.Chat._compress(f) : f;
      const t = U.$('#exp-photo-txt'); if (t) t.textContent = '📷 사진 준비됨 · 바꾸려면 누르기';
    } catch (e) { U.toast('사진을 읽지 못했어요. 다른 사진으로 해 주세요.'); }
  },

  async save(id) {
    const amount = Number((U.$('#exp-amount')?.value || '').replace(/[^0-9]/g, ''));
    if (!amount) { U.toast('금액을 입력해 주세요.'); return; }
    if (amount > 10000000) { U.toast('금액이 너무 커요. 다시 확인해 주세요.'); return; }
    const date = U.$('#exp-date')?.value || this.ymd(new Date());
    const category = U.$('.exp-cat-pick button.on')?.dataset.c || 'etc';
    const schedule_id = U.$('#exp-sch')?.value || null;
    const sch = schedule_id && (window.hqStore?.getSchedules?.() || []).find(s => s.id === schedule_id);
    const memo = (U.$('#exp-memo')?.value || '').trim().slice(0, 100);
    const cur = id ? this.items.find(x => x.id === id) : null;
    const btn = U.$('#exp-save'); if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
    try {
      if (this.online()) {
        let receipt_path = cur?.receipt_path || null;
        if (this._receipt) receipt_path = await SupabaseClient.expenseUploadReceipt(this._receipt);
        await SupabaseClient.expenseSave({ id, date, category, amount, memo, schedule_id: /^[0-9a-f-]{36}$/i.test(schedule_id || '') ? schedule_id : null, artist_id: sch?.artistId && sch.artistId !== 'ALL' ? sch.artistId : null, receipt_path });
        if (this._receipt && cur?.receipt_path && cur.receipt_path !== receipt_path) SupabaseClient.client.storage.from('expense-receipts').remove([cur.receipt_path]).catch(() => { });
      } else {
        const list = this._local().filter(x => x.id !== id);
        list.push({ id: id || 'exp_' + Date.now().toString(36), date, category, amount, memo, schedule_id, receipt_local: !!(this._receipt || cur?.receipt_local) });
        this._saveLocal(list);
      }
      this._receipt = null;
      App.closeModal();
      U.toast(id ? '경비를 수정했어요' : `${this.cat(category).label} ${this.won(amount)} 기록했어요`);
      if (date.slice(0, 7) !== this.month) this.month = date.slice(0, 7);
      if (State.screen === 'expenses' || State.screen === 'vehicle') this.rerender();
    } catch (e) {
      const raw = String(e?.message || '');
      if (/PAID_FEATURE/.test(raw)) { App.closeModal(); Plan.upsell('expenses'); }
      else U.toast(navigator.onLine === false ? '인터넷 연결을 확인해 주세요.' : '저장하지 못했어요. 잠시 후 다시 해 주세요.');
      if (btn) { btn.disabled = false; btn.textContent = id ? '저장' : '추가'; }
    }
  },

  async remove(id) {
    const cur = this.items.find(x => x.id === id);
    if (!cur || !confirm(`${this.cat(cur.category).label} ${this.won(cur.amount)} 기록을 삭제할까요?`)) return;
    try {
      if (this.online()) await SupabaseClient.expenseDelete(id, cur.receipt_path);
      else this._saveLocal(this._local().filter(x => x.id !== id));
      App.closeModal();
      U.toast('삭제했어요');
      this.rerender();
    } catch (e) { U.toast('삭제하지 못했어요. 잠시 후 다시 해 주세요.'); }
  },

  async viewReceipt(path) {
    try {
      const url = await SupabaseClient.expenseReceiptUrl(path);
      if (url) window.open(url, '_blank', 'noopener');
    } catch (e) { U.toast('영수증을 열지 못했어요.'); }
  },

  _lines() {
    const name = localStorage.getItem('bp_user_name') || '';
    const [y, m] = this.month.split('-').map(Number);
    const total = this.items.reduce((s, x) => s + Number(x.amount || 0), 0);
    const list = [...this.items].sort((a, b) => a.date.localeCompare(b.date));
    return { name, y, m, total, list };
  },

  async copy() {
    const { name, y, m, total, list } = this._lines();
    const text = [`[${y}년 ${m}월 경비 내역${name ? ' · ' + name : ''}]`,
      ...list.map(x => `${x.date.slice(5).replace('-', '/')} ${this.cat(x.category).label} ${this.won(x.amount)}${x.memo ? ' (' + x.memo + ')' : ''}`),
      `합계 ${this.won(total)} (${list.length}건)`].join('\n');
    try { await navigator.clipboard.writeText(text); U.toast('경비 내역을 복사했어요. 카톡·문자에 붙여 넣으세요.'); }
    catch (e) { App.showModal('경비 내역', `<textarea style="width:100%; height:240px; font-size:14px;" readonly>${esc(text)}</textarea>`); }
  },

  csv() {
    const { name, y, m, list } = this._lines();
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const schedules = window.hqStore?.getSchedules?.() || [];
    const rows = [['날짜', '항목', '금액', '메모', '관련 일정', '영수증'],
      ...list.map(x => { const s = schedules.find(z => z.id === x.schedule_id); return [x.date, this.cat(x.category).label, x.amount, x.memo || '', s ? (s.isSecret ? '비공개 일정' : s.title) : '', x.receipt_path || x.receipt_local ? '있음' : '']; })];
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `경비_${y}-${String(m).padStart(2, '0')}${name ? '_' + name.replace(/[\\/:*?"<>|\s]+/g, '') : ''}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
};
window.Expenses = Expenses;
