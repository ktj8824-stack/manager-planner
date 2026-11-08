/* =========================================
   본사 웹 — 경비 정산 (같은 회사 매니저가 앱에서 남긴 경비를 월별로 모아 보기)
   - 읽기 전용 (수정·삭제는 매니저 본인만)
   - 매니저별 합계, 항목별 합계, 영수증 보기, 엑셀(CSV) 받기
   ========================================= */
const HqExpenses = {
  CATS: { fuel: '주유', parking: '주차', toll: '통행료', meal: '식비', transport: '교통', supplies: '소모품', etc: '기타' },
  month: null,
  items: [],
  filter: 'ALL',

  won(n) { return (Number(n) || 0).toLocaleString() + '원'; },
  managers() { try { return window.hqStore?.getManagers?.() || []; } catch (e) { return []; } },
  name(uid) { const m = this.managers().find(x => x.id === uid); return m ? m.name : (uid === window.SupabaseClient?.currentUser?.id ? '나' : '(퇴사·삭제된 계정)'); },

  _modal() {
    let m = document.getElementById('modal-hq-expenses');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'modal-hq-expenses';
    m.className = 'modal-overlay';
    m.innerHTML = `
      <div class="modal-content" style="max-width: 900px; width: 94%;">
        <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
          <h3 style="margin:0; font-size:16px; font-weight:800; color:#0f172a;">💳 매니저 경비 정산</h3>
          <button type="button" class="btn-secondary" onclick="HqExpenses.close()" style="padding:7px 16px; font-size:13.5px; font-weight:800; border-radius:8px;">닫기</button>
        </div>
        <div class="modal-body" style="padding:16px;" id="hq-exp-body"></div>
      </div>`;
    m.addEventListener('click', (e) => { if (e.target === m) this.close(); });
    document.body.appendChild(m);
    return m;
  },

  async open() {
    const d = new Date();
    if (!this.month) this.month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this._modal().classList.add('active');
    await this.load();
  },
  close() { document.getElementById('modal-hq-expenses')?.classList.remove('active'); },

  shift(n) {
    const [y, m] = this.month.split('-').map(Number);
    const t = new Date(y, m - 1 + n, 1);
    this.month = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
    this.load();
  },

  async load() {
    const body = document.getElementById('hq-exp-body');
    if (body) body.innerHTML = '<div style="padding:30px; text-align:center; color:#64748b;">불러오는 중...</div>';
    const [y, m] = this.month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    try {
      this.items = await window.SupabaseClient.expensesList(`${this.month}-01`, `${this.month}-${String(last).padStart(2, '0')}`);
    } catch (e) {
      if (body) body.innerHTML = '<div style="padding:30px; text-align:center; color:#dc2626;">경비를 불러오지 못했어요. 로그인·인터넷 연결을 확인해 주세요.</div>';
      return;
    }
    this.draw();
  },

  setFilter(v) { this.filter = v; this.draw(); },

  draw() {
    const body = document.getElementById('hq-exp-body');
    if (!body) return;
    const [y, m] = this.month.split('-').map(Number);
    const all = this.items;
    const list = this.filter === 'ALL' ? all : all.filter(x => x.user_id === this.filter);
    const total = list.reduce((s, x) => s + Number(x.amount || 0), 0);
    const byMgr = {};
    all.forEach(x => { byMgr[x.user_id] = (byMgr[x.user_id] || 0) + Number(x.amount || 0); });
    const byCat = {};
    list.forEach(x => { byCat[x.category] = (byCat[x.category] || 0) + Number(x.amount || 0); });
    const schedules = window.hqStore?.getSchedules?.() || [];
    const sch = (id) => { const s = id && schedules.find(z => z.id === id); return s ? (s.isSecret ? '비공개 일정' : s.title) : ''; };
    const mgrIds = Object.keys(byMgr);
    body.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-bottom:14px;">
        <button type="button" class="btn-secondary" onclick="HqExpenses.shift(-1)" style="padding:6px 12px;">‹</button>
        <b style="font-size:16px; color:#0f172a;">${y}년 ${m}월</b>
        <button type="button" class="btn-secondary" onclick="HqExpenses.shift(1)" style="padding:6px 12px;">›</button>
        <select onchange="HqExpenses.setFilter(this.value)" style="margin-left:auto; padding:7px 10px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px;">
          <option value="ALL">전체 매니저</option>
          ${mgrIds.map(id => `<option value="${esc(id)}" ${this.filter === id ? 'selected' : ''}>${esc(this.name(id))}</option>`).join('')}
        </select>
        <button type="button" class="btn-primary" onclick="HqExpenses.csv()" style="width:auto; padding:7px 14px; font-size:13px;" ${list.length ? '' : 'disabled'}>엑셀(CSV) 받기</button>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:10px; margin-bottom:14px;">
        <div style="background:#1e1b4b; color:#fff; border-radius:12px; padding:12px 14px;">
          <div style="font-size:12px; opacity:.7; font-weight:700;">${this.filter === 'ALL' ? '전체' : esc(this.name(this.filter))} 합계 · ${list.length}건</div>
          <div style="font-size:22px; font-weight:800; margin-top:2px;">${this.won(total)}</div>
        </div>
        ${this.filter === 'ALL' ? mgrIds.map(id => `
          <button type="button" onclick="HqExpenses.setFilter(${escJs(id)})" style="text-align:left; background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; cursor:pointer;">
            <div style="font-size:12.5px; color:#64748b; font-weight:700;">${esc(this.name(id))}</div>
            <div style="font-size:17px; font-weight:800; color:#0f172a; margin-top:2px;">${this.won(byMgr[id])}</div>
          </button>`).join('') : ''}
      </div>
      ${Object.keys(byCat).length ? `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px;">${Object.entries(byCat).map(([c, v]) => `<span style="background:#eef2ff; color:#3730a3; border-radius:999px; padding:4px 10px; font-size:12.5px; font-weight:700;">${esc(this.CATS[c] || c)} ${this.won(v)}</span>`).join('')}</div>` : ''}
      ${list.length ? `
      <div style="overflow-x:auto; border:1px solid #e2e8f0; border-radius:12px;">
        <table style="width:100%; border-collapse:collapse; font-size:13px; min-width:640px;">
          <thead><tr style="background:#f8fafc; color:#475569; text-align:left;">
            <th style="padding:9px 10px;">날짜</th><th style="padding:9px 10px;">매니저</th><th style="padding:9px 10px;">항목</th>
            <th style="padding:9px 10px; text-align:right;">금액</th><th style="padding:9px 10px;">메모</th><th style="padding:9px 10px;">관련 일정</th><th style="padding:9px 10px;">영수증</th>
          </tr></thead>
          <tbody>${list.map(x => `
            <tr style="border-top:1px solid #f1f5f9;">
              <td style="padding:8px 10px; white-space:nowrap;">${esc(x.date.slice(5).replace('-', '/'))}</td>
              <td style="padding:8px 10px; white-space:nowrap;">${esc(this.name(x.user_id))}</td>
              <td style="padding:8px 10px; white-space:nowrap;">${esc(this.CATS[x.category] || x.category)}</td>
              <td style="padding:8px 10px; text-align:right; font-weight:800; white-space:nowrap;">${this.won(x.amount)}</td>
              <td style="padding:8px 10px;">${esc(x.memo || '')}</td>
              <td style="padding:8px 10px;">${esc(sch(x.schedule_id))}</td>
              <td style="padding:8px 10px;">${x.receipt_path ? `<button type="button" onclick="HqExpenses.receipt(${escJs(x.receipt_path)})" style="border:0; background:none; color:#4f46e5; font-weight:700; text-decoration:underline; cursor:pointer;">보기</button>` : '<span style="color:#94a3b8;">없음</span>'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : `<div style="padding:30px; text-align:center; color:#64748b;">이 달에는 기록된 경비가 없어요.<br>매니저가 앱 '내 정보 → 경비 기록'에서 남기면 여기에 모여요.</div>`}`;
  },

  async receipt(path) {
    const w = window.open('', '_blank');
    if (w) w.opener = null;
    try {
      const url = await window.SupabaseClient.expenseReceiptUrl(path);
      if (w) w.location.href = url; else window.open(url, '_blank');
    } catch (e) { if (w) w.close(); alert('영수증을 열지 못했어요.'); }
  },

  csv() {
    const list = this.filter === 'ALL' ? this.items : this.items.filter(x => x.user_id === this.filter);
    const schedules = window.hqStore?.getSchedules?.() || [];
    const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['날짜', '매니저', '항목', '금액', '메모', '관련 일정', '영수증'],
      ...[...list].sort((a, b) => a.date.localeCompare(b.date)).map(x => {
        const s = schedules.find(z => z.id === x.schedule_id);
        return [x.date, this.name(x.user_id), this.CATS[x.category] || x.category, x.amount, x.memo || '', s ? (s.isSecret ? '비공개 일정' : s.title) : '', x.receipt_path ? '있음' : ''];
      })];
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `경비정산_${this.month}${this.filter === 'ALL' ? '' : '_' + this.name(this.filter).replace(/[\\/:*?"<>|\s]+/g, '')}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  },
};
window.HqExpenses = HqExpenses;
