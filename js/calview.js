/* =========================================
   RoadPlanner — 캘린더 (아래 메뉴 두 번째)
   한 달을 한눈에: 날짜마다 일정 점(아티스트 색) · 고른 날 일정 목록 · 누르면 '오늘' 화면에서 그날 동선
   ========================================= */
const CalView = {
  y: null, m: null, sel: null,

  _ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
  _clean(n) { return String(n || '').replace(/\s*\([^)]*\)\s*$/, '').trim(); },

  render() {
    const el = U.$('#screen-calendar');
    if (!el) return;
    const now = new Date();
    if (this.y === null) { this.y = now.getFullYear(); this.m = now.getMonth(); }
    if (!this.sel) this.sel = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const y = this.y, m = this.m;
    const first = new Date(y, m, 1);
    const lead = first.getDay();                       // 일요일 시작
    const days = new Date(y, m + 1, 0).getDate();
    const arts = (window.hqStore?.getArtists?.() || []);
    const colorOf = (s) => (arts.find(a => a.id === s.artistId)?.color) || '#3B45C4';
    const same = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="cv-cell blank" aria-hidden="true"></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const list = State.getSchedulesForDate(y, m, d) || [];
      const dots = list.slice(0, 3).map(s => `<i style="background:${esc(colorOf(s))}"></i>`).join('') + (list.length > 3 ? '<b>+</b>' : '');
      const cls = ['cv-cell', same(date, this.sel) ? 'sel' : '', same(date, now) ? 'today' : '', date.getDay() === 0 ? 'sun' : date.getDay() === 6 ? 'sat' : '', date < new Date(now.getFullYear(), now.getMonth(), now.getDate()) ? 'past' : ''].filter(Boolean).join(' ');
      cells += `<button type="button" class="${cls}" onclick="CalView.pick(${y},${m},${d})" aria-pressed="${same(date, this.sel)}" aria-label="${m + 1}월 ${d}일${list.length ? ` 일정 ${list.length}건` : ''}"><span class="cv-n">${d}</span><span class="cv-dots">${dots}</span></button>`;
    }

    const sel = this.sel;
    const selList = (State.getSchedulesForDate(sel.getFullYear(), sel.getMonth(), sel.getDate()) || []).slice().sort((a, b) => String(a.startTime || '').localeCompare(String(b.startTime || '')));
    const rows = selList.map(s => {
      const hidden = s.isSecret && window.AuthPersona && !window.AuthPersona.canViewSecret?.(s);
      return `<button type="button" class="cv-row" onclick="CalView.open(${sel.getFullYear()},${sel.getMonth()},${sel.getDate()})">
        <span class="cv-t">${esc(String(s.startTime || '').slice(0, 5) || '--:--')}</span>
        <span class="cv-bar" style="background:${esc(colorOf(s))}"></span>
        <span class="cv-body"><b>${esc(hidden ? '비공개 일정' : (s.title || '일정'))}</b><small>${esc([this._clean(s.artistName), hidden ? '' : this._clean(s.location)].filter(Boolean).join(' · '))}</small></span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      </button>`;
    }).join('');

    el.innerHTML = `
      <div class="cv-wrap">
        <div class="cv-head">
          <h1>${y}년 ${m + 1}월</h1>
          <span class="cv-arrows">
            <button type="button" class="cv-today" onclick="CalView.today()">오늘</button>
            <button type="button" onclick="CalView.shift(-1)" aria-label="이전 달"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg></button>
            <button type="button" onclick="CalView.shift(1)" aria-label="다음 달"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg></button>
          </span>
        </div>
        <div class="cv-week" aria-hidden="true"><span class="sun">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span class="sat">토</span></div>
        <div class="cv-grid">${cells}</div>
        <section class="cv-list" aria-label="고른 날 일정">
          <div class="cv-list-h"><b>${sel.getMonth() + 1}월 ${sel.getDate()}일 ${U.DAYS[sel.getDay()]}요일</b><span>${selList.length ? `일정 ${selList.length}건` : ''}</span></div>
          ${rows || `<div class="cv-empty">일정이 없어요<button type="button" onclick="CalView.add()">+ 일정 등록</button></div>`}
          ${selList.length ? `<button type="button" class="cv-go" onclick="CalView.open(${sel.getFullYear()},${sel.getMonth()},${sel.getDate()})">이 날 동선 보기</button>` : ''}
        </section>
      </div>`;
  },

  pick(y, m, d) { this.sel = new Date(y, m, d); this.render(); },
  shift(n) { const d = new Date(this.y, this.m + n, 1); this.y = d.getFullYear(); this.m = d.getMonth(); this.render(); },
  today() { const n = new Date(); this.y = n.getFullYear(); this.m = n.getMonth(); this.sel = new Date(n.getFullYear(), n.getMonth(), n.getDate()); this.render(); },
  open(y, m, d) {
    App.navigate('home');
    setTimeout(() => { try { Home.selectDate(y, m, d); } catch (e) { } }, 60);
  },
  add() {
    const s = this.sel;
    App.navigate('home');
    setTimeout(() => { try { Home.selectDate(s.getFullYear(), s.getMonth(), s.getDate()); Home.openScheduleRegisterModal(); } catch (e) { } }, 80);
  },
};
window.CalView = CalView;
