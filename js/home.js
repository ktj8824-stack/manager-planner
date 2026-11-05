// ── 🎨 아티스트 고유 활동 유형별 라인 SVG 아이콘 헬퍼 ──
function getArtistTypeIcon(art, size = 14) {
  if (!art) return `<svg width="${esc(size)}" height="${esc(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`;
  const nameStr = (typeof art === 'string' ? art : (art.name || '')).toLowerCase();
  const typeStr = (art.type || '').toLowerCase();
  
  if (typeStr.includes('배우') || typeStr.includes('actor') || nameStr.includes('은호') || nameStr.includes('eunho')) {
    return `<svg width="${esc(size)}" height="${esc(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m4 4 3 4"/><path d="m11 4 3 4"/><path d="m18 4 3 4"/><line x1="2" y1="8" x2="22" y2="8"/></svg>`;
  }
  if (typeStr.includes('솔로') || typeStr.includes('solo') || typeStr.includes('보컬') || nameStr.includes('유나') || nameStr.includes('yuna')) {
    return `<svg width="${esc(size)}" height="${esc(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  }
  if (typeStr.includes('보이') || typeStr.includes('boy') || nameStr.includes('에이펙스') || nameStr.includes('apex')) {
    return `<svg width="${esc(size)}" height="${esc(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  }
  return `<svg width="${esc(size)}" height="${esc(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}

const Home = {
  selectedDate: new Date(),
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  currentTab: 'schedule', // 'schedule' (회사 스케줄표) | 'timeline' (매니저 동선 타임라인)
  broadcastBound: false,

  // ── 일정 카드 길게 누르기 → 내일로 복사 (같은 방송국·같은 차량 일정이 이어질 때 한 번에 등록) ──
  _bindHold() {
    if (this._holdBound) return;
    this._holdBound = true;
    let timer = null, sx = 0, sy = 0, target = null;
    const cancel = () => { clearTimeout(timer); timer = null; target = null; };
    document.addEventListener('pointerdown', (e) => {
      const card = e.target.closest && e.target.closest('[data-hold-sch]');
      if (!card || e.target.closest('button, a, input, select, textarea')) return;
      target = card; sx = e.clientX; sy = e.clientY;
      timer = setTimeout(() => {
        const id = target && target.getAttribute('data-hold-sch');
        cancel();
        if (!id) return;
        this._holdFired = Date.now();
        try { navigator.vibrate && navigator.vibrate(30); } catch (err) { }
        this.openHoldMenu(id);
      }, 550);
    }, { passive: true });
    document.addEventListener('pointermove', (e) => { if (timer && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) cancel(); }, { passive: true });
    ['pointerup', 'pointercancel', 'scroll'].forEach(t => document.addEventListener(t, () => { if (timer) cancel(); }, { passive: true, capture: true }));
    // 길게 누른 뒤 손을 떼며 생기는 클릭(카드 열기)은 무시
    document.addEventListener('click', (e) => {
      if (this._holdFired && Date.now() - this._holdFired < 700 && e.target.closest && e.target.closest('[data-hold-sch]')) { e.stopPropagation(); e.preventDefault(); }
    }, true);
    document.addEventListener('contextmenu', (e) => { if (e.target.closest && e.target.closest('[data-hold-sch]')) e.preventDefault(); });
  },

  openHoldMenu(id) {
    const sch = (window.hqStore?.getSchedules?.() || []).find(s => s.id === id);
    if (!sch) { U.toast('일정을 찾지 못했어요.'); return; }
    const d = new Date(sch.date + 'T12:00:00');
    const nx = new Date(d); nx.setDate(d.getDate() + 1);
    const lbl = (x) => `${x.getMonth() + 1}/${x.getDate()}(${U.DAYS[x.getDay()]})`;
    const B = 'width:100%; min-height:52px; border-radius:12px; font-size:16px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;';
    App.showModal('일정 복사', `
      <div style="padding:2px 0 12px;">
        <div style="font-size:15px; color:#334155; margin-bottom:12px; line-height:1.5;"><b>${esc(sch.title || '일정')}</b><br>${esc(lbl(d))} ${esc(sch.startTime || '')}${sch.location ? ' · ' + esc(String(sch.location).replace(/\s*\([^()]*\)\s*$/, '')) : ''}${sch.vehicleName ? ' · ' + esc(sch.vehicleName) : ''}</div>
        <button type="button" onclick="Home.copySchedule(${escJs(id)}, 1)" style="${B} border:0; background:#4f46e5; color:#fff; margin-bottom:8px;">📋 내일로 복사 · ${esc(lbl(nx))}</button>
        <label style="${B} position:relative; border:1px solid #c7d2fe; background:#eef2ff; color:#4338ca; margin-bottom:8px;">
          📅 다른 날짜로 복사
          <input type="date" aria-label="복사할 날짜" onchange="Home.copySchedule(${escJs(id)}, this.value)" style="position:absolute; inset:0; opacity:0; font-size:16px; cursor:pointer;" />
        </label>
        <div style="font-size:14px; color:#64748b; margin:4px 2px 10px; line-height:1.5;">같은 장소·아티스트·차량·담당 매니저·샵으로 복사하고, 출발 시간은 그날 교통으로 다시 계산해요.</div>
        <button type="button" onclick="App.closeModal()" style="${B} border:1px solid #cbd5e1; background:#fff; color:#475569;">닫기</button>
      </div>`);
  },

  async copySchedule(id, when) {
    if (this._copying) return;
    const src = (window.hqStore?.getSchedules?.() || []).find(s => s.id === id);
    if (!src || !window.hqStore?.saveSchedule) return;
    let date;
    if (typeof when === 'number') { const d = new Date(src.date + 'T12:00:00'); d.setDate(d.getDate() + when); date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(when || '')) date = when;
    else return;
    const copy = JSON.parse(JSON.stringify(src));
    // 서버 번호(remoteId)·동기화 상태까지 지워야 복사본이 새 일정으로 올라감 (남기면 원본 일정이 복사본 날짜로 덮어써짐)
    ['timeline', 'statusLogs', 'status_logs', 'shareToken', 'share_token', 'createdAt', 'created_at', 'updatedAt', 'updated_at', 'remoteId', 'remote_id', 'syncStatus'].forEach(k => delete copy[k]);
    Object.assign(copy, { id: 'sch_' + Date.now(), date, status: '확정' });
    const conflicts = this._findConflicts(copy);
    if (conflicts.length && !confirm(`${date}에 겹치는 일정이 있어요.\n\n${conflicts.slice(0, 3).join('\n')}\n\n그래도 복사할까요?`)) return;
    this._copying = true;
    U.toast('복사하는 중… 출발 시간을 계산하고 있어요');
    try {
      await window.hqStore.saveSchedule(copy);
      App.closeModal();
      const [y, m, d] = date.split('-').map(Number);
      this.selectDate(y, m - 1, d);
      U.toast(`✅ ${m}/${d}에 복사했어요.`);
    } catch (err) {
      U.toast('복사하지 못했습니다: ' + (err?.message || err));
    } finally { this._copying = false; }
  },

  init() {
    this._bindHold(); 
    this.selectedDate = window._selectedDateForRegister || new Date();
    window._selectedDateForRegister = null;
    this.calMonth = this.selectedDate.getMonth();
    this.calYear = this.selectedDate.getFullYear();
    
    // BroadcastChannel 실시간 리스너 등록 (본사 웹에서 스케줄 추가/수정 시 즉시 리렌더링)
    if (!this.broadcastBound && window.hqStore && window.hqStore.broadcast) {
      window.hqStore.broadcast.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'MANAGER_ASSIGNED') {
          const mgrId = localStorage.getItem('bp_manager_id');
          const managers = typeof window.hqStore.getManagersSync === 'function' ? window.hqStore.getManagersSync() : window.hqStore.getManagers();
          const myMgr = managers.find(m => m.id === mgrId);
          if (myMgr) {
            localStorage.setItem('bp_assigned_artists', JSON.stringify(myMgr.assignedArtists || []));
          }
        }
        this.updateLeftCal();
        this.updateRightTimeline();
      });
      this.broadcastBound = true;
    }

    this.render(); 
  },

  copyBriefing() {
    if (!this.currentEvents || this.currentEvents.length === 0) {
      U.toast('복사할 일정이 없습니다.');
      return;
    }
    
    // Group events by schedule ID to generate briefing per schedule
    const schedulesMap = new Map();
    
    this.currentEvents.forEach(ev => {
      const id = ev.hqScheduleId || 'custom';
      if (!schedulesMap.has(id)) {
        schedulesMap.set(id, {
          title: ev.hqScheduleId ? (ev.artistName || '아티스트') : '개인 일정',
          vehicle: ev.vehicleName,
          shop: ev.shopName,
          outfit: ev.outfit,
          supplies: ev.supplies,
          steps: []
        });
      }
      schedulesMap.get(id).steps.push(ev);
    });

    let text = '';
    
    schedulesMap.forEach((info, id) => {
      text += `[오늘 ${info.title} 스케줄 안내]\n`;
      info.steps.forEach(t => {
        let label = t.title.replace(/🎬 |🏁 |💄 |🚗 |📌 /g, '');
        if (label.includes('픽업')) label = `숙소 픽업 (${info.vehicle || '차량 미지정'})`;
        else if (label.includes('메이크업') || label.includes('샵')) label = `${info.shop || '샵'} (헤어/메이크업)`;
        else if (label.includes('도착') || label.includes('이동')) label = `${t.location || '현장'} 도착`;
        text += `- ${t.time} : ${label}\n`;
      });
      if (info.outfit || info.supplies) {
        text += `\n* 준비물: ${info.outfit ? info.outfit : ''}${info.outfit && info.supplies ? ', ' : ''}${info.supplies ? info.supplies : ''}\n`;
      }
      text += '\n';
    });
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text.trim()).then(() => {
        U.toast('📋 카카오톡 일정 브리핑 텍스트가 복사되었습니다!');
      }).catch(err => {
        U.toast('텍스트 복사에 실패했습니다.');
      });
    } else {
      U.toast('클립보드 API를 지원하지 않는 기기입니다.');
    }
  },

  render() {
    const el = U.$('#screen-home');
    if (!el) return;

    // 위: 가로 주간 띠 / 아래: 일정 (화면 폭 전체)
    el.innerHTML = `
      <div class="split-view home-col" style="display:flex; flex-direction:column; height:calc(100dvh - var(--header-h) - var(--bottom-nav-h, 0px) - env(safe-area-inset-bottom)); margin-top:var(--header-h); overflow:hidden; background:var(--bg-app);">
        <div id="week-strip" style="flex-shrink:0; background:#ffffff; border-bottom:1px solid var(--border-default); padding:8px 10px 10px;">
          ${this.renderWeekStrip()}
        </div>
        <div class="split-right" style="flex:1; overflow-y:auto; overflow-x:hidden; background:var(--bg-default); position:relative;">
          <div id="timeline-area" style="padding:14px 12px 24px; max-width:800px; margin:0 auto; min-height:100%;">
            ${this.renderTimeline()}
          </div>
        </div>
      </div>
    `;
  },

  // 가로 주간 띠: 선택한 날이 들어 있는 주(월~일) + 앞뒤 주 이동 + 오늘 + 날짜 고르기
  renderWeekStrip() {
    const sel = this.selectedDate;
    const today = new Date();
    const same = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const start = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate() - ((sel.getDay() + 6) % 7));   // 월요일
    const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    let days = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const isSel = same(d, sel), isToday = same(d, today);
      const has = (State.getSchedulesForDate(d.getFullYear(), d.getMonth(), d.getDate()) || []).length > 0;
      const dow = d.getDay();
      const dowColor = isSel ? 'rgba(255,255,255,0.85)' : dow === 0 ? '#dc2626' : dow === 6 ? '#2563eb' : '#475569';
      days += `
        <button type="button" onclick="Home.selectDate(${d.getFullYear()},${d.getMonth()},${d.getDate()})" aria-label="${d.getMonth() + 1}월 ${d.getDate()}일${has ? ' 일정 있음' : ''}" aria-pressed="${isSel}"
          style="flex:1 1 0; min-width:44px; min-height:60px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px; border:0; border-radius:12px; cursor:pointer; padding:4px 0;
                 ${isSel ? 'background:#1e293b; color:#fff; box-shadow:0 3px 10px rgba(15,23,42,0.18);' : isToday ? 'background:#eef2ff; color:#0f172a;' : 'background:transparent; color:#0f172a;'}">
          <span style="font-size:13px; font-weight:700; color:${dowColor};">${U.DAYS[dow]}</span>
          <span style="font-size:19px; font-weight:800; letter-spacing:-0.5px;">${d.getDate()}</span>
          <span style="width:6px; height:6px; border-radius:50%; background:${has ? (isSel ? '#fff' : '#4f46e5') : 'transparent'};"></span>
        </button>`;
    }
    const isThisWeek = same(start, new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7)));
    const B = 'min-width:44px; min-height:44px; border:1px solid #e2e8f0; background:#fff; border-radius:10px; font-size:15px; font-weight:700; color:#334155; cursor:pointer; display:inline-flex; align-items:center; justify-content:center;';
    return `
      <div style="display:flex; align-items:center; gap:6px; margin-bottom:6px;">
        <label style="position:relative; display:inline-flex; align-items:center; gap:4px; min-height:44px; padding:0 4px; font-size:18px; font-weight:800; color:#0f172a; cursor:pointer;">
          ${sel.getFullYear()}년 ${sel.getMonth() + 1}월 <span style="font-size:13px; color:#64748b;">▼</span>
          <input type="date" value="${ymd(sel)}" aria-label="날짜 고르기" onchange="Home.jumpTo(this.value)" style="position:absolute; inset:0; opacity:0; cursor:pointer; font-size:16px;" />
        </label>
        <span style="flex:1;"></span>
        ${isThisWeek ? '' : `<button type="button" onclick="Home.goToday()" style="${B} padding:0 12px;">오늘</button>`}
        <button type="button" onclick="Home.shiftWeek(-1)" aria-label="지난주" style="${B}">‹</button>
        <button type="button" onclick="Home.shiftWeek(1)" aria-label="다음 주" style="${B}">›</button>
      </div>
      <div style="display:flex; gap:2px;">${days}</div>`;
  },

  shiftWeek(n) {
    const d = this.selectedDate;
    this.selectDate(d.getFullYear(), d.getMonth(), d.getDate() + 7 * n);
  },
  goToday() { const t = new Date(); this.selectDate(t.getFullYear(), t.getMonth(), t.getDate()); },
  jumpTo(v) { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); if (m) this.selectDate(+m[1], +m[2] - 1, +m[3]); },

  // 타임라인 영역(오른쪽 칸)만 스크롤한다. scrollIntoView는 앱 전체 틀까지 밀어서 화면이 잘리는 문제가 있었음
  _scrollToStep(el) {
    try {
      const box = el.closest('.split-right') || document.querySelector('.split-right');
      if (!box) return;
      const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 8;
      box.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } catch (e) { }
  },

  centerSelectedDate() {
    const grid = U.$('#mini-cal-grid');
    if (!grid) return;
    const today = new Date();
    const isCurrentMonth = this.calYear === today.getFullYear() && this.calMonth === today.getMonth();

    if (isCurrentMonth) {
      const selectedEl = grid.querySelector('.v-cal-day.today') || grid.querySelector('.v-cal-day.selected');
      if (selectedEl) {
        const elOffset = selectedEl.offsetTop;
        grid.scrollTo({
          top: Math.max(0, elOffset - 6),
          behavior: 'smooth'
        });
        return;
      }
    }
    // 현재 달이 아닐 경우 1일부터 보이도록 최상단으로 스크롤
    grid.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  },

  renderMiniCal() {
    const y = this.calYear;
    const m = this.calMonth;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    
    let html = '';
    
    // 1. 현재 선택된 당월 날짜들 (예: 9월 1일 ~ 30일)
    for(let d=1; d<=daysInMonth; d++) {
      const cellDate = new Date(y, m, d);
      const isSelected = y === this.selectedDate.getFullYear() && m === this.selectedDate.getMonth() && d === this.selectedDate.getDate();
      const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
      const scheds = State.getSchedulesForDate(y, m, d);
      const hasSched = scheds.length > 0;
      
      const dayName = U.DAYS[cellDate.getDay()];
      let dayColor = cellDate.getDay() === 0 ? 'color:#ef4444;' : cellDate.getDay() === 6 ? 'color:#2563eb;' : 'color:#64748b;';
      
      let cls = 'v-cal-day';
      if(isSelected) cls += ' selected';
      if(isToday && !isSelected) cls += ' today';
      
      let dot = hasSched ? `<div style="width:5px; height:5px; background:${isSelected?'#fff':'#4f46e5'}; border-radius:50%; margin-left:auto;"></div>` : '';
      
      html += `
        <div class="${esc(cls)}" onclick="Home.selectDate(${y},${m},${d})" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 4px; cursor:pointer; border-radius:12px; margin-bottom:4px; transition:all 0.15s; ${isSelected ? 'background:#1e293b; color:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.12);' : isToday ? 'background:rgba(79,70,229,0.08);' : ''}">
          <div style="font-size:14px; font-weight:700; ${esc(isSelected ? 'color:rgba(255,255,255,0.8);' : dayColor)}">${esc(dayName)}</div>
          <div style="font-size:17px; font-weight:700; width:26px; text-align:center; letter-spacing:-0.5px; ${isSelected ? 'color:#fff;' : 'color:#0f172a;'}">${esc(d)}</div>
          <div style="width:4px; height:4px; display:flex; align-items:center; justify-content:center;">${dot}</div>
        </div>
      `;
    }

    // 2. 🌟 다음 달 날짜들 연속 렌더링 (예: 10월 1일 ~ 31일)
    const nextMonthDate = new Date(y, m + 1, 1);
    const nextY = nextMonthDate.getFullYear();
    const nextM = nextMonthDate.getMonth();
    const nextDaysInMonth = new Date(nextY, nextM + 1, 0).getDate();

    // 월 구분 라벨 (깔끔한 미니 캡슐 뱃지)
    html += `
      <div style="display:flex; align-items:center; justify-content:center; padding:12px 0 8px; margin:4px 0;">
        <span style="background:#eef2ff; color:#4f46e5; font-size:13px; font-weight:700; padding:2px 10px; border-radius:12px; border:1px solid #e0e7ff; letter-spacing:0.5px; box-shadow:0 1px 2px rgba(0,0,0,0.02);">
          ${esc(nextM + 1)}월
        </span>
      </div>
    `;

    for(let d=1; d<=nextDaysInMonth; d++) {
      const cellDate = new Date(nextY, nextM, d);
      const isSelected = nextY === this.selectedDate.getFullYear() && nextM === this.selectedDate.getMonth() && d === this.selectedDate.getDate();
      const isToday = nextY === today.getFullYear() && nextM === today.getMonth() && d === today.getDate();
      const scheds = State.getSchedulesForDate(nextY, nextM, d);
      const hasSched = scheds.length > 0;
      
      const dayName = U.DAYS[cellDate.getDay()];
      let dayColor = cellDate.getDay() === 0 ? 'color:#ef4444;' : cellDate.getDay() === 6 ? 'color:#2563eb;' : 'color:#64748b;';
      
      let cls = 'v-cal-day';
      if(isSelected) cls += ' selected';
      if(isToday && !isSelected) cls += ' today';
      
      let dot = hasSched ? `<div style="width:5px; height:5px; background:${isSelected?'#fff':'#4f46e5'}; border-radius:50%; margin-left:auto;"></div>` : '';
      
      html += `
        <div class="${esc(cls)}" onclick="Home.selectDate(${nextY},${nextM},${d})" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:10px 4px; cursor:pointer; border-radius:12px; margin-bottom:4px; transition:all 0.15s; ${isSelected ? 'background:#1e293b; color:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.12);' : isToday ? 'background:rgba(79,70,229,0.08);' : ''}">
          <div style="font-size:14px; font-weight:700; ${esc(isSelected ? 'color:rgba(255,255,255,0.8);' : dayColor)}">${esc(dayName)}</div>
          <div style="font-size:17px; font-weight:700; width:26px; text-align:center; letter-spacing:-0.5px; ${isSelected ? 'color:#fff;' : 'color:#0f172a;'}">${esc(d)}</div>
          <div style="width:4px; height:4px; display:flex; align-items:center; justify-content:center;">${dot}</div>
        </div>
      `;
    }

    return html;
  },
  
  prevMonth() {
    this.calMonth--;
    if(this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
    this.syncMonthChange();
  },
  
  nextMonth() {
    this.calMonth++;
    if(this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
    this.syncMonthChange();
  },

  syncMonthChange() {
    const today = new Date();
    if (this.calYear === today.getFullYear() && this.calMonth === today.getMonth()) {
      this.selectedDate = today;
    } else {
      this.selectedDate = new Date(this.calYear, this.calMonth, 1);
    }
    this.updateLeftCal();
    this.updateRightTimeline();
    setTimeout(() => {
      this.centerSelectedDate();
    }, 50);
  },
  
  selectDate(y, m, d) {
    this.selectedDate = new Date(y, m, d);
    this.calYear = this.selectedDate.getFullYear();
    this.calMonth = this.selectedDate.getMonth();
    this.updateLeftCal();
    this.updateRightTimeline();
  },
  
  updateLeftCal() {
    const yearEl = U.$('#mini-cal-year');
    const title = U.$('#mini-cal-title');
    const grid = U.$('#mini-cal-grid');
    if(yearEl) yearEl.textContent = `${this.calYear}년`;
    if(title) title.textContent = `${this.calMonth+1}월`;
    if(grid) grid.innerHTML = this.renderMiniCal();
    const ws = U.$('#week-strip');
    if (ws) ws.innerHTML = this.renderWeekStrip();
  },
  
  updateRightTimeline() {
    const area = U.$('#timeline-area');
    if (area) area.innerHTML = this.renderTimeline();
  },

  setTab(tabName) {
    this.currentTab = tabName;
    this.render();

    // 탭을 바꿀 때는 자동 스크롤하지 않고 맨 위에서 시작 (완료를 눌렀을 때만 다음 단계로 이동)
    setTimeout(() => { const box = document.querySelector('.split-right'); if (box) box.scrollTop = 0; }, 0);
  },

  setManager(mgrId) {
    State.setManagerFilter(mgrId);
    this.updateLeftCal();
    this.updateRightTimeline();
  },

  renderTimeline() {
    const y = this.selectedDate.getFullYear();
    const m = this.selectedDate.getMonth();
    const d = this.selectedDate.getDate();
    const dateStr = `${m+1}월 ${d}일 (${U.DAYS[this.selectedDate.getDay()]})`;
    const managers = (typeof window.hqStore !== 'undefined' && Array.isArray(window.hqStore.getManagers())) ? window.hqStore.getManagers() : [];
    const currentMgr = State.currentManagerFilter || 'ALL';
    const userName = localStorage.getItem('bp_user_name') || '';
    const userRole = localStorage.getItem('bp_user_role') || 'manager';
    const assignedJson = localStorage.getItem('bp_assigned_artists');
    
    // 담당 아티스트명 추출 (없으면 전체 소속 아티스트 명단 표출)
    const allArtists = (typeof window.hqStore !== 'undefined') ? window.hqStore.getArtists() : [];
    const cleanArtName = (name) => (name || '').replace(/\s*\([^)]*\)/g, '').trim();
    let artistSummary = '';
    if (assignedJson) {
      try {
        const assignedIds = JSON.parse(assignedJson) || [];
        const myArts = allArtists.filter(a => assignedIds.includes(a.id));
        if (myArts.length > 0) {
          artistSummary = myArts.map(a => cleanArtName(a.name)).join(', ');
        }
      } catch(e) {}
    }
    if (!artistSummary && allArtists.length > 0) {
      artistSummary = allArtists.map(a => cleanArtName(a.name)).join(', ');
    }
    if (!artistSummary) artistSummary = '아직 담당 아티스트가 없어요';

    const events = State.calculateDailyEvents(y, m, d);
    const rawSchedules = State.getSchedulesForDate(y, m, d);

    // 배차 차량 정보 추출 (당일 일정의 차량 -> 사용자 지정 차량 -> 기본값)
    const foundVehicle = events.find(e => e.vehicleName)?.vehicleName || 
                         rawSchedules.find(s => s.vehicleName)?.vehicleName || 
                         localStorage.getItem('bp_user_vehicle') || 
                         '';
    const vehicleSummary = foundVehicle;

    let html = `
      <!-- 상단: 담당 아티스트 안내 -->
      <div style="margin-bottom:10px; padding:2px 2px;">
        <div style="font-size:14px; font-weight:700; color:#0f172a; display:flex; align-items:center; gap:5px;">
          <span style="color:#4f46e5; flex-shrink:0;">★</span>
          <span style="color:#4f46e5; flex-shrink:0;">담당:</span>
          <span style="color:#1e293b;">${esc(artistSummary)}</span>
        </div>
      </div>

      <!-- 3. 탭 버튼 -->
      <div style="display:flex; background:rgba(0,0,0,0.04); border-radius:14px; padding:4px; margin-bottom:12px; gap:4px;">
        <div onclick="Home.setTab('schedule')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 0; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; ${this.currentTab === 'schedule' ? 'background:#ffffff; color:#4f46e5; box-shadow:0 2px 8px rgba(0,0,0,0.06);' : 'color:#64748b; background:transparent;'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          회사 스케줄표
        </div>
        <div onclick="Home.setTab('timeline')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 0; border-radius:10px; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s; ${this.currentTab === 'timeline' ? 'background:#ffffff; color:#4f46e5; box-shadow:0 2px 8px rgba(0,0,0,0.06);' : 'color:#64748b; background:transparent;'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          이동 순서
        </div>
      </div>
    `;

    // 본사가 바꾼 일정 중 아직 '확인했습니다'를 안 누른 것 (오늘 이후 전체)
    // 대표·본사 계정으로 매니저 앱에 들어와 있으면 알려 주고, 바로 계정을 바꿀 수 있게
    try {
      const role = localStorage.getItem('bp_user_role');
      if ((role === 'ceo' || role === 'hq_admin') && window.SupabaseClient?.currentUser?.id) {
        html += `<div style="display:flex; align-items:center; gap:10px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:12px; padding:10px 12px; margin:0 0 12px;">
          <span style="flex:1; font-size:13.5px; font-weight:700; color:#3730a3; line-height:1.4;">${esc(localStorage.getItem('bp_user_name') || '대표')} (${role === 'ceo' ? '대표' : '본사'}) 계정으로 보는 중</span>
          <button type="button" onclick="Profile.switchAccount()" style="flex-shrink:0; border:0; background:#4f46e5; color:#fff; font-size:13.5px; font-weight:800; padding:8px 12px; border-radius:9px; cursor:pointer;">매니저로 로그인</button>
        </div>`;
      }
    } catch (e) { }
    html += this.renderAckCards();
    html += this.renderPushCard();

    if (events.length === 0 && rawSchedules.length === 0) {
      html += `
        <div class="tl-empty" onclick="Home.openScheduleRegisterModal()" style="border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-400); cursor:pointer; font-size:14px; font-weight:600; border:2px dashed rgba(79,70,229,0.3); min-height:280px; background:rgba(255,255,255,0.7); text-align:center; padding:20px;">
           <span style="display:inline-flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:14px; background:rgba(79,70,229,0.1); color:#4f46e5; margin-bottom:12px;">
             <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
           </span>
           <span style="font-size:16px; font-weight:700; color:var(--text-100); margin-bottom:4px;">등록된 스케줄이 없습니다.</span>
           <span style="color:#4f46e5; font-size:14px; font-weight:700; display:inline-flex; align-items:center; gap:4px; margin-top:4px;">+ 새 스케줄 등록하기</span>
        </div>
      `;
      return html;
    }

    if (this.currentTab === 'schedule') {
      html += this.renderScheduleGrid(rawSchedules, y, m, d);
    } else {
      html += this.renderManagerRoute(events);
    }

    return html;
  },

  expandedScheduleId: null, // 제자리 상세 보기 토글용 ID

  toggleScheduleDetail(schId) {
    if (this.expandedScheduleId === schId) {
      this.expandedScheduleId = null; // 이미 열려있으면 닫기
    } else {
      this.expandedScheduleId = schId; // 열기
    }
    this.updateRightTimeline();
  },

  renderScheduleGrid(schedules, y, m, d) {
    // 스케줄 시작/종료 시(hour) 파싱
    const timeToHour = (tStr, defaultH = 9) => {
      if (!tStr) return defaultH;
      const [h] = tStr.split(':').map(Number);
      return isNaN(h) ? defaultH : Math.min(23, Math.max(0, h));
    };

    // 시간 순 정렬
    const sortedSchedules = [...schedules].sort((a, b) => {
      const aStart = a.teeOff || a.startTime || '09:00';
      const bStart = b.teeOff || b.startTime || '09:00';
      return aStart.localeCompare(bStart);
    });

    let html = `<div style="padding: 4px 0 40px; position:relative; max-width:340px;">`;

    // 단일 스케줄 카드 렌더링 헬퍼
    const renderCard = (activeSched, hourLabel) => {
      const schId = activeSched.id || `sch_${sortedSchedules.indexOf(activeSched)}`;
      const isExpanded = this.expandedScheduleId === schId;
      const isHQ = activeSched.isHQ;

      const startTime = activeSched.teeOff || activeSched.startTime || '07:30';
      const endTime = activeSched.endTime || '17:00';

      let departureText = '';
      if (activeSched.departure) {
        if (typeof activeSched.departure === 'string') {
          departureText = activeSched.departure;
        } else if (typeof activeSched.departure === 'object') {
          departureText = activeSched.departure.place || activeSched.departure.name || activeSched.departure.address || '';
        }
      }

      const isSecret = activeSched.isSecret === true;
      const canViewSecret = window.AuthPersona ? window.AuthPersona.canViewSecret(activeSched) : true;
      const currentRole = localStorage.getItem('bp_user_role') || 'manager';
      const isStaff = currentRole === 'staff';
      const rawTitle = (activeSched.title || '').replace(/^[🎬🔒📌🏁\s]+/g, '').trim();

      const displayTitle = (isSecret && !canViewSecret) 
        ? '비공개 스케줄 (보안 일정 - 열람 제한)' 
        : (isSecret ? `[극비 보안] ${rawTitle}` : rawTitle);
      
      const displayLocation = (isSecret && !canViewSecret) 
        ? '[비공개 보안 대상]' 
        : (activeSched.location || activeSched.course?.name || '장소 미정');

      const cardBg = isSecret ? (canViewSecret ? 'linear-gradient(135deg, #ffffff, #faf5ff)' : '#f8fafc') : '#ffffff';
      const cardBorderColor = isExpanded ? (isSecret ? '#9333ea' : '#4f46e5') : (isSecret ? '#d8b4fe' : '#cbd5e1');
      const cardBorderLeft = isSecret ? 'border-left:4px solid #9333ea;' : 'border-left:4px solid #4f46e5;';

      const allArtists = (typeof window.hqStore !== 'undefined') ? window.hqStore.getArtists() : [];
      const artObj = allArtists.find(a => a.id === activeSched.artistId) || { name: activeSched.artistName || '아티스트' };

      return `
        <div style="margin-bottom:12px; position:relative;">
          <!-- 시작 시간 텍스트 -->
          <div style="font-size:13px; font-weight:700; color:${isSecret ? '#9333ea' : '#4f46e5'}; margin-bottom:6px;">
            ${esc(hourLabel)}
          </div>

          <!-- 스케줄 카드 -->
          <div onclick="Home.toggleScheduleDetail(${escJs(schId)})" ${isHQ && activeSched.id ? `data-hold-sch="${esc(activeSched.id)}"` : ''}
               style="width:100%; background:${esc(cardBg)}; border-radius:14px; padding:14px 14px 16px; border:1px solid ${esc(cardBorderColor)}; ${esc(cardBorderLeft)} box-shadow:0 2px 10px rgba(0,0,0,0.04); cursor:pointer; transition:all 0.2s ease; box-sizing:border-box;">
            
            <!-- 상단: 시간 & 아티스트 태그 & 상세보기 -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="font-size:13px; font-weight:700; color:${isSecret ? '#9333ea' : '#4f46e5'}; display:flex; align-items:center; gap:4px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>${esc(startTime)} ~ ${esc(endTime)}</span>
                </div>
                <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                  <span style="background:${esc(artObj.color || '#1e293b')}; color:#fff; font-size:13px; font-weight:700; padding:2px 7px; border-radius:5px; display:inline-flex; align-items:center; gap:4px;">
                    ${getArtistTypeIcon(artObj, 11)}
                    <span>${esc(activeSched.artistName || '아티스트')}</span>
                  </span>
                  ${isHQ ? '<span style="background:rgba(79,70,229,0.1); color:#4f46e5; font-size:13px; font-weight:700; padding:1px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="12" y1="22" x2="12" y2="22.01"/></svg>HQ연동</span>' : ''}
                  ${isSecret ? '<span style="background:#f3e8ff; color:#9333ea; font-size:13px; font-weight:700; padding:1px 6px; border-radius:4px; border:1px solid #d8b4fe; display:inline-flex; align-items:center; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Secret</span>' : ''}
                </div>
              </div>

              <div style="font-size:13px; font-weight:700; color:${isExpanded ? (isSecret ? '#9333ea' : '#4f46e5') : '#64748b'}; text-align:right; line-height:1; white-space:nowrap; flex-shrink:0; padding-top:2px;">
                ${isExpanded ? '상세접기 ▲' : '상세보기 ▼'}
              </div>
            </div>

            <!-- 일정 타이틀 -->
            <div style="font-size:14px; font-weight:700; color:${isSecret ? '#581c87' : 'var(--text-100)'}; margin-bottom:6px; line-height:1.35; word-break:keep-all;">
              ${esc(displayTitle)}
            </div>
            
            <!-- 장소 -->
            <div style="font-size:13px; color:#64748b; font-weight:600; line-height:1.3; word-break:keep-all; display:flex; align-items:center; gap:4px;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>${esc(displayLocation)}</span>
            </div>

            <!-- 클릭 시 제자리 확장 상세 정보 -->
            ${isExpanded ? `
              <div style="margin-top:12px; padding-top:12px; border-top:1px dashed ${isSecret ? '#e9d5ff' : '#e2e8f0'}; animation:fadeIn 0.2s ease-in-out;">
                <div style="background:${isSecret ? '#faf5ff' : '#f8fafc'}; border-radius:8px; padding:10px 12px; font-size:13px; color:var(--text-200); display:flex; flex-direction:column; gap:6px; border:1px solid ${isSecret ? '#f3e8ff' : '#f1f5f9'};">
                  ${(isSecret && !canViewSecret) ? `
                    <div style="color:#dc2626; font-weight:700; display:flex; align-items:center; gap:4px;">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>본 일정은 비공개 보안 스케줄로, 담당 배정자 및 경영진 외에는 열람이 제한됩니다.</span>
                    </div>
                  ` : `
                    <div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <strong>매니저:</strong> ${esc(activeSched.managerName || '미지정')}</div>
                    ${!isStaff ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg> <strong>배차:</strong> ${esc(activeSched.vehicleName || '미지정')}</div>` : ''}
                    ${activeSched.shop && activeSched.shop.needed ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg> <strong>샵:</strong> ${esc(activeSched.shop.name)} (${esc(activeSched.shop.durationMin || 90)}분)</div>` : ''}
                    ${departureText ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> <strong>픽업:</strong> ${esc(departureText)}</div>` : ''}
                    ${activeSched.outfit ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg> <strong>의상:</strong> ${esc(activeSched.outfit)}</div>` : ''}
                    ${activeSched.notes ? `<div style="color:#475569; background:#fff; padding:6px 8px; border-radius:4px; border:1px solid #e2e8f0; margin-top:2px; display:flex; align-items:flex-start; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="flex-shrink:0; margin-top:2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> <span><strong>특이사항:</strong> ${esc(activeSched.notes)}</span></div>` : ''}
                  `}
                </div>
                ${!isSecret && isHQ ? `<button type="button" onclick="event.stopPropagation(); window.ScheduleShare && ScheduleShare.open(${escJs(activeSched.id)})" style="margin-top:8px; width:100%; height:38px; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; color:#334155; font-size:13.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  메이크업·스타일리스트에게 일정 공유
                </button>` : ''}
                ${['ceo', 'hq_admin'].includes(currentRole) ? `<div style="display:flex; gap:8px; margin-top:8px;">
                  <button type="button" onclick="event.stopPropagation(); Home.openScheduleRegisterModal(${escJs(activeSched.id)})" style="flex:1; height:40px; border-radius:10px; border:1px solid #c7d2fe; background:#eef2ff; color:#4338ca; font-size:14px; font-weight:700;">✏️ 수정</button>
                  <button type="button" onclick="event.stopPropagation(); Home.deleteScheduleFromApp(${escJs(activeSched.id)})" style="flex:1; height:40px; border-radius:10px; border:1px solid #fecaca; background:#fef2f2; color:#dc2626; font-size:14px; font-weight:700;">🗑️ 삭제</button>
                </div>` : `<div style="margin-top:8px; font-size:13px; color:#64748b; text-align:center;">일정 수정·삭제는 본사에 요청해 주세요 (로드톡)</div>`}
              </div>
            ` : ''}

          </div>
        </div>
      `;
    };

    // 첫 스케줄의 시작 시간(Hour)부터 타임라인 시작 (이전 새벽 시간 00:00~06:00 등은 숨김)
    const firstStartHour = sortedSchedules.length > 0 ? timeToHour(sortedSchedules[0].teeOff || sortedSchedules[0].startTime, 7) : 7;
    const renderedIds = new Set();
    let currentHour = firstStartHour;

    while (currentHour <= 23) {
      const hourStr = String(currentHour).padStart(2, '0') + ':00';

      // 현재 시간에 시작하는 스케줄 목록
      const matchingScheds = sortedSchedules.filter(s => {
        const sHour = timeToHour(s.teeOff || s.startTime);
        return sHour === currentHour;
      });

      if (matchingScheds.length > 0) {
        // 해당 시간에 시작하는 모든 스케줄 렌더링
        matchingScheds.forEach(s => {
          renderedIds.add(s.id);
          html += renderCard(s, hourStr);
        });
        currentHour++;
      } else {
        // 현재 시간에 시작하는 스케줄이 없는 경우
        // 진행 중인 다른 스케줄의 시간대인지 확인
        const isCovered = sortedSchedules.some(s => {
          const sHour = timeToHour(s.teeOff || s.startTime);
          const eHour = timeToHour(s.endTime, sHour + 1);
          return sHour < currentHour && currentHour < eHour;
        });

        // 진행 중인 스케줄이 없을 때만 빈 시간 표시선 렌더링
        if (!isCovered) {
          html += `
            <div style="margin-bottom:8px; position:relative;">
              <div style="font-size:13px; font-weight:700; color:#64748b; margin-bottom:4px;">
                ${esc(hourStr)}
              </div>
              <div style="border-bottom:1px solid #f1f5f9; margin-bottom:6px;"></div>
            </div>
          `;
        }
        currentHour++;
      }
    }

    // 24시 이후 또는 예외적인 시간으로 인해 누락된 스케줄이 있다면 추가 렌더링
    sortedSchedules.forEach(s => {
      if (!renderedIds.has(s.id)) {
        const startTime = s.teeOff || s.startTime || '09:00';
        html += renderCard(s, startTime);
      }
    });

    html += `
      <div onclick="Home.openScheduleRegisterModal()" style="text-align:center; padding:13px; background:#ffffff; border:2px dashed #4f46e5; border-radius:12px; color:#4f46e5; font-size:14px; font-weight:700; cursor:pointer; margin-top:16px; box-shadow:0 2px 6px rgba(79,70,229,0.06); display:flex; align-items:center; justify-content:center; gap:6px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        스케줄 등록
      </div>
    </div>`;

    return html;
  },

  renderManagerRoute(events) {
    this.currentEvents = events;
    let html = '<div style="padding: 8px 4px 40px;">';
    
    // 아티스트/차량 요약 칸은 스케줄표와 겹쳐서 없앰. [+ 스케줄 추가]는 '지금 할 일' 카드 오른쪽 위(시계 옆)에 둔다
    const addRow = `
      <div style="display:flex; justify-content:flex-end; margin:0 0 8px;">
        <button type="button" onclick="Home.openScheduleRegisterModal()" style="display:inline-flex; align-items:center; gap:5px; background:#4f46e5; color:#fff; border:0; padding:8px 12px; border-radius:9px; font-size:13px; font-weight:700; cursor:pointer;">+ 스케줄 추가</button>
      </div>`;

    // 타임라인 동일 시간 및 동일 라벨 단계 중복 제거 (Deduplication)
    const seenEvents = new Set();
    const uniqueEvents = (events || []).filter(ev => {
      if (!ev) return false;
      const key = `${ev.time}_${(ev.title || '').trim()}`;
      if (seenEvents.has(key)) return false;
      seenEvents.add(key);
      return true;
    });

    // ── 지금 할 일 카드: 이동중인 단계가 있으면 그것, 없으면 아직 안 끝난 첫 단계를 크게 보여 준다 ──
    try {
      const pending = uniqueEvents.filter(e => !e.done && e.stepCategory !== 'rest');
      const nowEv = pending.find(e => e.moving === true) || pending[0];
      if (!nowEv) html += addRow;
      if (uniqueEvents.length && !nowEv) {
        html += `<div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:16px; padding:16px; margin-bottom:14px; text-align:center; font-size:15px; font-weight:700; color:#047857;">오늘 일정이 모두 끝났습니다. 수고하셨습니다.</div>`;
      } else if (nowEv) {
        const raw = String(nowEv.title || '').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
        const bm = raw.match(/^\[([^\]]+)\]\s*(.*)$/);
        const tag = bm ? bm[1] : '다음 일정';
        const name = (bm ? bm[2] : raw) || raw;
        const tt = raw;
        let dest = '';
        if (tt.includes('숙소 픽업') || tt.includes('픽업 및 출발')) dest = nowEv.shopAddress || nowEv.shopName || nowEv.locationAddress || nowEv.location || '';
        else if (tt.includes('복귀') || tt.includes('철수')) dest = nowEv.departureAddress || nowEv.departurePlace || '';
        else dest = nowEv.locationAddress || nowEv.location || '';
        if (/^\[(대기|식사|기상)/.test(tt) || nowEv.stepCategory === 'rest') dest = '';   // 기상·대기 단계는 길안내 없음
        const isDrive = nowEv.stepCategory !== 'rest' && !/^\[(대기|식사|기상)/.test(tt) && (tt.includes('출발') || tt.includes('이동') || tt.includes('픽업') || tt.includes('철수') || nowEv.moving === true);
        const canAct = nowEv.isHQ && nowEv.hqScheduleId;
        const nowDay = canAct ? Home._stepDay(nowEv.hqScheduleId, nowEv.timelineIdx) : 'today';
        let contact = null;
        try {
          const sch = window.hqStore?.getSchedules().find(s => s.id === nowEv.hqScheduleId);
          const ph = sch && (sch.contactPhone || sch.contact?.phone);
          if (ph) contact = { name: sch.contactName || sch.contact?.name || '현장 담당자', phone: String(ph) };
        } catch (e) { }
        const B = 'min-height:40px; border-radius:10px; font-size:14.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; border:0;';
        const idx = nowEv.timelineIdx;
        html += `
          <div style="background:#fff; color:#111827; border:1.5px solid #c7d2fe; border-radius:16px; padding:12px 13px; margin-bottom:12px; box-shadow:0 4px 14px rgba(79,70,229,.10);">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:4px;">
              <span style="font-size:13px; font-weight:700; color:#4f46e5; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">지금 할 일 · ${esc(tag)}</span>
              <span style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                <span style="font-size:13px; font-weight:700; background:#eef2ff; color:#4338ca; padding:4px 9px; border-radius:8px;">${nowEv.forNextDay ? '내일 일정 · ' : nowEv.dayOffset === -1 ? '전날 ' : nowEv.dayOffset === 1 ? '다음날 ' : ''}${esc(nowEv.time || '')}</span>
                <button type="button" onclick="Home.openScheduleRegisterModal()" style="font-size:13px; font-weight:800; background:#4f46e5; color:#fff; border:0; padding:4px 9px; border-radius:8px; cursor:pointer; white-space:nowrap;">+ 스케줄 추가</button>
              </span>
            </div>
            <div style="font-size:17px; font-weight:700; line-height:1.3; margin-bottom:2px;">${esc(name)}</div>
            ${dest ? `<div style="font-size:13px; color:#6b7280; margin-bottom:9px;">${esc(dest)}</div><div data-venue="${esc(dest)}" data-venue-compact style="margin:-4px 0 9px;"></div>` : '<div style="height:8px;"></div>'}
            ${dest ? `<div style="display:flex; gap:6px; margin-bottom:6px;">
              <button type="button" onclick="U.openNavigation(${escJs(dest)}, '', 'tmap')" style="${B} flex:1; background:#f8fafc; border:1px solid #e2e8f0; color:#111827;"><span style="width:10px;height:10px;border-radius:3px;background:#111;display:inline-block"></span>TMAP</button>
              <button type="button" onclick="U.openNavigation(${escJs(dest)}, '', 'kakao')" style="${B} flex:1; background:#f8fafc; border:1px solid #e2e8f0; color:#111827;"><span style="width:10px;height:10px;border-radius:3px;background:#fee500;border:1px solid #e5cf00;display:inline-block"></span>카카오내비</button>
            </div>` : ''}
            ${canAct ? `<div style="display:flex; gap:6px;">
              ${nowDay === 'future' ? `<div style="flex:1; text-align:center; font-size:13.5px; font-weight:700; color:#64748b; padding:10px 0;">일정 당일에 출발·도착을 누를 수 있어요</div>` : nowDay === 'past' ? `<button type="button" onclick="Home.setHQRouteStatus(${escJs(nowEv.hqScheduleId)}, ${idx}, '완료')" style="${B} flex:1; background:#4f46e5; color:#fff;">완료</button>` : `
              ${isDrive ? `<button type="button" onclick="Home.setHQRouteStatus(${escJs(nowEv.hqScheduleId)}, ${idx}, '이동중')" style="${B} flex:1; background:#fff; border:1.5px solid ${nowEv.moving ? '#f59e0b' : '#c7d2fe'}; color:${nowEv.moving ? '#b45309' : '#4f46e5'};">${nowEv.moving ? '● 이동중' : '출발'}</button>` : ''}
              <button type="button" onclick="${isDrive ? `Home.arriveStep(${escJs(nowEv.hqScheduleId)}, ${idx}, ${escJs(name)})` : `Home.setHQRouteStatus(${escJs(nowEv.hqScheduleId)}, ${idx}, '완료')`}" style="${B} flex:1; background:#4f46e5; color:#fff;">${isDrive ? '도착' : '완료'}</button>
              `}
            </div>` : ''}
            ${contact ? `<a href="tel:${esc(contact.phone.replace(/[^0-9+]/g, ''))}" style="${B} margin-top:6px; background:#f8fafc; border:1px solid #e2e8f0; color:#334155; text-decoration:none; font-size:13px; min-height:36px;">${esc(contact.name)} 전화 ${esc(contact.phone)}</a>` : ''}
          </div>`;
      }
    } catch (e) { console.warn('지금 할 일 카드 오류', e); }

    // 이미 끝난 앞쪽 단계는 접어 두고(지우지 않음), 다음에 할 단계가 맨 위에 오게 한다
    const firstPending = uniqueEvents.findIndex(e => !e.done);
    const foldCount = firstPending > 0 ? firstPending : 0;
    const listStart = html.length;
    let foldEnd = -1;
    uniqueEvents.forEach((ev, idx) => {
      if (idx === foldCount && foldCount > 0) foldEnd = html.length;
      const isLast = idx === uniqueEvents.length - 1;
      const isDone = ev.done || false;
      const isHQ = ev.isHQ;
      
      // 이동중: 단계별 개별 상태 (ev.moving) 사용 — 전체 스케줄 상태 아님
      const isMoving = (ev.moving === true) && !isDone;

      let dotBg = isDone ? '#10b981' : isMoving ? '#f59e0b' : '#4f46e5';
      let cardBorder = isDone ? 'border-left: 4px solid #10b981;' : isMoving ? 'border-left: 4px solid #f59e0b;' : 'border-left: 4px solid #4f46e5;';

      // 운전/이동 단계 여부 판별 (체류/스타일링/메인 행사 단계에서는 네비 버튼 숨김)
      const titleText = (ev.title || '');
      const isStayStep = ev.stepCategory === 'rest' || /^\[(대기|식사|기상)/.test(titleText) || titleText.includes('도착 및 스타일링') || titleText.includes('스타일링') || titleText.includes('[메인 일정]') || titleText.includes('녹음') || titleText.includes('레슨');
      const isDriveStep = !isStayStep && (titleText.includes('출발') || titleText.includes('이동') || titleText.includes('픽업') || titleText.includes('철수') || ev.moving === true);

      // 목적지 추정 (길안내용)
      let destinationTarget = '';
      if (titleText.includes('숙소 픽업') || titleText.includes('픽업 및 출발')) {
        destinationTarget = ev.shopAddress || ev.shopName || ev.locationAddress || ev.location || '';
      } else if (titleText.includes('현장') || titleText.includes('이동 출발')) {
        destinationTarget = ev.locationAddress || ev.location || ev.title.replace(/.*현장\(/, '').replace(/\).*/, '') || '행사장';
      } else if (titleText.includes('복귀') || titleText.includes('철수')) {
        destinationTarget = ev.departureAddress || ev.departurePlace || '숙소';
      } else {
        destinationTarget = ev.locationAddress || ev.location || ev.title;
      }

      // 1. 타이틀 및 태그 스마트 분류 사전 처리
      let rawTitle = (ev.title || '').trim();
      const cleanTitle = rawTitle.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim();
      
      const getLineIcon = (type) => {
        const strokeStyle = 'width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"';
        if (type === 'shop') return `<svg ${strokeStyle}><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg>`;
        if (type === 'car') return `<svg ${strokeStyle}><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>`;
        if (type === 'main') return `<svg ${strokeStyle}><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`;
        if (type === 'finish') return `<svg ${strokeStyle}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
        if (type === 'rest') return `<svg ${strokeStyle}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
        return `<svg ${strokeStyle}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      };

      let tag = '';
      let restText = cleanTitle;
      let badgeStyle = 'background:#f1f5f9; color:#475569; border:1px solid #cbd5e1;';
      let iconType = 'info';

      const bracketMatch = cleanTitle.match(/^\[([^\]]+)\]\s*(.*)$/);
      if (bracketMatch) {
        tag = bracketMatch[1];
        restText = bracketMatch[2] || '';
      }

      const lowerText = cleanTitle.toLowerCase();
      if (tag.includes('헤어') || tag.includes('메이크업') || lowerText.includes('도착 및 스타일링') || lowerText.includes('헤메') || lowerText.includes('스타일링')) {
        tag = '헤어·메이크업';
        badgeStyle = 'background:rgba(139, 92, 246, 0.15); color:#7c3aed; border:1px solid rgba(139, 92, 246, 0.35);';
        iconType = 'shop';
        restText = restText.replace(/^\[?헤어[\/·]메이크업\]?\s*/, '');
      } else if (tag.includes('픽업') || lowerText.includes('픽업 및 출발')) {
        tag = '픽업 출발';
        badgeStyle = 'background:rgba(59, 130, 246, 0.15); color:#2563eb; border:1px solid rgba(59, 130, 246, 0.35);';
        iconType = 'car';
        restText = restText.replace(/^\[?픽업 출발\]?\s*/, '');
      } else if (tag.includes('이동') || tag.includes('출발') || lowerText.includes('이동 출발') || lowerText.includes('출발 및 이동')) {
        tag = '현장 이동';
        badgeStyle = 'background:rgba(59, 130, 246, 0.15); color:#2563eb; border:1px solid rgba(59, 130, 246, 0.35);';
        iconType = 'car';
        restText = restText.replace(/^\[?현장 이동\]?\s*/, '');
      } else if (tag.includes('철수') || tag.includes('복귀') || lowerText.includes('철수') || lowerText.includes('복귀 이동')) {
        tag = '현장 철수';
        badgeStyle = 'background:rgba(16, 185, 129, 0.15); color:#059669; border:1px solid rgba(16, 185, 129, 0.35);';
        iconType = 'finish';
        restText = restText.replace(/^\[?현장 철수\]?\s*/, '');
      } else if (tag.includes('휴식') || tag.includes('식사') || tag.includes('대기') || lowerText.includes('대기/휴식') || lowerText.includes('식사 및 이동')) {
        tag = '대기·휴식';
        badgeStyle = 'background:rgba(245, 158, 11, 0.15); color:#d97706; border:1px solid rgba(245, 158, 11, 0.35);';
        iconType = 'rest';
        restText = restText.replace(/^\[?(대기\/휴식|식사\/정비|대기·휴식)\]?\s*/, '');
      } else if (tag.includes('메인') || lowerText.includes('메인 일정') || lowerText.includes('방송') || lowerText.includes('공연') || lowerText.includes('촬영')) {
        tag = '메인 일정';
        badgeStyle = 'background:rgba(99, 102, 241, 0.2); color:#4f46e5; border:1px solid rgba(99, 102, 241, 0.4);';
        iconType = 'main';
        restText = restText.replace(/^\[?메인 일정\]?\s*/, '');
      }
      if (!tag) tag = '일정';

      html += `
        <div id="route-step-${esc(ev.hqScheduleId || '')}-${esc(ev.timelineIdx ?? idx)}" style="display:flex; position:relative; margin-bottom:16px;">
          <!-- 좌측 컬럼: Vertical Track Line & Dot(O) & 시간 -->
          <div style="display:flex; flex-direction:column; align-items:center; width:48px; flex-shrink:0; position:relative;">
            <!-- Vertical Track Line -->
            ${!isLast ? `<div style="position:absolute; top:20px; bottom:-22px; left:23px; width:2px; background:${isDone ? '#10b981' : isMoving ? '#f59e0b' : '#e2e8f0'}; z-index:1;"></div>` : ''}
            
            <!-- Dot (O) -->
            <div style="width:20px; height:20px; border-radius:50%; background:#fff; border:3px solid ${esc(dotBg)}; position:relative; z-index:2; display:flex; align-items:center; justify-content:center; color:${esc(dotBg)};">
              ${isDone ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : isMoving ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/></svg>' : ''}
            </div>
            
            <!-- 시간 (O 아래에 배치 - 크기 및 선명도 확대) -->
            <div style="margin-top:6px; font-size:14px; font-weight:700; color:${isDone ? '#10b981' : isMoving ? '#d97706' : '#0f172a'}; text-align:center; white-space:nowrap; background:#ffffff; padding:2px 4px; border-radius:6px; border:1.5px solid ${isDone ? '#10b981' : isMoving ? '#f59e0b' : '#cbd5e1'}; z-index:2; letter-spacing:-0.3px; box-shadow:0 1px 3px rgba(0,0,0,0.04);">
              ${esc(ev.time)}
            </div>
            ${ev.forNextDay ? '<div style="margin-top:3px; font-size:10.5px; font-weight:800; color:#7c3aed; white-space:nowrap;">내일 일정</div>' : ev.dayOffset === -1 ? '<div style="margin-top:3px; font-size:10.5px; font-weight:800; color:#7c3aed; white-space:nowrap;">전날</div>' : ev.dayOffset === 1 ? '<div style="margin-top:3px; font-size:10.5px; font-weight:800; color:#7c3aed; white-space:nowrap;">다음날</div>' : ''}
          </div>
          
          <!-- Route Card -->
          <div ${isHQ && ev.hqScheduleId && tag === '메인 일정' ? `data-hold-sch="${esc(ev.hqScheduleId)}"` : ''} style="flex:1; margin-left:8px; background:#fff; border-radius:14px; padding:12px 14px; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.04); ${esc(cardBorder)} position:relative;">
             
             <!-- 카드 1행: 좌측 카테고리 뱃지 & 우측 [이동중] [완료] 버튼 (같은 라인에 배치) -->
             <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; margin-bottom:8px; gap:6px 8px;">
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap:6px; min-width:0;">
                  <span style="display:inline-flex; align-items:center; gap:4px; padding:3px 9px; border-radius:7px; font-size:13px; font-weight:700; letter-spacing:-0.2px; white-space:nowrap; ${esc(badgeStyle)}">
                    ${getLineIcon(iconType)}
                    <span>${esc(tag)}</span>
                  </span>
                  ${isDone && ev.doneAt ? `
                    <span style="display:inline-flex; align-items:center; gap:3px; white-space:nowrap; background:#ecfdf5; color:#059669; font-size:13px; font-weight:700; padding:2px 6px; border-radius:5px; border:1px solid rgba(16,185,129,0.3);">
                      ${esc(ev.doneAt)} 완료
                    </span>
                  ` : ''}
                </div>
                
                ${isHQ && ev.hqScheduleId && Home._stepDay(ev.hqScheduleId, ev.timelineIdx) === 'future' ? `
                  <span style="font-size:13px; font-weight:700; color:#64748b; white-space:nowrap; flex-shrink:0;">당일에 표시</span>
                ` : isHQ && ev.hqScheduleId ? `
                  <div style="display:flex; align-items:center; gap:5px; flex-shrink:0;">
                    ${isDriveStep && Home._stepDay(ev.hqScheduleId, ev.timelineIdx) === 'today' ? `
                      <!-- 이동중 버튼 (더 진하고 뚜렷하게) -->
                      <button type="button"
                        onclick="Home.setHQRouteStatus(${escJs(ev.hqScheduleId)}, ${ev.timelineIdx}, '이동중')"
                        style="white-space:nowrap; padding:4px 10px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.15s;
                               ${isMoving
                                  ? 'border:1.5px solid #f59e0b; background:#fff; color:#b45309;'
                                  : 'border:1px solid #cbd5e1; background:#ffffff; color:#475569;'
                               }">
                        이동중
                      </button>
                    ` : ''}
                    <!-- 완료 버튼 (더 진하고 뚜렷하게) -->
                    <button type="button"
                      onclick="Home.setHQRouteStatus(${escJs(ev.hqScheduleId)}, ${ev.timelineIdx}, '완료')"
                      style="white-space:nowrap; padding:4px 10px; border-radius:6px; font-size:13px; font-weight:700; cursor:pointer; transition:all 0.15s;
                             ${isDone
                                ? 'border:1.5px solid #4f46e5; background:#eef2ff; color:#4338ca;'
                                : 'border:1px solid #cbd5e1; background:#ffffff; color:#475569;'
                             }">
                      완료
                    </button>
                  </div>
                ` : ''}
             </div>
             
             <!-- 카드 2행: Title 텍스트 -->
             <div style="font-size:15px; font-weight:700; line-height:1.35; ${isDone ? 'text-decoration:line-through; color:#94a3b8;' : 'color:var(--text-100);'} margin-bottom:6px;">
               ${esc(restText || cleanTitle)}
             </div>
             
             <!-- Description / Notes & 역산 정보 -->
             ${(() => {
               if (!ev.desc) return '';
               let cleanDesc = ev.desc;
               if (isDriveStep) {
                 cleanDesc = cleanDesc.replace(/담당:\s*[^()]+\s*\(/g, '(')
                                      .replace(/배차:\s*[^()]+\s*\(/g, '(')
                                      .trim();
                 const travelMatch = cleanDesc.match(/이동\s*약\s*(\d+)분/);
                 const bufferMatch = cleanDesc.match(/버퍼\s*(\d+)분/);
                 if (travelMatch) {
                   const tMin = parseInt(travelMatch[1], 10) || 0;
                   const bMin = bufferMatch ? parseInt(bufferMatch[1], 10) : 0;
                   const totalMin = tMin + bMin;
                   const bufferText = bMin > 0 ? ` + 버퍼 ${bMin}분 배정 ` : ' ';
                   const basis = (cleanDesc.match(/·\s*([^·]+?)\)\s*$/) || [])[1];   // 예: '11/7(토) 13:20 도착 기준 교통 예측'
                   cleanDesc = `이동 약 ${tMin}분${bufferText}(예상 소요 약 ${totalMin}분${basis ? ' · ' + basis.trim() : ''})`;
                 }
               }
               return `
                 <div style="font-size:13px; line-height:1.45; margin-top:4px; ${isDriveStep ? 'background:#f8fafc; border:1px solid #e2e8f0; padding:6px 10px; border-radius:8px; color:#334155; font-weight:600;' : 'color:var(--text-400);'}">
                   ${isDriveStep ? '<span style="color:#4f46e5; font-weight:700; margin-right:4px;">⏱️ 동선 역산 :</span>' : ''}${esc(cleanDesc)}
                 </div>
               `;
             })()}

             ${(() => {
               // 현장 메모: 메인 일정(현장)·헤어메이크업(샵) 단계에 그 장소의 메모를 보여 줌
               const place = titleText.includes('[메인 일정]') ? (ev.locationAddress || ev.location || '')
                 : (titleText.includes('헤어') || titleText.includes('메이크업')) ? (ev.shopAddress || ev.shopName || '') : '';
               return place && !ev.isSecretHidden ? `<div data-venue="${esc(place)}"></div>` : '';
             })()}

              <!-- 하단: [티맵] [카카오] 네비게이션 버튼 (이동 단계에서만 표시) -->
              ${isDriveStep ? `
                <div style="margin-top:10px; padding-top:8px; border-top:1px dashed rgba(0,0,0,0.06); display:flex; justify-content:flex-end; align-items:center;">
                  <div style="display:flex; align-items:center; gap:6px; margin-left:auto; flex:1; max-width:180px; justify-content:flex-end;">
                    <button type="button" onclick="U.openNavigation('${destinationTarget.replace(/'/g, "\\'")}', '', 'tmap')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 0; border-radius:6px; background:#f8fafc; color:#111827; font-size:13px; font-weight:700; border:1px solid #e2e8f0; cursor:pointer;" title="티맵 길안내">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#111111" style="margin-top:-1px"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16zM11.99 1.5L2.5 9l9.49 7.5L21.5 9l-9.51-7.5z"/></svg>
                      TMAP
                    </button>
                    <button type="button" onclick="U.openNavigation('${destinationTarget.replace(/'/g, "\\'")}', '', 'kakao')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 0; border-radius:6px; background:#f8fafc; color:#111827; font-size:13px; font-weight:700; border:1px solid #e2e8f0; cursor:pointer;" title="카카오내비 길안내">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#e5c100" style="margin-top:-1px"><path d="M12 3c-5.523 0-10 3.553-10 7.938 0 2.825 1.83 5.303 4.606 6.744l-1.01 3.7c-.053.195.166.353.332.227l4.316-2.82c.575.08 1.162.124 1.756.124 5.523 0 10-3.553 10-7.938C22 6.553 17.523 3 12 3z"/></svg>
                      카카오내비
                    </button>
                  </div>
                </div>
              ` : ''}

          </div>
        </div>
      `;
    });

    if (foldCount > 0 && foldEnd > listStart) {
      const doneHtml = html.slice(listStart, foldEnd);
      const open = !!this._showDoneSteps;
      const realDone = uniqueEvents.slice(0, foldCount).filter(e => e.stepCategory !== 'rest').length || foldCount;
      html = html.slice(0, listStart) + `
        <button type="button" onclick="Home._showDoneSteps=!Home._showDoneSteps; Home.updateRightTimeline ? Home.updateRightTimeline() : Home.render();" style="display:flex; align-items:center; gap:8px; width:100%; margin:0 0 12px; padding:10px 14px; border-radius:12px; border:1px solid #d1fae5; background:#f0fdf4; color:#047857; font-size:14px; font-weight:700; cursor:pointer; text-align:left;">
          <span style="display:inline-flex; width:20px; height:20px; border-radius:50%; background:#10b981; color:#fff; align-items:center; justify-content:center; font-size:13px;">✓</span>
          <span style="flex:1;">완료된 단계 ${realDone}개</span>
          <span style="color:#059669; font-size:13px;">${open ? '접기 ▴' : '보기 ▾'}</span>
        </button>
        <div style="${open ? '' : 'display:none;'}">${doneHtml}</div>` + html.slice(foldEnd);
    }

    html += '</div>';
    return html;
  },

  // 지금 할 일 카드의 [도착]: 단계 완료 + 본사에 도착 보고(로드톡 → 본사 푸시)
  // ── "확인했습니다" 카드 ──
  // ── 알림 켜기 안내: 알림을 받는 매니저가 없으면 출발·변경 알림이 아무에게도 안 감 ──
  renderPushCard() {
    setTimeout(() => this.fillPushCard(), 0);
    return '<div id="home-push-card"></div>';
  },
  async fillPushCard() {
    const box = document.getElementById('home-push-card');
    if (!box) return;
    box.innerHTML = '';
    try {
      // 아이폰·안드로이드 앱은 앱이 직접 알림을 예약하므로 안내 불필요
      if (window.webkit?.messageHandlers?.roadplanner || window.RoadPlannerAndroid) return;
      if (!window.SupabaseClient?.currentUser || !window.Chat?.pushState) return;
      try { if (Date.now() - Number(localStorage.getItem('rp_push_card_later') || 0) < 3 * 86400e3) return; } catch (e) { }
      const st = await window.Chat.pushState();
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
      let body = '', btn = '';
      if (st === 'off') {
        body = '출발 15분 전·본사 일정 변경·로드톡 메시지를 앱을 닫아도 알려 드려요.';
        btn = '<button type="button" onclick="Home.enablePushFromCard(this)" style="flex:1; min-height:42px; border:0; border-radius:10px; background:#4f46e5; color:#fff; font-size:15px; font-weight:800;">알림 켜기</button>';
      } else if (st === 'unsupported' && ios && !standalone) {
        body = '아이폰은 사파리 아래쪽 <b>공유 버튼 → 홈 화면에 추가</b>로 설치한 뒤, 그 앱에서 알림을 켤 수 있어요.';
      } else if (st === 'denied') {
        body = '알림이 막혀 있어요. 휴대폰 <b>설정 → 알림</b>에서 이 앱(또는 브라우저)의 알림을 허용해 주세요.';
      } else return;
      box.innerHTML = `
        <div style="background:#eef2ff; border:1.5px solid #c7d2fe; border-radius:14px; padding:12px 14px; margin:0 0 12px;">
          <div style="font-size:15px; font-weight:800; color:#312e81;">🔔 알림을 켜 주세요</div>
          <div style="font-size:13.5px; color:#3730a3; margin-top:4px; line-height:1.5; word-break:keep-all;">${body}</div>
          <div style="display:flex; gap:8px; margin-top:10px;">
            ${btn}
            <button type="button" onclick="Home.laterPushCard()" style="${btn ? 'width:88px;' : 'flex:1;'} min-height:42px; border:1px solid #c7d2fe; border-radius:10px; background:#fff; color:#4338ca; font-size:14px; font-weight:700;">나중에</button>
          </div>
        </div>`;
    } catch (e) { box.innerHTML = ''; }
  },
  async enablePushFromCard(btn) {
    if (btn) { btn.disabled = true; btn.textContent = '켜는 중…'; }
    await window.Chat?.enablePush?.();
    this.fillPushCard();
  },
  laterPushCard() {
    try { localStorage.setItem('rp_push_card_later', String(Date.now())); } catch (e) { }
    const box = document.getElementById('home-push-card'); if (box) box.innerHTML = '';
  },

  renderAckCards() {
    try {
      const me = window.SupabaseClient?.currentUser?.id;
      const list = me && window.hqStore?.getPendingAcks ? window.hqStore.getPendingAcks(me) : [];
      if (!list.length) return '';
      const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
      const cards = list.slice(0, 5).map(s => {
        const st = window.hqStore.ackState(s);
        const d = new Date(s.date + 'T00:00:00');
        const when = (isNaN(d) ? s.date : `${d.getMonth() + 1}/${d.getDate()}(${DAYS[d.getDay()]})`) + (s.startTime ? ' ' + s.startTime : '');
        const isNew = /^\[일정 등록\]/.test(st.request.label || '');
        const cancel = ['취소', 'cancelled'].includes(s.status);
        const tag = cancel ? '일정 취소' : isNew ? '새 일정' : '일정 변경';
        const detail = isNew ? (s.location || '') : String(st.request.label || '').replace(/^\[[^\]]+\]\s*/, '');
        const title = s.isSecret ? '🔒 비공개 일정' : `${s.artistName ? s.artistName + ' · ' : ''}${s.title || '일정'}`;
        return `
          <div style="background:#fff; border:1.5px solid ${cancel ? '#fecaca' : '#fdba74'}; border-radius:14px; padding:12px 14px; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:6px; font-size:13px; font-weight:800; color:${cancel ? '#dc2626' : '#c2410c'};">
              <span style="background:${cancel ? '#fee2e2' : '#ffedd5'}; padding:2px 8px; border-radius:6px;">${tag}</span>
              <span style="color:#64748b; font-weight:700;">${esc(when)}</span>
            </div>
            <div style="font-size:15.5px; font-weight:800; color:#0f172a; margin-top:6px; line-height:1.35;">${esc(title)}</div>
            ${detail && !s.isSecret ? `<div style="font-size:13.5px; color:#475569; margin-top:4px; line-height:1.45; word-break:keep-all;">${esc(detail)}</div>` : ''}
            <button type="button" onclick="Home.ackSchedule(${escJs(s.id)}, this)" style="margin-top:10px; width:100%; min-height:42px; border:0; border-radius:10px; background:#4f46e5; color:#fff; font-size:15px; font-weight:800; cursor:pointer;">확인했습니다</button>
          </div>`;
      }).join('');
      return `
        <div style="margin:0 0 12px;">
          <div style="font-size:14px; font-weight:800; color:#0f172a; margin:0 2px 8px; display:flex; align-items:center; gap:6px;">📢 본사 변경 확인 <span style="background:#f97316; color:#fff; font-size:13px; padding:1px 8px; border-radius:999px;">${list.length}</span></div>
          ${cards}
          ${list.length > 5 ? `<div style="font-size:13px; color:#64748b; text-align:center;">외 ${list.length - 5}건</div>` : ''}
        </div>`;
    } catch (e) { console.warn('확인 카드 표시 실패', e); return ''; }
  },

  async ackSchedule(id, btn) {
    if (btn) { btn.disabled = true; btn.textContent = '보내는 중…'; }
    try {
      await window.hqStore.ackSchedule(id);
      U.toast('본사에 확인을 보냈어요.');
      U.haptic && U.haptic();
    } catch (e) {
      U.toast(e?.localSaved ? '확인을 저장했어요. 연결되면 본사에 전달됩니다.' : '확인을 보내지 못했어요. 다시 눌러 주세요.');
    }
    this.render && this.render();
  },

  async arriveStep(hqId, stepIdx, name) {
    this.setHQRouteStatus(hqId, stepIdx, '완료');
    try {
      if (!window.Chat || !window.Chat.available() || window.Chat.isHq()) return;
      const now = new Date();
      const hm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      let artist = '';
      try { artist = (window.hqStore.getSchedules().find(s => s.id === hqId) || {}).artistName || ''; } catch (e) { }
      await window.Chat.sendNotice({ title: '도착 보고', content: `${name}${artist ? ' · ' + artist : ''} (${hm} 도착)` });
      U.toast('📍 본사에 도착 보고를 보냈습니다.');
    } catch (e) { U.toast('도착은 기록됐지만 본사 알림은 보내지 못했습니다.'); }
  },

  // 동선 타임라인에서 [이동중] 또는 [완료] 선택 시 본사 포털과 실시간 연동 및 타임스탬프 기록
  // 이 단계의 실제 날짜가 오늘보다 앞(past) / 오늘(today) / 뒤(future)인지 (전날 밤 픽업 같은 단계도 반영)
  _stepDay(hqId, stepIdx) {
    try {
      const sch = (window.hqStore?.getSchedules?.() || []).find(s => s.id === hqId);
      if (!sch || !sch.date) return 'today';
      const offs = State.stepDayOffsets(sch.timeline || [], sch.startTime);
      const d = new Date(sch.date + 'T12:00:00');
      d.setDate(d.getDate() + (offs[stepIdx] || 0));
      const ymd = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
      const a = ymd(d), t = ymd(new Date());
      return a < t ? 'past' : a > t ? 'future' : 'today';
    } catch (e) { return 'today'; }
  },

  setHQRouteStatus(hqId, stepIdx, targetStatus) {
    if (typeof window.hqStore === 'undefined') return;
    const day = Home._stepDay(hqId, stepIdx);
    if (day === 'future') { U.toast('아직 그날이 아니에요. 이동중·완료는 일정 당일에 누를 수 있어요.'); return; }
    if (day === 'past' && targetStatus !== '완료') { U.toast('지난 일정은 [완료]만 누를 수 있어요.'); return; }

    const schedules = window.hqStore.getSchedules();
    const sch = schedules.find(s => s.id === hqId);
    if (!sch) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (targetStatus === '완료') {
      if (sch.timeline && sch.timeline[stepIdx] !== undefined) {
        sch.timeline[stepIdx].done = true;
        sch.timeline[stepIdx].moving = false; // 완료 시 이동중 해제
        sch.timeline[stepIdx].doneAt = timeStr; // 현장 완료 시각 기록
      }
      // 모든 단계가 완료되었으면 스케줄 전체 상태도 '완료'
      const allDone = sch.timeline && sch.timeline.every(t => t.done);
      const newStatus = allDone ? '완료' : (sch.status === '예정' ? '진행중' : sch.status);
      window.hqStore.updateSchedule(hqId, { timeline: sch.timeline, status: newStatus });
      
      // 타임스탬프 히스토리 로그 저장
      const stepName = sch.timeline?.[stepIdx]?.label || `${stepIdx + 1}단계`;
      window.hqStore.addStatusLog(hqId, {
        label: `[${stepName}] 현장 완료 (${timeStr})`,
        status: newStatus,
        stepIdx: stepIdx
      });

      U.toast(`✅ [${stepName}] 단계 완료 (${timeStr}) 기록 완료`);
    } else if (targetStatus === '이동중') {
      if (sch.timeline) {
        const isAlreadyMoving = sch.timeline[stepIdx]?.moving === true;

        if (isAlreadyMoving) {
          // ★ 이미 이동중이면 → 토글 OFF (비활성화)
          sch.timeline[stepIdx].moving = false;
          // 다른 이동중 단계도 없으면 전체 스케줄 상태를 '예정'으로 되돌림
          const anyMoving = sch.timeline.some(t => t.moving);
          const newOverallStatus = anyMoving ? '이동중' : '예정';
          window.hqStore.updateSchedule(hqId, { timeline: sch.timeline, status: newOverallStatus });
          U.toast(`⏸ 이동중 상태가 해제되었습니다.`);
        } else {
          // ★ 비활성 → 토글 ON (이 단계만 이동중, 나머지 해제)
          sch.timeline.forEach((step, i) => {
            step.moving = (i === stepIdx);
          });
          sch.timeline[stepIdx].done = false;
          sch.timeline[stepIdx].doneAt = null;
          window.hqStore.updateSchedule(hqId, { timeline: sch.timeline, status: '이동중' });
          
          const stepName = sch.timeline[stepIdx]?.label || `${stepIdx + 1}단계`;
          window.hqStore.addStatusLog(hqId, {
            label: `[${stepName}] 이동 출발 (${timeStr})`,
            status: '이동중',
            stepIdx: stepIdx
          });

          U.toast(`🚗 [${stepName}] 이동중으로 기록되었습니다. (${timeStr})`);
        }
      }
    }

    this.updateRightTimeline();

    // [완료]를 눌렀을 때만 → 다음에 할 단계(아직 안 끝난 첫 단계)를 맨 위로 올림. [이동중]은 화면을 그대로 둠
    if (targetStatus !== '완료') return;
    setTimeout(() => {
      const updatedSch = window.hqStore.getSchedules().find(s => s.id === hqId);
      if (!updatedSch?.timeline) return;
      let targetIdx = updatedSch.timeline.findIndex((t, i) => i > stepIdx && !t.done);
      if (targetIdx === -1) targetIdx = updatedSch.timeline.findIndex(t => !t.done);
      if (targetIdx === -1) return;   // 모두 끝났으면 그대로
      const el = document.getElementById(`route-step-${hqId}-${targetIdx}`);
      if (el) Home._scrollToStep(el);
    }, 120);
  },

  // 본사 스케줄 상태 변경 (이동중, 샵진행, 완료 등)
  changeHQStatus(hqId, newStatus) {
    if (typeof window.hqStore !== 'undefined') {
      window.hqStore.updateSchedule(hqId, { status: newStatus });
      U.toast(`상태가 [${newStatus}]으로 변경되었습니다. (본사 실시간 반영)`);
      this.updateRightTimeline();
    }
  },

  // 동선 체크박스 완료 토글
  toggleHQStep(hqId, stepIdx) {
    if (typeof window.hqStore !== 'undefined') {
      const sch = window.hqStore.getSchedules().find(s => s.id === hqId);
      if (sch && sch.timeline && sch.timeline[stepIdx] !== undefined) {
        sch.timeline[stepIdx].done = !sch.timeline[stepIdx].done;
        window.hqStore.updateSchedule(hqId, { timeline: sch.timeline });
        this.updateRightTimeline();
      }
    }
  },

  async logout() {
    if (confirm('로그아웃 하시겠습니까?')) {
      if (window.SupabaseClient) {
        try {
          await window.SupabaseClient.signOut();
        } catch (e) {}
      }
      if (window.AuthPersona) {
        await window.AuthPersona.logout('index.html');
      } else {
        localStorage.removeItem('bp_user_role');
        localStorage.removeItem('bp_user_name');
        localStorage.removeItem('bp_user_email');
        localStorage.removeItem('bp_company_name');
        localStorage.removeItem('bp_manager_id');
        localStorage.removeItem('bp_assigned_artists');
        localStorage.removeItem('bp_logged_in');
        localStorage.removeItem('bp_manager_filter');
        localStorage.removeItem('bp_onboarded');
        if (typeof App !== 'undefined' && App.navigate) {
          App.navigate('login');
        } else {
          window.location.href = 'index.html';
        }
      }
    }
  },

  openCustomScheduleModal() {
    const y = this.selectedDate.getFullYear();
    const m = this.selectedDate.getMonth();
    const d = this.selectedDate.getDate();

    const html = `
      <div style="padding:16px 0;">
        <div class="field" style="margin-bottom:16px;">
           <label class="field-label" style="font-size:14px; color:var(--text-400); display:block; margin-bottom:6px;">메모/일정 제목</label>
           <input type="text" id="cs-title" placeholder="예: 현장 간식 구매, 의상 픽업" style="width:100%; padding:12px; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-input); font-size:15px;" />
        </div>
        <div class="field" style="margin-bottom:16px;">
           <label class="field-label" style="font-size:14px; color:var(--text-400); display:block; margin-bottom:6px;">시간 (HH:MM)</label>
           <input type="time" id="cs-time" value="12:00" style="width:100%; padding:12px; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-input); font-size:15px;" />
        </div>
        <div class="field" style="margin-bottom:16px;">
           <label class="field-label" style="font-size:14px; color:var(--text-400); display:block; margin-bottom:6px;">예상 소요 시간 (분)</label>
           <input type="number" id="cs-dur" value="30" style="width:100%; padding:12px; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-input); font-size:15px;" />
        </div>
        <button class="btn btn-primary" onclick="Home.saveCustomSchedule(${y}, ${m}, ${d})" style="width:100%; padding:14px; margin-top:16px; border-radius:8px; font-weight:bold;">일정 저장하기</button>
      </div>
    `;
    App.showModal('매니저 일정 추가', html);
  },

  saveCustomSchedule(y, m, d) {
    const title = document.getElementById('cs-title').value.trim();
    const time = document.getElementById('cs-time').value;
    const durMin = parseInt(document.getElementById('cs-dur').value, 10) || 30;

    if (!title || !time) {
      U.toast('이름과 시간을 모두 입력해주세요.');
      return;
    }

    State.addCustomSchedule({
      date: new Date(y, m, d),
      title: title,
      time: time,
      durMin: durMin,
      icon: '📌'
    });

    App.closeModal();
    U.toast('매니저 일정이 추가되었습니다.');
    this.updateRightTimeline();
  },

  // 🌟 웹과 100% 동일한 '스케줄 등록' 모달 앱 내 팝업 렌더링
  // ── 스케줄 등록·수정 창 (editId 가 있으면 수정) ──
  openScheduleRegisterModal(editId = null) {
    const ymd = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    const edit = editId && window.hqStore ? (window.hqStore.getSchedules() || []).find(s => s.id === editId) : null;
    const role = localStorage.getItem('bp_user_role') || 'manager';
    const isHQRole = role === 'ceo' || role === 'hq_admin';
    const me = window.SupabaseClient?.currentUser?.id || '';

    const artists = (window.hqStore ? window.hqStore.getArtists() : []) || [];
    const vehicles = (window.hqStore ? window.hqStore.getVehicles() : []) || [];
    const managers = (window.hqStore ? window.hqStore.getManagers() : []) || [];
    const meMgr = managers.find(m => m.id === me);
    // 현장 매니저는 자기 담당 아티스트만 고를 수 있음 (담당이 없으면 전체)
    const myArtists = !isHQRole && meMgr && Array.isArray(meMgr.assignedArtists) && meMgr.assignedArtists.length
      ? artists.filter(a => meMgr.assignedArtists.includes(a.id)) : artists;

    let dep = '';
    try { dep = localStorage.getItem('rp_default_departure') || ''; } catch (e) { }
    const v = {
      title: edit?.title || '', artistId: edit?.artistId || (myArtists[0]?.id || 'ALL'), category: edit?.category || 'music_show',
      date: edit?.date || ymd(this.selectedDate), start: edit?.startTime || '10:00', end: edit?.endTime || '12:00',
      loc: edit?.location || '', addr: edit?.locationAddress && edit.locationAddress !== edit.location ? edit.locationAddress : '',
      shopNeeded: !!edit?.shop?.needed, shopName: edit?.shop?.needed ? (edit.shop.name || '') : '', shopAddr: edit?.shop?.needed ? (edit.shop.address || '') : '',
      dep: edit ? ((typeof edit.departure === 'object' ? (edit.departure?.address || edit.departure?.place) : edit.departure) || '') : dep,
      veh: edit?.vehicleId || '', mgr: edit?.managerId || (meMgr ? me : (managers[0]?.id || '')), secret: !!edit?.isSecret,
    };
    const opt = (val, label, sel) => `<option value="${esc(val)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;
    const artistOptions = (isHQRole || myArtists === artists ? opt('ALL', '전체 아티스트 (전원)', v.artistId === 'ALL') : '') + myArtists.map(a => opt(a.id, a.name, a.id === v.artistId)).join('');
    const vehicleOptions = opt('', '선택 안 함', !v.veh) + vehicles.map(x => opt(x.id, `${x.name}${x.number ? ' (' + x.number + ')' : ''}`, x.id === v.veh)).join('');
    const managerOptions = managers.map(m => opt(m.id, `${m.name}${m.id === me ? ' (나)' : ''}`, m.id === v.mgr)).join('');
    const cats = [['music_show', '음악방송 / 생방송'], ['broadcast', '예능 / 라디오 / 인터뷰'], ['shooting', '화보 / 촬영 / 광고'], ['event', '행사 / 콘서트 / 페스티벌'], ['fansign', '팬미팅 / 팬사인회'], ['recording', '녹음 / 안무레슨 / 연습'], ['overseas', '해외 투어 / 출국'], ['meeting', '미팅 / 기획회의 / 기타']];
    const I = 'width:100%; min-height:48px; padding:10px 12px; border:1px solid #cbd5e1; border-radius:10px; font-size:16px; background:#fff; box-sizing:border-box;';
    const L = 'font-size:14px; font-weight:700; color:#334155; display:block; margin-bottom:5px;';
    const BOX = 'background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px;';
    const modalHtml = `
      <div id="app-schedule-form-container" style="padding:4px 0 20px; max-height:75vh; overflow-y:auto; -webkit-overflow-scrolling:touch;">
        <form id="app-schedule-form" novalidate onsubmit="event.preventDefault(); Home.submitScheduleFromModal(${edit ? escJs(edit.id) : 'null'});" style="display:flex; flex-direction:column; gap:14px;">
          <div style="${BOX}">
            <div style="font-size:14px; font-weight:700; color:#4f46e5; margin-bottom:10px;">기본 스케줄 정보</div>
            <div style="margin-bottom:12px;"><label style="${L}">스케줄명 <span style="color:#ef4444;">*</span></label>
              <input type="text" id="m-sch-title" maxlength="80" value="${esc(v.title)}" placeholder="예: 뮤직뱅크 사전녹화" style="${I}" /></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
              <div><label style="${L}">아티스트 <span style="color:#ef4444;">*</span></label><select id="m-sch-artist" style="${I} padding:10px 8px;">${artistOptions}</select></div>
              <div><label style="${L}">분류 <span style="color:#ef4444;">*</span></label><select id="m-sch-category" style="${I} padding:10px 8px;">${cats.map(c => opt(c[0], c[1], c[0] === v.category)).join('')}</select></div>
            </div>
            <div style="margin-bottom:12px;"><label style="${L}">날짜 <span style="color:#ef4444;">*</span></label>
              <input type="date" id="m-sch-date" value="${esc(v.date)}" style="${I} font-weight:700;" /></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div><label style="${L}">시작 <span style="color:#ef4444;">*</span></label>
                <input type="time" id="m-sch-start" value="${esc(v.start)}" onchange="Home._autoEnd(this.value)" style="${I} padding:10px 8px; font-weight:700;" /></div>
              <div><label style="${L}">종료 <span style="color:#ef4444;">*</span></label>
                <input type="time" id="m-sch-end" value="${esc(v.end)}" oninput="this.dataset.touched='1'" style="${I} padding:10px 8px; font-weight:700;" /></div>
            </div>
          </div>

          <div style="${BOX}">
            <div style="font-size:14px; font-weight:700; color:#2563eb; margin-bottom:10px;">장소 · 출발지</div>
            <div style="margin-bottom:10px;"><label style="${L}">행사장 / 촬영 위치 <span style="color:#ef4444;">*</span></label>
              <input type="text" id="m-sch-loc" value="${esc(v.loc)}" placeholder="예: 상암 SBS 프리즘타워" style="${I}" /></div>
            <div style="margin-bottom:10px;"><label style="${L}">상세 주소 (길안내용)</label>
              <input type="text" id="m-sch-addr" value="${esc(v.addr)}" placeholder="예: 서울 마포구 상암산로 82" style="${I}" /></div>
            <div><label style="${L}">출발지 (숙소·사옥 등)</label>
              <input type="text" id="m-sch-dep" value="${esc(v.dep)}" placeholder="예: 서울 강남구 압구정로79길 19 (비우면 출발지 미정)" style="${I}" />
              <div style="font-size:13px; color:#64748b; margin-top:4px;">출발 시간을 이 주소 기준으로 계산해요. 다음 등록 때 자동으로 채워져요.</div></div>
          </div>

          <div style="${BOX}">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div style="font-size:14px; font-weight:700; color:#ec4899;">헤어 / 메이크업(샵) 경유</div>
              <label style="display:flex; align-items:center; gap:8px; min-height:44px; min-width:44px; padding:0 4px; font-size:15px; font-weight:700; cursor:pointer;">
                <input type="checkbox" id="m-sch-shop-needed" ${v.shopNeeded ? 'checked' : ''} onchange="document.getElementById('m-sch-shop-fields').style.display = this.checked ? 'block' : 'none';" style="width:24px; height:24px; accent-color:#ec4899;" /> 경유함</label>
            </div>
            <div id="m-sch-shop-fields" style="display:${v.shopNeeded ? 'block' : 'none'}; padding-top:10px;">
              <label style="${L}">샵 이름</label><input type="text" id="m-sch-shop-name" value="${esc(v.shopName)}" placeholder="예: 정샘물 청담본점" style="${I} margin-bottom:8px;" />
              <label style="${L}">샵 주소</label><input type="text" id="m-sch-shop-addr" value="${esc(v.shopAddr)}" placeholder="예: 서울 강남구 도산대로 ..." style="${I}" />
            </div>
          </div>

          <div style="${BOX}">
            <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:10px;">차량 · 담당 매니저</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
              <div><label style="${L}">배차 차량</label><select id="m-sch-veh" style="${I} padding:10px 8px;">${vehicleOptions}</select></div>
              <div><label style="${L}">담당 매니저</label><select id="m-sch-mgr" style="${I} padding:10px 8px;">${managerOptions}</select></div>
            </div>
            <label style="margin-top:12px; padding-top:10px; border-top:1px dashed #cbd5e1; display:flex; justify-content:space-between; align-items:center; min-height:44px; cursor:pointer;">
              <span style="font-size:15px; font-weight:700; color:#475569;">🔒 비공개 (현장 스태프에게 안 보임)</span>
              <input type="checkbox" id="m-sch-secret" ${v.secret ? 'checked' : ''} style="width:24px; height:24px; accent-color:#9333ea;" />
            </label>
          </div>

          <div style="display:flex; gap:8px; margin-top:8px;">
            <button type="button" onclick="App.closeModal();" style="flex:1; padding:14px 0; border:1px solid #cbd5e1; background:#fff; color:#475569; border-radius:10px; font-size:15px; font-weight:700;">취소</button>
            <button type="submit" id="m-sch-submit" style="flex:2; padding:14px 0; border:none; background:#4f46e5; color:#fff; border-radius:10px; font-size:15px; font-weight:700;">${edit ? '수정 저장' : '스케줄 등록 완료'}</button>
          </div>
        </form>
      </div>`;
    App.showModal(edit ? '✏️ 스케줄 수정' : '📅 신규 스케줄 등록', modalHtml);
  },

  // 시작 시간을 바꾸면 (종료를 직접 고치지 않았을 때) 종료 = 시작 + 2시간
  _autoEnd(start) {
    const el = document.getElementById('m-sch-end');
    if (!el || el.dataset.touched === '1' || !/^\d{2}:\d{2}$/.test(start || '')) return;
    const [h, m] = start.split(':').map(Number);
    const t = (h * 60 + m + 120) % 1440;
    el.value = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  },

  // 같은 날 같은 차량·매니저가 겹치는 일정 찾기
  _findConflicts(sch) {
    const toMin = (t) => { const [h, m] = String(t || '').split(':').map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; };
    const s1 = toMin(sch.startTime); let e1 = toMin(sch.endTime);
    if (s1 == null) return [];
    if (e1 == null) e1 = s1 + 120; else if (e1 <= s1) e1 += 1440;
    return ((window.hqStore?.getSchedules?.()) || []).filter(o => {
      if (!o || o.id === sch.id || o.date !== sch.date || ['취소', 'cancelled'].includes(o.status)) return false;
      const same = (sch.vehicleId && o.vehicleId === sch.vehicleId) || (sch.managerId && o.managerId === sch.managerId);
      if (!same) return false;
      const s2 = toMin(o.startTime); let e2 = toMin(o.endTime);
      if (s2 == null) return false;
      if (e2 == null) e2 = s2 + 120; else if (e2 <= s2) e2 += 1440;
      return s1 < e2 && s2 < e1;
    }).map(o => `${o.startTime}~${o.endTime || ''} ${o.title}${sch.vehicleId && o.vehicleId === sch.vehicleId ? ' (같은 차량)' : ''}${sch.managerId && o.managerId === sch.managerId ? ' (같은 매니저)' : ''}`);
  },

  async submitScheduleFromModal(editId = null) {
    if (this._submittingSchedule) return;          // 두 번 눌러도 한 번만
    const g = (id) => document.getElementById(id);
    const val = (id) => (g(id)?.value || '').trim();
    const title = val('m-sch-title'), artistId = g('m-sch-artist')?.value, category = g('m-sch-category')?.value;
    const dateVal = val('m-sch-date'), startVal = val('m-sch-start'), endVal = val('m-sch-end');
    const locationVal = val('m-sch-loc'), addressVal = val('m-sch-addr'), depVal = val('m-sch-dep');
    const shopNeeded = !!g('m-sch-shop-needed')?.checked, shopName = val('m-sch-shop-name'), shopAddr = val('m-sch-shop-addr');
    const vehicleId = g('m-sch-veh')?.value || '', managerId = g('m-sch-mgr')?.value || '', isSecret = !!g('m-sch-secret')?.checked;

    // 빠진 칸: 그 칸으로 화면을 옮기고 빨간 테두리 + 칸 아래 설명 한 줄
    document.querySelectorAll('#app-schedule-form .field-err-msg').forEach(n => n.remove());
    document.querySelectorAll('#app-schedule-form [data-err]').forEach(n => { n.style.borderColor = ''; n.style.background = ''; n.removeAttribute('data-err'); });
    const miss = (id, msg) => {
      const el = g(id); if (!el) { U.toast(msg); return true; }
      el.setAttribute('data-err', '1'); el.style.borderColor = '#dc2626'; el.style.background = '#fef2f2';
      const note = document.createElement('div'); note.className = 'field-err-msg'; note.setAttribute('role', 'alert');
      note.style.cssText = 'color:#dc2626; font-size:14px; font-weight:700; margin-top:5px;'; note.textContent = msg;
      el.insertAdjacentElement('afterend', note);
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) { }
      setTimeout(() => { try { el.focus({ preventScroll: true }); } catch (e) { } }, 350);
      el.addEventListener('input', () => { el.style.borderColor = ''; el.style.background = ''; note.remove(); }, { once: true });
      return true;
    };
    if (!title) return miss('m-sch-title', '스케줄명을 입력해 주세요. (예: 뮤직뱅크 사전녹화)');
    if (!dateVal) return miss('m-sch-date', '날짜를 골라 주세요.');
    if (!startVal) return miss('m-sch-start', '시작 시간을 골라 주세요.');
    if (!locationVal) return miss('m-sch-loc', '행사장이나 촬영 위치를 입력해 주세요.');
    if (shopNeeded && !shopName && !shopAddr) return miss('m-sch-shop-name', '샵 이름이나 주소를 입력해 주세요. 샵에 안 가면 위의 "경유함"을 끄세요.');
    const today = new Date(); const todayYmd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (dateVal < todayYmd && !confirm(`지난 날짜(${dateVal})예요. 그래도 저장할까요?`)) return;
    if (endVal && endVal <= startVal && !confirm(`종료(${endVal})가 시작(${startVal})보다 빨라요.\n다음날 ${endVal}에 끝나는 일정인가요?`)) return;

    const artists = (window.hqStore ? window.hqStore.getArtists() : []) || [];
    const vehicles = (window.hqStore ? window.hqStore.getVehicles() : []) || [];
    const managers = (window.hqStore ? window.hqStore.getManagers() : []) || [];
    const isAll = artistId === 'ALL';
    const art = isAll ? null : artists.find(a => a.id === artistId);
    const veh = vehicles.find(x => x.id === vehicleId);
    const mgr = managers.find(m => m.id === managerId);
    const prev = editId ? (window.hqStore?.getSchedules?.() || []).find(s => s.id === editId) : null;

    const schData = {
      ...(prev || {}),
      id: editId || ('sch_' + Date.now()),
      title, artistId, artistIds: isAll ? artists.map(a => a.id) : [artistId],
      artistName: isAll ? '전체 아티스트 (전원)' : (art ? art.name : '아티스트'),
      targetMembers: 'ALL', category: category || 'music_show',
      date: dateVal, startTime: startVal, endTime: endVal || startVal,
      managerId, managerName: mgr ? mgr.name : '', vehicleId, vehicleName: veh ? veh.name : '',
      location: locationVal, locationAddress: addressVal || locationVal,
      status: prev?.status || '확정', isSecret, secretLevel: isSecret ? 'confidential' : 'public',
      shop: shopNeeded ? { needed: true, name: shopName || shopAddr, address: shopAddr || shopName, durationMin: Number(prev?.shop?.durationMin) || 90 } : { needed: false },
      departure: depVal ? { place: depVal, address: depVal } : { place: '출발지 미정', address: '' },
    };
    if (editId) delete schData.timeline;   // 수정하면 동선 다시 계산

    const conflicts = this._findConflicts(schData);
    if (conflicts.length && !confirm(`같은 시간에 겹치는 일정이 있어요.\n\n${conflicts.slice(0, 3).join('\n')}\n\n그래도 저장할까요?`)) return;

    const btn = g('m-sch-submit');
    const label = btn ? btn.textContent : '';
    this._submittingSchedule = true;
    if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; btn.textContent = '동선 계산 중… (최대 10초)'; }
    try {
      try { if (depVal) localStorage.setItem('rp_default_departure', depVal); } catch (e) { }
      // 동선 계산은 저장 함수(saveSchedule) 안에서 한 번만 (10초 넘으면 추정값으로)
      if (window.hqStore && typeof window.hqStore.saveSchedule === 'function') {
        if (editId && window.hqStore.updateSchedule) {
          schData.timeline = await window.hqStore.buildTimelineCapped(schData);
          await window.hqStore.updateSchedule(editId, schData);
          await window.hqStore.addStatusLog?.(editId, { label: `[일정 수정] ${title} ${dateVal} ${startVal}`, managerName: window.SupabaseClient?.currentProfile?.name || '', ack: managerId && managerId !== window.SupabaseClient?.currentUser?.id ? { need: true, managerId } : undefined });
        } else {
          await window.hqStore.saveSchedule(schData);
        }
      } else {
        State.addSchedule(schData);
      }
      App.closeModal();
      U.toast(editId ? '✅ 스케줄을 수정했습니다.' : '✅ 스케줄이 등록되었습니다!');
      const parts = dateVal.split('-').map(Number);
      if (parts.length === 3) this.selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
      this.render();
    } catch (err) {
      U.toast('저장하지 못했습니다: ' + (err?.message || err));
      if (btn) { btn.disabled = false; btn.style.opacity = ''; btn.textContent = label; }
    } finally {
      this._submittingSchedule = false;
    }
  },

  // 상세보기 [삭제] (본사 계정)
  async deleteScheduleFromApp(id) {
    const sch = (window.hqStore?.getSchedules?.() || []).find(s => s.id === id);
    if (!sch || !confirm(`"${sch.title}" (${sch.date} ${sch.startTime}) 일정을 삭제할까요?\n담당 매니저 화면에서도 사라집니다.`)) return;
    try { await window.hqStore.deleteSchedule(id); U.toast('🗑️ 일정을 삭제했습니다.'); this.render(); }
    catch (err) { U.toast('삭제하지 못했습니다: ' + (err?.message || err)); }
  }
};
