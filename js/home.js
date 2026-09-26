// ── 🎨 아티스트 고유 활동 유형별 라인 SVG 아이콘 헬퍼 ──
function getArtistTypeIcon(art, size = 14) {
  if (!art) return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`;
  const nameStr = (typeof art === 'string' ? art : (art.name || '')).toLowerCase();
  const typeStr = (art.type || '').toLowerCase();
  
  if (typeStr.includes('배우') || typeStr.includes('actor') || nameStr.includes('은호') || nameStr.includes('eunho')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m4 4 3 4"/><path d="m11 4 3 4"/><path d="m18 4 3 4"/><line x1="2" y1="8" x2="22" y2="8"/></svg>`;
  }
  if (typeStr.includes('솔로') || typeStr.includes('solo') || typeStr.includes('보컬') || nameStr.includes('유나') || nameStr.includes('yuna')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  }
  if (typeStr.includes('보이') || typeStr.includes('boy') || nameStr.includes('에이펙스') || nameStr.includes('apex')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
}

const Home = {
  selectedDate: new Date(),
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  currentTab: 'schedule', // 'schedule' (회사 스케줄표) | 'timeline' (매니저 동선 타임라인)
  broadcastBound: false,

  init() { 
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

    el.innerHTML = `
      <div class="split-view" style="display:flex; height:100vh; padding-top:var(--header-h); overflow:hidden; background:var(--bg-app); flex-direction:row;">
        
        <!-- LEFT: Vertical Calendar -->
        <div class="split-left" style="width:85px; flex-shrink:0; border-right:1px solid var(--border-default); background:#ffffff; display:flex; flex-direction:column; height:calc(100vh - var(--header-h));">
          
          <!-- Header -->
          <div style="padding: 14px 4px 10px; flex-shrink:0; border-bottom:1px solid rgba(0,0,0,0.05);">
            <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
              <h2 id="mini-cal-title" style="font-size:12px; font-weight:800; color:var(--text-100); text-align:center; line-height:1.2;">${this.calYear}년<br/>${this.calMonth+1}월</h2>
              <div style="display:flex; gap:2px;">
                <button onclick="Home.prevMonth()" style="padding:4px; color:var(--text-300);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                <button onclick="Home.nextMonth()" style="padding:4px; color:var(--text-300);"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
              </div>
            </div>
          </div>
          
          <!-- Scrollable Dates -->
          <div id="mini-cal-grid" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; padding:10px 6px; position:relative;">
            ${this.renderMiniCal()}
          </div>
          
          <!-- Footer -->
          <div style="padding:10px 6px; flex-shrink:0; border-top:1px solid rgba(0,0,0,0.05); display:flex; flex-direction:column; gap:6px;">
             <a href="admin.html" target="_blank" style="display:inline-flex; align-items:center; justify-content:center; gap:5px; width:100%; padding:8px 0; border-radius:8px; background:linear-gradient(135deg, #4f46e5, #7c3aed); color:#fff; font-weight:800; font-size:11px; text-align:center; text-decoration:none; box-shadow:0 2px 8px rgba(79,70,229,0.3);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="12" y1="22" x2="12" y2="22.01"/><line x1="8" y1="6" x2="8" y2="6.01"/><line x1="16" y1="6" x2="16" y2="6.01"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/></svg> 본사</a>
             <button onclick="App.navigate('profile')" style="width:100%; padding:8px 0; border-radius:8px; background:var(--bg-input); font-weight:700; font-size:11px; color:var(--text-200); text-align:center; border:none; cursor:pointer;">내 정보</button>
          </div>
        </div>

        <!-- RIGHT: Timeline -->
        <div class="split-right" style="flex:1; overflow-y:auto; overflow-x:hidden; background:var(--bg-default); position:relative; height:calc(100vh - var(--header-h));">
          <div id="timeline-area" style="padding:24px 16px; max-width:800px; margin:0 auto; min-height:100%;">
            ${this.renderTimeline()}
          </div>
        </div>
      </div>
    `;

    setTimeout(() => {
      this.centerSelectedDate();
    }, 100);
  },

  centerSelectedDate() {
    const grid = U.$('#mini-cal-grid');
    const selectedEl = grid?.querySelector('.v-cal-day.selected') || grid?.querySelector('.v-cal-day.today');
    if (grid && selectedEl) {
      const gridHeight = grid.clientHeight;
      const elOffset = selectedEl.offsetTop;
      const elHeight = selectedEl.clientHeight;
      grid.scrollTo({
        top: elOffset - (gridHeight / 2) + (elHeight / 2),
        behavior: 'smooth'
      });
    }
  },

  renderMiniCal() {
    const y = this.calYear;
    const m = this.calMonth;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    
    let html = '';
    
    for(let d=1; d<=daysInMonth; d++) {
      const cellDate = new Date(y, m, d);
      const isSelected = y === this.selectedDate.getFullYear() && m === this.selectedDate.getMonth() && d === this.selectedDate.getDate();
      const isToday = y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
      const scheds = State.getSchedulesForDate(y, m, d);
      const hasSched = scheds.length > 0;
      
      const dayName = U.DAYS[cellDate.getDay()];
      let dayColor = cellDate.getDay() === 0 ? 'color:var(--ios-red);' : cellDate.getDay() === 6 ? 'color:var(--ios-blue);' : 'color:var(--text-400);';
      
      let cls = 'v-cal-day';
      if(isSelected) cls += ' selected';
      if(isToday && !isSelected) cls += ' today';
      
      let dot = hasSched ? `<div style="width:6px; height:6px; background:${isSelected?'#fff':'#6366f1'}; border-radius:50%; margin-left:auto;"></div>` : '';
      
      html += `
        <div class="${cls}" onclick="Home.selectDate(${y},${m},${d})" style="display:flex; align-items:center; justify-content:center; gap:6px; padding:8px 4px; cursor:pointer; border-radius:10px; margin-bottom:2px; transition:all 0.2s; ${isSelected ? 'background:#1e293b; color:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.1);' : isToday ? 'background:rgba(99,102,241,0.08);' : ''}">
          <div style="font-size:12px; font-weight:700; ${isSelected ? 'color:rgba(255,255,255,0.7);' : dayColor}">${dayName}</div>
          <div style="font-size:14px; font-weight:800; width:22px; text-align:center; ${isSelected ? 'color:#fff;' : 'color:var(--text-100);'}">${d}</div>
          <div style="width:4px; height:4px; display:flex; align-items:center; justify-content:center;">${dot}</div>
        </div>
      `;
    }
    return html;
  },
  
  prevMonth() {
    this.calMonth--;
    if(this.calMonth < 0) { this.calMonth = 11; this.calYear--; }
    this.updateLeftCal();
  },
  
  nextMonth() {
    this.calMonth++;
    if(this.calMonth > 11) { this.calMonth = 0; this.calYear++; }
    this.updateLeftCal();
  },
  
  selectDate(y, m, d) {
    this.selectedDate = new Date(y, m, d);
    this.calYear = y;
    this.calMonth = m;
    this.updateLeftCal();
    this.updateRightTimeline();
  },
  
  updateLeftCal() {
    const title = U.$('#mini-cal-title');
    const grid = U.$('#mini-cal-grid');
    if(title) title.innerHTML = `${this.calYear}년<br/>${this.calMonth+1}월`;
    if(grid) grid.innerHTML = this.renderMiniCal();
  },
  
  updateRightTimeline() {
    const area = U.$('#timeline-area');
    if (area) area.innerHTML = this.renderTimeline();
  },

  setTab(tabName) {
    this.currentTab = tabName;
    this.render();

    // 매니저 동선 타임라인 탭으로 전환 시 → 다음 일정 단계를 맨 위로 자동 스크롤
    if (tabName === 'timeline') {
      setTimeout(() => {
        const y = this.selectedDate.getFullYear();
        const m = this.selectedDate.getMonth();
        const d = this.selectedDate.getDate();
        const hqScheds = State.getHQSchedulesForDate(y, m, d);
        if (!hqScheds || hqScheds.length === 0) return;

        const sch = hqScheds[0];
        if (!sch.timeline) return;

        let targetIdx = sch.timeline.findIndex(t => t.moving === true);
        if (targetIdx === -1) {
          targetIdx = sch.timeline.findIndex(t => !t.done);
        }

        if (targetIdx !== -1) {
          const el = document.getElementById(`route-step-${sch.id}-${targetIdx}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
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
    const dateStr = `${y}년 ${m+1}월 ${d}일 (${U.DAYS[this.selectedDate.getDay()]})`;
    const managers = (typeof window.hqStore !== 'undefined' && Array.isArray(window.hqStore.getManagers())) ? window.hqStore.getManagers() : [];
    const currentMgr = State.currentManagerFilter || 'ALL';
    const userName = localStorage.getItem('bp_user_name') || '담당 매니저';
    const userRole = localStorage.getItem('bp_user_role') || 'manager';
    const currentMgrId = localStorage.getItem('bp_manager_id') || '';
    const assignedJson = localStorage.getItem('bp_assigned_artists');
    
    // 담당 아티스트명 추출
    let artistSummary = '';
    if (assignedJson) {
      try {
        const assignedIds = JSON.parse(assignedJson) || [];
        const allArtists = (typeof window.hqStore !== 'undefined') ? window.hqStore.getArtists() : [];
        const myArts = allArtists.filter(a => assignedIds.includes(a.id));
        if (myArts.length > 0) {
          artistSummary = myArts.map(a => `${a.emoji || '✨'} ${a.name}`).join(', ');
        }
      } catch(e) {}
    }

    // 현재 로그인된 역할 정보
    const currentRole = localStorage.getItem('bp_user_role') || 'manager';
    const persona = (window.AuthPersona && window.AuthPersona.ROLES[currentRole]) 
      ? window.AuthPersona.ROLES[currentRole] 
      : { badge: '🚗 현장 매니저', shortBadge: '🚗 매니저', color: '#ec4899' };

    let managerSelectorHtml = '';
    if (userRole === 'ceo' || userRole === 'hq_admin') {
      managerSelectorHtml = `
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
          <div style="display:flex; align-items:center; gap:6px; background:#fff; padding:4px 8px; border-radius:10px; border:1px solid var(--border-default); box-shadow:0 1px 4px rgba(0,0,0,0.03);">
            <span style="font-size:11px; font-weight:700; color:var(--text-400);">👤 관제:</span>
            <select onchange="Home.setManager(this.value)" style="border:none; background:transparent; font-size:12px; font-weight:800; color:#4f46e5; outline:none; cursor:pointer;">
              <option value="ALL" ${currentMgr === 'ALL' ? 'selected' : ''}>전체 스케줄 (전사 뷰)</option>
              ${managers.map(mgr => `<option value="${mgr.id}" ${currentMgr === mgr.id ? 'selected' : ''}>${mgr.name}</option>`).join('')}
            </select>
          </div>
        </div>
      `;
    } else {
      managerSelectorHtml = '';
    }

    let subtitleText = '🏢 담당 아티스트의 스케줄표입니다.';
    if (userRole === 'ceo') subtitleText = '👑 [CEO 전사 모드] 모든 아티스트 및 비공개 일정 열람 중';
    else if (userRole === 'staff') subtitleText = '🎧 [스태프 뷰어 모드] 당일 현장 타임라인 & 콜타임 중심';
    else if (this.currentTab === 'timeline') subtitleText = '📍 내 실시간 동선 타임라인입니다.';

    let html = `
      <div style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px;">
          <div style="width:100%;">
            <div style="display:flex; align-items:center; gap:10px; width:100%;">
              <h2 style="font-size:20px; font-weight:800; color:var(--text-100); letter-spacing:-0.5px; word-break:keep-all;">${dateStr}</h2>
              <div onclick="Home.logout()" style="display:inline-flex; align-items:center; gap:5px; background:${persona.color}15; border:1px solid ${persona.color}40; color:${persona.color}; padding:3px 9px; border-radius:12px; font-size:11px; font-weight:800; cursor:pointer; white-space:nowrap; margin-left:auto;">
                <span>${persona.shortBadge}</span>
                <span style="font-size:9px; opacity:0.8;">[전환 ▾]</span>
              </div>
            </div>
            <div style="font-size:12px; color:var(--text-400); margin-top:4px;">
              ${subtitleText}
            </div>
          </div>
          ${managerSelectorHtml}
        </div>
      </div>

      <!-- 탭 버튼 -->
      <div style="display:flex; background:rgba(0,0,0,0.04); border-radius:12px; padding:4px; margin-bottom:20px;">
        <div onclick="Home.setTab('schedule')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 0; border-radius:8px; font-size:13.5px; font-weight:800; cursor:pointer; transition:all 0.2s; ${this.currentTab === 'schedule' ? 'background:#fff; color:#4f46e5; box-shadow:0 2px 6px rgba(0,0,0,0.06);' : 'color:var(--text-400);'}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          회사 스케줄표
        </div>
        <div onclick="Home.setTab('timeline')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:6px; padding:10px 0; border-radius:8px; font-size:13.5px; font-weight:800; cursor:pointer; transition:all 0.2s; ${this.currentTab === 'timeline' ? 'background:#fff; color:#4f46e5; box-shadow:0 2px 6px rgba(0,0,0,0.06);' : 'color:var(--text-400);'}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          매니저 동선 타임라인
        </div>
      </div>
    `;

    const events = State.calculateDailyEvents(y, m, d);
    const rawSchedules = State.getSchedulesForDate(y, m, d);

    if (events.length === 0 && rawSchedules.length === 0) {
      html += `
        <div class="tl-empty" onclick="window.open('admin.html','_blank')" style="border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-400); cursor:pointer; font-size:14px; font-weight:600; border:2px dashed rgba(0,0,0,0.15); min-height:300px; background:rgba(255,255,255,0.4); text-align:center; padding:20px;">
           <span style="display:inline-flex; align-items:center; justify-content:center; width:52px; height:52px; border-radius:14px; background:rgba(99,102,241,0.1); color:#6366f1; margin-bottom:12px;">
             <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
           </span>
           <span style="font-size:16px; font-weight:800; color:var(--text-100); margin-bottom:4px;">등록된 스케줄이 없습니다.</span>
           <span style="color:#4f46e5; font-size:13px; font-weight:700;">본사 마스터 스케줄러(admin.html)에서 일정을 등록하면 자동으로 동기화됩니다 ↗</span>
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

    // 첫 스케줄의 시작 시간(Hour)부터 타임라인 시작 (이전 새벽 시간 00:00~06:00 등은 숨김)
    const firstStartHour = sortedSchedules.length > 0 ? timeToHour(sortedSchedules[0].teeOff || sortedSchedules[0].startTime, 7) : 7;
    let currentHour = firstStartHour;

    while (currentHour <= 23) {
      const hourStr = String(currentHour).padStart(2, '0') + ':00';

      // 현재 시간에 시작하거나 걸쳐있는 스케줄 찾기
      const activeSched = sortedSchedules.find(s => {
        const sHour = timeToHour(s.teeOff || s.startTime);
        return sHour === currentHour;
      });

      if (activeSched) {
        const schId = activeSched.id || `sch_${sortedSchedules.indexOf(activeSched)}`;
        const isExpanded = this.expandedScheduleId === schId;
        const isHQ = activeSched.isHQ;

        const startTime = activeSched.teeOff || activeSched.startTime || '07:30';
        const endTime = activeSched.endTime || '17:00';
        const endHour = timeToHour(endTime, currentHour + 1);

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
        const cardBorderColor = isExpanded ? (isSecret ? '#9333ea' : '#6366f1') : (isSecret ? '#d8b4fe' : '#cbd5e1');
        const cardBorderLeft = isSecret ? 'border-left:4px solid #9333ea;' : 'border-left:4px solid #4f46e5;';

        const allArtists = (typeof window.hqStore !== 'undefined') ? window.hqStore.getArtists() : [];
        const artObj = allArtists.find(a => a.id === activeSched.artistId) || { name: activeSched.artistName || '아티스트' };

        html += `
          <div style="margin-bottom:12px; position:relative;">
            <!-- 시작 시간 텍스트 -->
            <div style="font-size:12px; font-weight:800; color:${isSecret ? '#9333ea' : '#4f46e5'}; margin-bottom:6px;">
              ${hourStr}
            </div>

            <!-- 스케줄 카드 (07:30 ~ 17:00) -->
            <div onclick="Home.toggleScheduleDetail('${schId}')" 
                 style="width:100%; background:${cardBg}; border-radius:14px; padding:14px 14px 16px; border:1px solid ${cardBorderColor}; ${cardBorderLeft} box-shadow:0 2px 10px rgba(0,0,0,0.04); cursor:pointer; transition:all 0.2s ease; box-sizing:border-box;">
              
              <!-- 상단: 시간 & 아티스트 태그 & 상세보기 -->
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <div style="font-size:11px; font-weight:800; color:${isSecret ? '#9333ea' : '#4f46e5'}; display:flex; align-items:center; gap:4px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    <span>${startTime} ~ ${endTime}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
                    <span style="background:${artObj.color || '#1e293b'}; color:#fff; font-size:11px; font-weight:800; padding:2px 7px; border-radius:5px; display:inline-flex; align-items:center; gap:4px;">
                      ${getArtistTypeIcon(artObj, 11)}
                      <span>${activeSched.artistName || '아티스트'}</span>
                    </span>
                    ${isHQ ? '<span style="background:rgba(99,102,241,0.1); color:#4f46e5; font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="22.01"/><line x1="15" y1="22" x2="15" y2="22.01"/><line x1="12" y1="22" x2="12" y2="22.01"/></svg>HQ연동</span>' : ''}
                    ${isSecret ? '<span style="background:#f3e8ff; color:#9333ea; font-size:10px; font-weight:800; padding:1px 6px; border-radius:4px; border:1px solid #d8b4fe; display:inline-flex; align-items:center; gap:3px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Secret</span>' : ''}
                  </div>
                </div>

                <div style="font-size:10px; font-weight:700; color:${isExpanded ? (isSecret ? '#9333ea' : '#4f46e5') : '#94a3b8'}; text-align:right; line-height:1.2; padding-top:2px;">
                  ${isExpanded ? '상세<br>접기 ▲' : '상세<br>보기 ▼'}
                </div>
              </div>

              <!-- 일정 타이틀 -->
              <div style="font-size:14px; font-weight:800; color:${isSecret ? '#581c87' : 'var(--text-100)'}; margin-bottom:6px; line-height:1.35; word-break:keep-all;">
                ${displayTitle}
              </div>
              
              <!-- 장소 -->
              <div style="font-size:11px; color:#64748b; font-weight:600; line-height:1.3; word-break:keep-all; display:flex; align-items:center; gap:4px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>${displayLocation}</span>
              </div>

              <!-- 클릭 시 제자리 확장 상세 정보 -->
              ${isExpanded ? `
                <div style="margin-top:12px; padding-top:12px; border-top:1px dashed ${isSecret ? '#e9d5ff' : '#e2e8f0'}; animation:fadeIn 0.2s ease-in-out;">
                  <div style="background:${isSecret ? '#faf5ff' : '#f8fafc'}; border-radius:8px; padding:10px 12px; font-size:11px; color:var(--text-200); display:flex; flex-direction:column; gap:6px; border:1px solid ${isSecret ? '#f3e8ff' : '#f1f5f9'};">
                    ${(isSecret && !canViewSecret) ? `
                      <div style="color:#dc2626; font-weight:700; display:flex; align-items:center; gap:4px;">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span>본 일정은 비공개 보안 스케줄로, 담당 배정자 및 경영진 외에는 열람이 제한됩니다.</span>
                      </div>
                    ` : `
                      <div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <strong>매니저:</strong> ${activeSched.managerName || '미지정'}</div>
                      ${!isStaff ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg> <strong>배차:</strong> ${activeSched.vehicleName || '미지정'}</div>` : ''}
                      ${activeSched.shop && activeSched.shop.needed ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2"><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg> <strong>샵:</strong> ${activeSched.shop.name} (${activeSched.shop.durationMin || 90}분)</div>` : ''}
                      ${departureText ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> <strong>픽업:</strong> ${departureText}</div>` : ''}
                      ${activeSched.outfit ? `<div style="display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2"><path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg> <strong>의상:</strong> ${activeSched.outfit}</div>` : ''}
                      ${activeSched.notes ? `<div style="color:#475569; background:#fff; padding:6px 8px; border-radius:4px; border:1px solid #e2e8f0; margin-top:2px; display:flex; align-items:flex-start; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" style="flex-shrink:0; margin-top:2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> <span><strong>특이사항:</strong> ${activeSched.notes}</span></div>` : ''}
                    `}
                  </div>
                </div>
              ` : ''}

            </div>
          </div>
        `;

        // 스케줄이 17:00에 끝나므로, 다음 시간대를 17:00로 바로 이동!
        currentHour = Math.max(currentHour + 1, endHour);
      } else {
        // 일정이 없는 빈 시간대
        html += `
          <div style="margin-bottom:8px; position:relative;">
            <div style="font-size:11px; font-weight:700; color:#94a3b8; margin-bottom:4px;">
              ${hourStr}
            </div>
            <div style="border-bottom:1px solid #f1f5f9; margin-bottom:6px;"></div>
          </div>
        `;
        currentHour++;
      }
    }

    html += `
      <div onclick="window.open('admin.html','_blank')" style="text-align:center; padding:12px; background:#fff; border:2px dashed rgba(99,102,241,0.3); border-radius:12px; color:#4f46e5; font-size:12px; font-weight:800; cursor:pointer; margin-top:16px;">
        + 본사 마스터 스케줄러에서 신규 등록 ↗
      </div>
    </div>`;

    return html;
  },

  renderManagerRoute(events) {
    this.currentEvents = events;
    let html = '<div style="padding: 8px 4px 40px;">';
    
    html += `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="font-size:13px; font-weight:700; color:var(--text-400);">
          ✅ [이동중] 또는 [완료]를 선택하면 실시간 반영됩니다.
        </div>
        <div style="display:flex; gap:6px;">
          <button onclick="Home.copyBriefing()" style="display:inline-flex; align-items:center; gap:4px; background:#10b981; color:#fff; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:800; border:none; cursor:pointer;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            공지 복사
          </button>
          <button onclick="Home.openCustomScheduleModal()" style="display:inline-flex; align-items:center; gap:4px; background:#4f46e5; color:#fff; padding:6px 12px; border-radius:8px; font-size:12px; font-weight:800; border:none; cursor:pointer;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            개인 메모
          </button>
        </div>
      </div>
    `;

    events.forEach((ev, idx) => {
      const isLast = idx === events.length - 1;
      const isDone = ev.done || false;
      const isHQ = ev.isHQ;
      
      // 이동중: 단계별 개별 상태 (ev.moving) 사용 — 전체 스케줄 상태 아님
      const isMoving = (ev.moving === true) && !isDone;

      let dotBg = isDone ? '#10b981' : isMoving ? '#f59e0b' : '#6366f1';
      let cardBorder = isDone ? 'border-left: 4px solid #10b981;' : isMoving ? 'border-left: 4px solid #f59e0b;' : 'border-left: 4px solid #6366f1;';

      // 운전/이동 단계 여부 판별 (체류/스타일링/메인 행사 단계에서는 네비 버튼 숨김)
      const titleText = (ev.title || '');
      const isStayStep = titleText.includes('도착 및 스타일링') || titleText.includes('스타일링') || titleText.includes('[메인 일정]') || titleText.includes('녹음') || titleText.includes('레슨');
      const isDriveStep = !isStayStep && (titleText.includes('출발') || titleText.includes('이동') || titleText.includes('픽업') || titleText.includes('철수') || ev.moving === true);

      // 목적지 추정 (길안내용)
      let destinationTarget = '';
      if (titleText.includes('숙소 픽업') || titleText.includes('픽업 및 출발')) {
        destinationTarget = ev.shopAddress || ev.shopName || '순수 청담본점';
      } else if (titleText.includes('현장') || titleText.includes('이동 출발')) {
        destinationTarget = ev.locationAddress || ev.location || ev.title.replace(/.*현장\(/, '').replace(/\).*/, '') || '행사장';
      } else if (titleText.includes('복귀') || titleText.includes('철수')) {
        destinationTarget = ev.departureAddress || ev.departurePlace || '숙소';
      } else {
        destinationTarget = ev.locationAddress || ev.location || ev.title;
      }

      html += `
        <div id="route-step-${ev.hqScheduleId || ''}-${ev.timelineIdx ?? idx}" style="display:flex; position:relative; margin-bottom:18px;">
          <!-- Vertical Track Line -->
          ${!isLast ? `<div style="position:absolute; top:24px; bottom:-20px; left:9px; width:2px; background:${isDone ? '#10b981' : isMoving ? '#f59e0b' : '#e2e8f0'};"></div>` : ''}
          
          <!-- Dot -->
          <div style="width:20px; height:20px; flex-shrink:0; border-radius:50%; background:#fff; border:3px solid ${dotBg}; position:relative; z-index:2; margin-top:4px; display:flex; align-items:center; justify-content:center; color:${dotBg};">
            ${isDone ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : isMoving ? '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/></svg>' : ''}
          </div>
          
          <!-- Route Card -->
          <div style="flex:1; margin-left:14px; background:#fff; border-radius:14px; padding:16px; box-shadow:0 2px 10px rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.04); ${cardBorder} position:relative;">
             
             <!-- 상단 시간 & [이동중] [완료] 진행 상태 버튼 -->
             <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <div style="font-size:19px; font-weight:800; color:${isDone ? '#10b981' : isMoving ? '#d97706' : 'var(--text-100)'}; letter-spacing:0.3px;">
                     [${ev.time}]
                  </div>
                  ${isDone && ev.doneAt ? `
                    <span style="display:inline-flex; align-items:center; gap:4px; background:#ecfdf5; color:#059669; font-size:11px; font-weight:700; padding:2px 7px; border-radius:6px; border:1px solid rgba(16,185,129,0.3);">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      ${ev.doneAt} 기록
                    </span>
                  ` : ''}
                </div>
                
                ${isHQ && ev.hqScheduleId ? `
                  <div style="display:flex; align-items:center; gap:5px;">
                    ${isDriveStep ? `
                      <!-- 이동중 버튼 (이동 단계에서만 노출) -->
                      <button type="button"
                        onclick="Home.setHQRouteStatus('${ev.hqScheduleId}', ${ev.timelineIdx}, '이동중')"
                        style="padding:4px 10px; border-radius:6px; font-size:12px; font-weight:800; cursor:pointer; transition:all 0.2s;
                               ${isMoving
                                  ? 'border:2px solid #f59e0b; background:#fff7ed; color:#d97706; box-shadow:0 0 0 2px rgba(245,158,11,0.15);'
                                  : 'border:1px solid #e2e8f0; background:#f8fafc; color:#c0cad6; opacity:0.7; font-weight:600;'
                               }">
                        이동중
                      </button>
                    ` : ''}
                    <!-- 완료 버튼 -->
                    <button type="button"
                      onclick="Home.setHQRouteStatus('${ev.hqScheduleId}', ${ev.timelineIdx}, '완료')"
                      style="padding:4px 10px; border-radius:6px; font-size:12px; font-weight:800; cursor:pointer; transition:all 0.2s;
                             ${isDone
                                ? 'border:2px solid #10b981; background:#ecfdf5; color:#059669; box-shadow:0 0 0 2px rgba(16,185,129,0.15);'
                                : 'border:1px solid #e2e8f0; background:#f8fafc; color:#c0cad6; opacity:0.7; font-weight:600;'
                             }">
                      완료
                    </button>
                  </div>
                ` : ''}
             </div>
             
             <!-- Title & Modern Category Badge + Minimalist Line Vector Icon -->
             <div style="font-size:15px; font-weight:800; color:var(--text-100); display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap;">
                ${(() => {
                  let rawTitle = (ev.title || '').trim();
                  
                  // 1. 기존 데이터에 포함된 투박한 유니코드 이모지 일괄 제거
                  const cleanTitle = rawTitle.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '').trim();
                  
                  // SF Symbols / iOS 모던 라인 벡터 아이콘 매핑
                  const getLineIcon = (type) => {
                    const strokeStyle = 'width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"';
                    if (type === 'shop') {
                      return `<svg ${strokeStyle}><path d="m14 4 6 6-9 9H5v-6l9-9z"/><path d="M18 8l-2-2"/></svg>`;
                    } else if (type === 'car') {
                      return `<svg ${strokeStyle}><path d="M5 11l2-6h10l2 6"/><rect x="3" y="11" width="18" height="8" rx="2"/><circle cx="7.5" cy="15.5" r="1.5"/><circle cx="16.5" cy="15.5" r="1.5"/></svg>`;
                    } else if (type === 'main') {
                      return `<svg ${strokeStyle}><rect x="2" y="4" width="20" height="16" rx="3"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`;
                    } else if (type === 'finish') {
                      return `<svg ${strokeStyle}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`;
                    } else if (type === 'rest') {
                      return `<svg ${strokeStyle}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
                    }
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

                  // 태그 또는 텍스트 내용 기반 스마트 분류
                  const lowerText = cleanTitle.toLowerCase();
                  if (tag.includes('헤어') || tag.includes('메이크업') || lowerText.includes('도착 및 스타일링') || lowerText.includes('헤메') || lowerText.includes('스타일링')) {
                    tag = '헤어·메이크업';
                    badgeStyle = 'background:rgba(139, 92, 246, 0.15); color:#c084fc; border:1px solid rgba(139, 92, 246, 0.3);';
                    iconType = 'shop';
                    restText = restText.replace(/^\[?헤어[\/·]메이크업\]?\s*/, '');
                  } else if (tag.includes('픽업') || lowerText.includes('픽업 및 출발')) {
                    tag = '픽업 출발';
                    badgeStyle = 'background:rgba(59, 130, 246, 0.15); color:#60a5fa; border:1px solid rgba(59, 130, 246, 0.3);';
                    iconType = 'car';
                    restText = restText.replace(/^\[?픽업 출발\]?\s*/, '');
                  } else if (tag.includes('이동') || tag.includes('출발') || lowerText.includes('이동 출발') || lowerText.includes('출발 및 이동')) {
                    tag = '현장 이동';
                    badgeStyle = 'background:rgba(59, 130, 246, 0.15); color:#60a5fa; border:1px solid rgba(59, 130, 246, 0.3);';
                    iconType = 'car';
                    restText = restText.replace(/^\[?현장 이동\]?\s*/, '');
                  } else if (tag.includes('철수') || tag.includes('복귀') || lowerText.includes('철수') || lowerText.includes('복귀 이동')) {
                    tag = '현장 철수';
                    badgeStyle = 'background:rgba(16, 185, 129, 0.15); color:#34d399; border:1px solid rgba(16, 185, 129, 0.3);';
                    iconType = 'finish';
                    restText = restText.replace(/^\[?현장 철수\]?\s*/, '');
                  } else if (tag.includes('휴식') || tag.includes('식사') || tag.includes('대기') || lowerText.includes('대기/휴식') || lowerText.includes('식사 및 이동')) {
                    tag = '대기·휴식';
                    badgeStyle = 'background:rgba(245, 158, 11, 0.15); color:#fbbf24; border:1px solid rgba(245, 158, 11, 0.3);';
                    iconType = 'rest';
                    restText = restText.replace(/^\[?(대기\/휴식|식사\/정비|대기·휴식)\]?\s*/, '');
                  } else if (tag.includes('메인') || lowerText.includes('메인 일정') || lowerText.includes('방송') || lowerText.includes('공연') || lowerText.includes('촬영')) {
                    tag = '메인 일정';
                    badgeStyle = 'background:rgba(99, 102, 241, 0.2); color:#818cf8; border:1px solid rgba(99, 102, 241, 0.35);';
                    iconType = 'main';
                    restText = restText.replace(/^\[?메인 일정\]?\s*/, '');
                  }

                  if (!tag) {
                    tag = '일정';
                  }

                  return `
                    <span style="display:inline-flex; align-items:center; gap:5px; padding:3px 9px; border-radius:7px; font-size:11px; font-weight:800; letter-spacing:-0.2px; ${badgeStyle}">
                      ${getLineIcon(iconType)}
                      <span>${tag}</span>
                    </span>
                    <span style="${isDone ? 'text-decoration:line-through; color:#94a3b8;' : 'color:var(--text-100);'} line-height:1.35; font-size:15px; font-weight:800;">${restText || cleanTitle}</span>
                  `;
                })()}
             </div>
             
             <!-- Description / Notes -->
             ${ev.desc ? `<div style="font-size:12px; color:var(--text-400); margin-top:2px; line-height:1.4;">${ev.desc}</div>` : ''}

              <!-- 하단: 아티스트 & 배차 정보 + [티맵] [카카오] 네비게이션 버튼 (이동 단계에서만 표시) -->
              <div style="margin-top:10px; padding-top:8px; border-top:1px dashed rgba(0,0,0,0.06); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div style="font-size:11px; color:#64748b; display:flex; align-items:center; gap:6px;">
                  ${ev.artistName ? `<span>✨ <strong>${ev.artistName}</strong></span>` : ''}
                  ${ev.vehicleName ? `<span>🚗 ${ev.vehicleName}</span>` : ''}
                </div>

                ${isDriveStep ? `
                  <div style="display:flex; align-items:center; gap:6px; margin-left:auto; flex:1; max-width:180px; justify-content:flex-end;">
                    <button type="button" onclick="U.openNavigation('${destinationTarget.replace(/'/g, "\\'")}', '', 'tmap')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 0; border-radius:6px; background:#000000; color:#ffffff; font-size:11px; font-weight:800; border:none; cursor:pointer;" title="티맵 길안내">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff" style="margin-top:-1px"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16zM11.99 1.5L2.5 9l9.49 7.5L21.5 9l-9.51-7.5z"/></svg>
                      TMAP
                    </button>
                    <button type="button" onclick="U.openNavigation('${destinationTarget.replace(/'/g, "\\'")}', '', 'kakao')" style="flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:6px 0; border-radius:6px; background:#fee500; color:#191919; font-size:11px; font-weight:800; border:none; cursor:pointer;" title="카카오내비 길안내">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#191919" style="margin-top:-1px"><path d="M12 3c-5.523 0-10 3.553-10 7.938 0 2.825 1.83 5.303 4.606 6.744l-1.01 3.7c-.053.195.166.353.332.227l4.316-2.82c.575.08 1.162.124 1.756.124 5.523 0 10-3.553 10-7.938C22 6.553 17.523 3 12 3z"/></svg>
                      카카오내비
                    </button>
                  </div>
                ` : ''}
              </div>

          </div>
        </div>
      `;
    });

    html += '</div>';
    return html;
  },

  // 동선 타임라인에서 [이동중] 또는 [완료] 선택 시 본사 포털과 실시간 연동 및 타임스탬프 기록
  setHQRouteStatus(hqId, stepIdx, targetStatus) {
    if (typeof window.hqStore === 'undefined') return;

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

    // 상태 변경 후 → 항상 다음 진행해야 할 단계를 맨 위로 스크롤
    setTimeout(() => {
      const updatedSch = window.hqStore.getSchedules().find(s => s.id === hqId);
      if (!updatedSch?.timeline) return;

      // 우선순위 1: 현재 이동중(moving=true)인 단계
      let targetIdx = updatedSch.timeline.findIndex(t => t.moving === true);

      // 우선순위 2: 이동중 없으면 → 첫 번째 미완료 단계
      if (targetIdx === -1) {
        targetIdx = updatedSch.timeline.findIndex(t => !t.done);
      }

      if (targetIdx !== -1) {
        const el = document.getElementById(`route-step-${hqId}-${targetIdx}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
           <label class="field-label" style="font-size:13px; color:var(--text-400); display:block; margin-bottom:6px;">메모/일정 제목</label>
           <input type="text" id="cs-title" placeholder="예: 현장 간식 구매, 의상 픽업" style="width:100%; padding:12px; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-input); font-size:15px;" />
        </div>
        <div class="field" style="margin-bottom:16px;">
           <label class="field-label" style="font-size:13px; color:var(--text-400); display:block; margin-bottom:6px;">시간 (HH:MM)</label>
           <input type="time" id="cs-time" value="12:00" style="width:100%; padding:12px; border:1px solid var(--border-default); border-radius:8px; background:var(--bg-input); font-size:15px;" />
        </div>
        <div class="field" style="margin-bottom:16px;">
           <label class="field-label" style="font-size:13px; color:var(--text-400); display:block; margin-bottom:6px;">예상 소요 시간 (분)</label>
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
  }
};
