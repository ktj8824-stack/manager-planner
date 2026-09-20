/* =========================================
   ManagerPlanner — Timeline Screen
   Multi-step: Pickup → Shop → Venue → Event
   ========================================= */

const Timeline = {
  schedIdx: 0,
  audioCtx: null,
  oscillator: null,
  alarmInterval: null,

  init(idx) {
    this.schedIdx = idx !== undefined ? idx : State.currentScheduleIdx;
    this.render();
  },

  render() {
    const el = U.$('#screen-timeline');
    const s = State.schedules[this.schedIdx];
    if (!s) { el.innerHTML = '<div class="empty"><div class="empty-icon"><svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--text-500);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><h2 class="empty-title">일정이 없습니다</h2></div>'; return; }

    const tl = s.timeline;
    const dday = U.dday(s.date);
    const dateStr = U.fmtDateShort(s.date);

    el.innerHTML = `
      <div class="header">
        <button class="header-btn" onclick="App.navigate('home')">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="header-title">스마트 타임라인</h1>
        <button class="header-btn" onclick="U.downloadICS(State.schedules[${this.schedIdx}])">
          <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>
      </div>

      <div class="screen-scroll" style="padding-top:0;">
        <!-- Hero -->
        <div class="tl-hero">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h2 class="tl-course" style="margin:0;"><span class="accent">${(s.course && s.course.name) || s.title || s.artistName || '스케줄'}</span></h2>
            <div class="tl-dday" style="display:inline-flex; align-items:center; gap:6px; font-size:15px; padding:6px 12px; margin:0;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${dday}</span>
            </div>
          </div>
          <div class="tl-meta" style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
            <span style="display:inline-flex; align-items:center; gap:4px;">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.75;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${dateStr}
            </span>
            <span style="display:inline-flex; align-items:center; gap:4px;">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.75;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${(s.teeOff || s.startTime) ? U.fmtTimeKo(s.teeOff || s.startTime) : '시간 미정'}
            </span>
            <span style="display:inline-flex; align-items:center; gap:4px;">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.75;"><path d="M12 2c3.866 0 7 3.134 7 7 0 5.25-7 13-7 13S5 14.25 5 9c0-3.866 3.134-7 7-7z"></path><circle cx="12" cy="9" r="2.5"></circle></svg>
              ${(s.course && s.course.region) || s.location || '장소 미정'}
            </span>
          </div>
        </div>


        <!-- Timeline -->
        <div class="tl-section">
          <div class="tl-head" style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
            <div style="flex: 1; min-width: 0;">
              <h3 class="tl-title" style="display:flex; align-items:center; gap:6px; margin-bottom: 4px;">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                타임라인
              </h3>
              <p class="tl-sub">${tl.hasMeal ? '출발지 → 식당 → 일정코스 동선 연산' : '출발지 → 일정코스 최적 경로'}</p>
            </div>
            <div style="display:flex; gap:6px; align-items:center; flex-shrink: 0;">
              <div class="chip chip-accent chip-live">실시간</div>
              <button style="border:1px solid var(--gold-500); background:var(--gold-dim); color:var(--gold-400); cursor:pointer; padding: 4px 12px; font-size: 14px; font-weight: bold; border-radius: 20px; line-height: 1.2; white-space: nowrap;" onclick="Register.edit(${this.schedIdx})">
                ✏️ 일정 수정
              </button>
            </div>
          </div>

          <div class="tl-list">
            ${this.renderTimelineItems(s, tl)}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-acts" style="display:flex; gap:12px; padding:0 var(--sp-5) var(--sp-5); overflow-x:auto; white-space:nowrap;">
          <button class="qact" onclick="Timeline.showCareInfo()">
            <span class="qact-icon" style="display:inline-flex; width:36px; height:36px; align-items:center; justify-content:center; border-radius:50%; background:rgba(245, 158, 11, 0.15); color:#f59e0b;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px;"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </span>
            <span>아티스트 케어</span>
          </button>
          <button class="qact" onclick="Timeline.copyBriefing()">
            <span class="qact-icon" style="display:inline-flex; width:36px; height:36px; align-items:center; justify-content:center; border-radius:50%; background:rgba(52, 199, 89, 0.15); color:var(--ios-green);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            </span>
            <span>공지 복사</span>
          </button>
          <button class="qact" onclick="Timeline.showChecklist()">
            <span class="qact-icon" style="display:inline-flex; width:36px; height:36px; align-items:center; justify-content:center; border-radius:50%; background:var(--accent-dim); color:var(--accent);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="width:20px; height:20px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <span>준비물 체크</span>
          </button>
          <button class="qact" onclick="U.downloadICS(State.schedules[${this.schedIdx}])">
            <span class="qact-icon" style="display:inline-flex; width:36px; height:36px; align-items:center; justify-content:center; border-radius:50%; background:rgba(142, 142, 147, 0.15); color:var(--text-300);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px; height:18px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </span>
            <span>일정 연동</span>
          </button>
          <button class="qact" onclick="U.openNativeAlarm(${this.schedIdx})">
            <span class="qact-icon" style="display:inline-flex; width:36px; height:36px; align-items:center; justify-content:center; border-radius:50%; background:rgba(255, 59, 48, 0.15); color:var(--ios-red);">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px;"><circle cx="12" cy="13" r="8"></circle><path d="M12 9v4l2 2"></path><path d="M5 3L2 6"></path><path d="M19 3l3 3"></path></svg>
            </span>
            <span>기상 알람</span>
          </button>
        </div>

        <!-- Companions -->
        ${this.renderCompanions(s.companions)}

        <!-- Status Progress -->
        <div style="padding: 0 var(--sp-5) var(--sp-5);">
          ${this.renderStatusProgress(s)}
        </div>

        <!-- Delete Plan -->
        <div style="padding:var(--sp-4) var(--sp-5) calc(var(--sp-5) * 2); text-align:center;">
          <button class="btn" style="background:transparent; border:1px solid rgba(255,59,48,0.3); color:var(--red-400); width:100%; font-size:var(--fs-sm);" onclick="Timeline.deleteSchedule()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px; vertical-align:-3px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            이 일정 삭제하기
          </button>
        </div>
      </div>
    `;

    this.hidePastItems();
    setTimeout(() => U.stagger(U.$('.tl-list'), '.tl-item:not([style*="display: none"])', 120), 200);
  },

  hidePastItems() {
    const s = State.schedules[this.schedIdx];
    if (!s) return;
    
    // We only hide items if the schedule date is today or in the past
    // If it's in the future, we don't hide anything.
    const now = new Date();
    let isToday = false;
    let isPastDate = false;

    if (s.date) {
      const sDate = new Date(s.date);
      if (sDate.getFullYear() === now.getFullYear() && sDate.getMonth() === now.getMonth() && sDate.getDate() === now.getDate()) {
        isToday = true;
      } else if (sDate < now) {
        isPastDate = true;
      }
    } else {
      // If no date is set, assume it's today for demonstration purposes
      isToday = true;
    }

    if (!isToday && !isPastDate) {
      // Future date - mark the first item as 'now'
      const firstItem = U.$('.tl-item');
      if (firstItem) firstItem.classList.add('now');
      return;
    }

    const items = document.querySelectorAll('.tl-item');
    let foundNow = false;

    // Extract times for all items first
    const itemData = Array.from(items).map(item => {
      const timeEl = item.querySelector('.tl-time');
      let timeTotal = 0;
      if (timeEl) {
        const [h, m] = timeEl.innerText.trim().split(':').map(Number);
        timeTotal = h * 60 + m;
      }
      return { item, time: timeTotal };
    });

    const nowTotal = now.getHours() * 60 + now.getMinutes();

    itemData.forEach((data, index) => {
      const { item, time } = data;
      if (time === 0) return; // Skip items without time
      
      let isPastTime = false;
      let shouldHide = false;

      if (isPastDate) {
        isPastTime = true;
        shouldHide = false; // Do not hide for past days
      } else if (isToday) {
        // An event is only fully "past" (and hidden) if the NEXT event has already started
        let nextTime = Infinity;
        if (index < itemData.length - 1) {
          nextTime = itemData[index + 1].time;
        } else {
          // If it's the very last event (e.g. arrival), hide it 2 hours after it begins
          nextTime = time + 120;
        }

        if (nextTime <= nowTotal) {
          isPastTime = true;
          shouldHide = true; // Hide if the NEXT schedule has arrived
        }
      }

      if (isPastTime) {
        if (shouldHide) {
          item.style.display = 'none';
        } else {
          item.style.display = 'block';
        }
        item.classList.remove('now');
        item.classList.add('done');
      } else {
        item.style.display = 'block';
        if (!foundNow) {
          item.classList.add('now'); // This makes the CURRENTLY ongoing event highlighted!
          foundNow = true;
        } else {
          item.classList.remove('now');
        }
      }
    });

    // If all items are in the past and hidden, maybe show a message
    const visibleItems = document.querySelectorAll('.tl-item[style*="display: block"]');
    if (visibleItems.length === 0) {
      const list = U.$('.tl-list');
      if (list && !U.$('.tl-empty-msg')) {
        list.innerHTML += `<div class="tl-empty-msg" style="text-align:center; padding:40px 20px; color:var(--text-400);">모든 일정이 종료되었습니다. 수고하셨습니다! 👏</div>`;
      }
    }
  },

  deleteSchedule() {
    if (confirm("정말로 이 일정을 삭제하시겠습니까?")) {
      State.schedules.splice(this.schedIdx, 1);
      State.saveSchedules();
      App.navigate('home');
      U.toast('🗑️ 일정이 삭제되었습니다.');
    }
  },

  renderRouteSummary(s, tl) {
    const startPt = s.startPoint || '집';
    let startSvg = `<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
    if (startPt.includes('회사') || startPt.includes('사무실')) {
      startSvg = `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`;
    } else if (startPt.includes('집') || startPt.includes('자택')) {
      startSvg = `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`;
    }

    if (tl.hasMeal) {
      return `
        <div class="route-summary">
          <div class="route-node active">
            <div class="route-icon">${startSvg}</div>
            <span class="route-label">${startPt.slice(0, 5)}</span>
          </div>
          <div class="route-arrow"><span class="route-time">${tl.homeTravelDur}분</span></div>
          <div class="route-node gold">
            <div class="route-icon">
              <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
            <span class="route-label">${tl.restaurantName.slice(0, 5)}</span>
          </div>
          <div class="route-arrow"><span class="route-time">${tl.restTravelDur}분</span></div>
          <div class="route-node">
            <div class="route-icon">
              <svg viewBox="0 0 24 24"><path d="M4 22V2l10 5-10 5"></path></svg>
            </div>
            <span class="route-label">${s.course.name.slice(0,6)}</span>
          </div>
        </div>
      `;
    }
    return `
      <div class="route-summary">
        <div class="route-node active">
          <div class="route-icon">${startSvg}</div>
          <span class="route-label">${startPt.slice(0, 5)}</span>
        </div>
        <div class="route-arrow"><span class="route-time">${tl.homeTravelDur}분</span></div>
        <div class="route-node">
          <div class="route-icon">
            <svg viewBox="0 0 24 24"><path d="M4 22V2l10 5-10 5"></path></svg>
          </div>
          <span class="route-label">${s.course.name.slice(0,6)}</span>
        </div>
      </div>
    `;
  },

  renderTimelineItems(s) {
    const steps = this.getTimelineSteps(s);
    if (!steps || steps.length === 0) return '<div style="text-align:center; padding:20px; color:var(--text-400);">타임라인 정보가 없습니다.</div>';

    const tmapIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" style="margin-top:-1px"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16zM11.99 1.5L2.5 9l9.49 7.5L21.5 9l-9.51-7.5z"/></svg>`;
    const kakaoIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="#191919" style="margin-top:-1px"><path d="M12 3c-5.523 0-10 3.553-10 7.938 0 2.825 1.83 5.303 4.606 6.744l-1.01 3.7c-.053.195.166.353.332.227l4.316-2.82c.575.08 1.162.124 1.756.124 5.523 0 10-3.553 10-7.938C22 6.553 17.523 3 12 3z"/></svg>`;

    const destName = s.location || (s.course && s.course.name) || '현장';
    const destLat = s.lat || (s.course && s.course.lat) || 37.5665;
    const destLng = s.lng || (s.course && s.course.lng) || 126.9780;

    let items = '';
    steps.forEach((step) => {
      const isDone = step.done;
      const doneClass = isDone ? 'done' : '';
      const checkMark = isDone ? ` <span style="color:var(--accent); font-weight:bold;">[${step.actualTime ? step.actualTime + ' ' : ''}완료]</span>` : '';
      
      items += `
        <div class="tl-item ${doneClass}" data-time="${step.time}">
          <div class="tl-dot" style="${isDone ? 'background:var(--accent); border-color:var(--accent);' : ''}"></div>
          <div class="tl-card" style="${isDone ? 'opacity:0.65;' : ''}">
            <div class="tl-time">${step.time || ''}</div>
            <div class="tl-event" style="display:flex; align-items:center; justify-space-between;">
              <span style="${isDone ? 'text-decoration:line-through;' : ''}">${step.label}${checkMark}</span>
            </div>
            ${!isDone && (step.label.includes('출발') || step.label.includes('도착')) ? `
              <div class="tl-nav-btns" style="margin-top:8px;">
                <button class="tl-nav-btn tmap" onclick="Timeline.openNav('tmap','${destName}',${destLat},${destLng})">${tmapIcon} TMAP</button>
                <button class="tl-nav-btn kakao" onclick="Timeline.openNav('kakao','${destName}',${destLat},${destLng})">${kakaoIcon} 카카오내비</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    return items;
  },

  renderCompanions(companions) {
    if (!companions || !companions.length) return '';
    return `
      <div class="comp-section">
        <div class="comp-card">
          <div class="comp-head">
            <h3 class="comp-title">💬 스태프 방</h3>
            <span class="chip chip-gold">${companions.length}명</span>
          </div>
          <div class="comp-list">
            ${companions.map(c => `
              <div class="comp-row">
                <div class="comp-info">
                  <div class="comp-avatar" style="background:linear-gradient(135deg,${c.color},${c.color}88)">${c.emoji}</div>
                  <div>
                    <div class="comp-name">${c.name}</div>
                    <div class="comp-status">대기 중</div>
                  </div>
                </div>
                <button class="status-btn" onclick="Timeline.toggleStatus(this,'${c.name}')">출발함</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  openNav(app, destName, destLat, destLng, startName='', startLat=0, startLng=0) {
    if (app === 'tmap') {
      U.toast(`🗺️ Tmap으로 길안내를 시작합니다: ${destName}`);
      if (startLat && startLng) {
        window.location.href = `tmap://route?startname=${encodeURIComponent(startName)}&startx=${startLng}&starty=${startLat}&goalname=${encodeURIComponent(destName)}&goalx=${destLng}&goaly=${destLat}`;
      } else {
        window.location.href = `tmap://route?goalname=${encodeURIComponent(destName)}&goalx=${destLng}&goaly=${destLat}`;
      }
    } else if (app === 'kakao') {
      U.toast(`🚙 카카오맵/내비로 길안내를 시작합니다: ${destName}`);
      if (startLat && startLng) {
        window.location.href = `kakaomap://route?sp=${startLat},${startLng}&ep=${destLat},${destLng}&by=CAR`;
      } else {
        window.location.href = `https://map.kakao.com/link/to/${encodeURIComponent(destName)},${destLat},${destLng}`;
      }
    }
  },

  toggleAlarm() {
    const btn = U.$('#tl-alarm-btn');
    if (!btn) return;
    
    const isAlarmOn = btn.classList.contains('alarm-on');
    if (isAlarmOn) {
      btn.classList.remove('alarm-on');
      btn.innerHTML = '🔔 알람 켜기';
      btn.style.background = 'transparent';
      btn.style.color = 'var(--accent)';
      
      if (this.alarmTimeouts) {
        this.alarmTimeouts.forEach(id => clearTimeout(id));
        this.alarmTimeouts = [];
      }
      
      U.toast('동선 타임라인 알람이 해제되었습니다.');
    } else {
      btn.classList.add('alarm-on');
      btn.innerHTML = '🔔 알람 켜짐';
      btn.style.background = 'var(--accent)';
      btn.style.color = '#fff';
      
      this.initAudioContext();
      
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            U.toast('실제 타임라인 일정에 맞춰 알람이 예약되었습니다!');
            this.scheduleTimelineAlarms();
          } else {
            U.toast('알림 권한이 차단되어 푸시 알림을 보낼 수 없습니다.');
          }
        });
      } else {
        U.toast('알림을 지원하지 않는 기기입니다.');
      }
    }
  },

  scheduleTimelineAlarms() {
    this.alarmTimeouts = this.alarmTimeouts || [];
    const s = State.schedules[this.schedIdx];
    if (!s || !s.timeline) return;
    
    const tl = s.timeline;
    const dateStr = s.date;
    
    const getDelay = (timeStr) => {
      if (!timeStr) return -1;
      const [hour, min] = timeStr.split(':').map(Number);
      const targetDate = new Date(dateStr);
      targetDate.setHours(hour, min, 0, 0);
      return targetDate.getTime() - Date.now();
    };

    const events = [];
    if (tl.prepStart) events.push({ time: tl.prepStart, msg: '준비 시작 - 착장 의상과 큐시트, 비상용품을 챙겨주세요!' });
    if (tl.homeDepart) events.push({ time: tl.homeDepart, msg: '출발 시간입니다! 목적지로 출발하세요 🚗' });
    if (tl.mealStart) events.push({ time: tl.mealStart, msg: '식사 시간입니다. 든든하게 드세요 🍽️' });
    if (tl.restDepart) events.push({ time: tl.restDepart, msg: '스케줄 현장으로 출발할 시간입니다 🚙' });
    if (tl.arrival) events.push({ time: tl.arrival, msg: '현장 도착 시간입니다. 대기실 세팅 및 마이크를 확인하세요 🎬' });
    if (tl.teeOff) events.push({ time: tl.teeOff, msg: '곧 스케줄 콜타임입니다! 완벽한 현장을 만들어보세요 ✨' });

    let scheduledCount = 0;
    events.forEach(ev => {
      const delay = getDelay(ev.time);
      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          new Notification('매니저플래너 타임라인', {
            body: ev.msg,
            icon: 'assets/icons/icon-192x192.png'
          });
          if (ev.time === tl.prepStart) {
            Timeline.playAlarmSound(ev.msg);
          }
        }, delay);
        this.alarmTimeouts.push(timeoutId);
        scheduledCount++;
      }
    });

    if (scheduledCount === 0) {
      U.toast('오늘 이후의 일정이거나 이미 지난 일정이라 알람을 예약하지 않았습니다.');
    }
  },

  toggleStatus(btn, name) {
    const row = btn.closest('.comp-row');
    const st = row.querySelector('.comp-status');
    if (btn.textContent.trim() === '출발함') {
      btn.textContent = '도착함'; st.textContent = '🚗 이동 중'; st.className = 'comp-status departed';
      U.toast(`${name}님에게 출발 알림을 보냈습니다 🚗`);
    } else {
      btn.textContent = '완료'; btn.disabled = true; btn.style.opacity = '0.4';
      st.textContent = '✅ 도착 완료'; st.className = 'comp-status arrived';
      U.toast(`${name}님에게 도착 알림을 보냈습니다 ✅`);
    }
    U.haptic();
  },

  showChecklist() {
    const icons = ['🎒','📏','🎬','🧤','☀️','🧺'];
    const items = CHECKLIST.map((c,i) => `
      <div class="modal-item" onclick="this.classList.toggle('selected');U.haptic();">
        <div class="modal-item-icon">${icons[i]}</div>
        <span class="modal-item-text">${c}</span>
        <div class="modal-item-check">✓</div>
      </div>
    `).join('');
    App.showModal('✅ 스케줄 체크리스트', items);
  },

  initAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },

  playAlarmSound(msg) {
    if (!this.audioCtx) this.initAudioContext();
    
    // Create an intermittent beep sound
    let isBeep = true;
    this.alarmInterval = setInterval(() => {
      if (isBeep) {
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'square';
        this.oscillator.frequency.setValueAtTime(880, this.audioCtx.currentTime); // A5 note
        this.oscillator.connect(this.audioCtx.destination);
        this.oscillator.start();
        setTimeout(() => { if (this.oscillator) { this.oscillator.stop(); this.oscillator.disconnect(); this.oscillator = null; } }, 200);
      }
      isBeep = !isBeep;
    }, 400);

    // Show modal to stop alarm
    const stopHtml = `
      <div style="text-align:center; padding:var(--sp-4);">
        <div style="font-size:3rem; margin-bottom:var(--sp-3);">⏰</div>
        <p style="font-size:var(--fs-lg); margin-bottom:var(--sp-5);">${msg}</p>
        <button class="btn btn-gold" style="width:100%;" onclick="Timeline.stopAlarmSound()">알람 끄기</button>
      </div>
    `;
    App.showModal('🚨 준비 시작 시간 알람', stopHtml);
    
    // Fallback: stop automatically after 30 seconds
    setTimeout(() => this.stopAlarmSound(), 30000);
  },

  stopAlarmSound() {
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.oscillator) {
      try { this.oscillator.stop(); this.oscillator.disconnect(); } catch(e) {}
      this.oscillator = null;
    }
    App.closeModal();
  },

  getTimelineSteps(s) {
    const tl = s.timeline || {};
    if (Array.isArray(tl)) {
      return tl.map(t => ({
        time: t.time || '',
        label: t.label || '',
        done: !!t.done,
        actualTime: t.actualTime || ''
      }));
    }
    
    let steps = [];
    if (tl.prepStart) steps.push({ key: 'prep', time: tl.prepStart, label: '준비 시작', done: !!s._done_prep, actualTime: s._actualTime_prep || '' });
    if (tl.homeDepart) steps.push({ key: 'depart', time: tl.homeDepart, label: '픽업 및 출발', done: !!s._done_depart, actualTime: s._actualTime_depart || '' });
    if (tl.hasMeal && tl.mealStart) steps.push({ key: 'shop_arr', time: tl.mealStart, label: '샵/식당 도착', done: !!s._done_shop_arr, actualTime: s._actualTime_shop_arr || '' });
    if (tl.hasMeal && tl.restDepart) steps.push({ key: 'shop_dep', time: tl.restDepart, label: '현장으로 출발', done: !!s._done_shop_dep, actualTime: s._actualTime_shop_dep || '' });
    if (tl.arrival) steps.push({ key: 'arrive', time: tl.arrival, label: '현장 도착', done: !!s._done_arrive, actualTime: s._actualTime_arrive || '' });
    if (tl.teeOff) steps.push({ key: 'start', time: tl.teeOff, label: '스케줄 시작', done: !!s._done_start, actualTime: s._actualTime_start || '' });
    if (tl.hasPostMeal && tl.postMealStart) steps.push({ key: 'post', time: tl.postMealStart, label: '뒷풀이', done: !!s._done_post, actualTime: s._actualTime_post || '' });
    if (tl.returnStart) steps.push({ key: 'return', time: tl.returnStart, label: '복귀', done: !!s._done_return, actualTime: s._actualTime_return || '' });
    return steps;
  },

  renderStatusProgress(s) {
    if (!s) return '';
    const steps = this.getTimelineSteps(s);
    if (!steps.length) return '';
    
    const nextItem = steps.find(t => !t.done);
    if (nextItem) {
      let label = nextItem.label.replace(/🎬 |🏁 |💄 |🚗 /g, '');
      return `<button class="btn btn-primary" style="width:100%; font-size:16px; padding:14px;" onclick="Timeline.advanceStatus()">✅ 실시간 상태 전송: ${label}</button>`;
    } else {
      return `<button class="btn" style="width:100%; font-size:16px; padding:14px;" disabled>🎉 모든 일정이 완료되었습니다</button>`;
    }
  },

  advanceStatus() {
    const s = State.schedules[this.schedIdx];
    if (!s) return;
    
    const steps = this.getTimelineSteps(s);
    const nextIdx = steps.findIndex(t => !t.done);
    
    if (nextIdx !== -1) {
      const nextItem = steps[nextIdx];
      
      const now = new Date();
      const actualTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      if (Array.isArray(s.timeline)) {
        s.timeline[nextIdx].done = true;
        s.timeline[nextIdx].actualTime = actualTime;
      } else {
        s[`_done_${nextItem.key}`] = true;
        s[`_actualTime_${nextItem.key}`] = actualTime;
      }
      
      const allDone = (nextIdx === steps.length - 1);
      s.status = allDone ? '완료' : '진행중';
      
      State.saveSchedules();
      if (window.hqStore) window.hqStore.saveSchedule(s);
      
      let label = nextItem.label.replace(/🎬 |🏁 |💄 |🚗 /g, '');
      U.toast(`📡 본사 관제센터로 전송완료: [${label} - ${actualTime}]`);
      
      this.render();
    }
  },

  copyBriefing() {
    const s = State.schedules[this.schedIdx];
    if (!s) return;
    
    const steps = this.getTimelineSteps(s);
    let text = `[내일 ${s.artistName || '아티스트'} 스케줄 안내]\n`;
    
    steps.forEach(t => {
      let label = t.label.replace(/🎬 |🏁 |💄 |🚗 /g, '');
      if (label.includes('픽업')) label = `숙소 픽업 (${s.vehicleName || '차량 미지정'})`;
      else if (label.includes('메이크업') || label.includes('샵')) label = `${s.shop?.name || '샵'} (헤어/메이크업)`;
      else if (label.includes('현장 도착') || label.includes('현장으로')) label = `${s.location || '현장'} 도착`;
      text += `- ${t.time} : ${label}\n`;
    });
    
    if (s.outfit || s.supplies) {
      text += `* 준비물: ${s.outfit ? s.outfit : ''}${s.outfit && s.supplies ? ', ' : ''}${s.supplies ? s.supplies : ''}\n`;
    }
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        U.toast('📋 카카오톡 일정 브리핑 텍스트가 복사되었습니다!');
      }).catch(err => {
        U.toast('텍스트 복사에 실패했습니다.');
      });
    } else {
      U.toast('클립보드 API를 지원하지 않는 기기입니다.');
    }
  },

  async showCareInfo() {
    const s = State.schedules[this.schedIdx];
    if (!s || !s.artistId) {
      U.toast('아티스트 정보가 없습니다.');
      return;
    }

    const artists = await window.hqStore.getArtists();
    const artist = artists.find(a => a.id === s.artistId);
    if (!artist) {
      U.toast('아티스트 정보를 불러올 수 없습니다.');
      return;
    }

    const care = artist.care_info || {};

    const content = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="background:var(--bg-input); padding:16px; border-radius:12px; border:1px solid var(--border-subtle);">
          <label style="display:block; font-size:13px; color:var(--text-400); margin-bottom:6px; font-weight:600;">🚫 알러지 / 주의사항</label>
          <input type="text" id="mob-care-allergies" value="${care.allergies || ''}" style="width:100%; padding:10px; border-radius:8px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-100); font-size:15px;" placeholder="예) 복숭아, 갑각류">
        </div>
        <div style="background:var(--bg-input); padding:16px; border-radius:12px; border:1px solid var(--border-subtle);">
          <label style="display:block; font-size:13px; color:var(--text-400); margin-bottom:6px; font-weight:600;">☕ 선호 식음료</label>
          <input type="text" id="mob-care-beverages" value="${care.beverages || ''}" style="width:100%; padding:10px; border-radius:8px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-100); font-size:15px;" placeholder="예) 아이스 아메리카노">
        </div>
        <div style="background:var(--bg-input); padding:16px; border-radius:12px; border:1px solid var(--border-subtle);">
          <label style="display:block; font-size:13px; color:var(--text-400); margin-bottom:6px; font-weight:600;">🚙 차량 세팅</label>
          <input type="text" id="mob-care-vehicle" value="${care.vehicle_pref || ''}" style="width:100%; padding:10px; border-radius:8px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-100); font-size:15px;" placeholder="예) 조수석 선호, 에어컨 약하게">
        </div>
        <div style="background:var(--bg-input); padding:16px; border-radius:12px; border:1px solid var(--border-subtle);">
          <label style="display:block; font-size:13px; color:var(--text-400); margin-bottom:6px; font-weight:600;">💊 비상 약품 / 메모</label>
          <input type="text" id="mob-care-emergency" value="${care.emergency || ''}" style="width:100%; padding:10px; border-radius:8px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-100); font-size:15px;" placeholder="비상 메모 입력">
        </div>
        <div style="background:var(--bg-input); padding:16px; border-radius:12px; border:1px solid var(--border-subtle);">
          <label style="display:block; font-size:13px; color:var(--text-400); margin-bottom:6px; font-weight:600;">📞 스태프 연락처</label>
          <input type="text" id="mob-care-contacts" value="${care.contacts || ''}" style="width:100%; padding:10px; border-radius:8px; background:transparent; border:1px solid rgba(255,255,255,0.1); color:var(--text-100); font-size:15px;" placeholder="헤어: 010-...">
        </div>
        <button class="btn btn-primary" style="margin-top:8px; padding:16px; font-size:16px; border-radius:12px;" onclick="Timeline.saveCareInfo('${artist.id}')">💾 현장 변경사항 업데이트</button>
      </div>
    `;

    App.showBottomSheet(`${artist.emoji || '✨'} ${artist.name} 케어 정보`, content);
  },

  async saveCareInfo(artistId) {
    const careInfo = {
      allergies: document.getElementById('mob-care-allergies').value.trim(),
      beverages: document.getElementById('mob-care-beverages').value.trim(),
      vehicle_pref: document.getElementById('mob-care-vehicle').value.trim(),
      emergency: document.getElementById('mob-care-emergency').value.trim(),
      contacts: document.getElementById('mob-care-contacts').value.trim()
    };

    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        await window.SupabaseClient.updateArtistCareInfo(artistId, careInfo);
        
        // Update local memory
        const artists = await window.hqStore.getArtists();
        const idx = artists.findIndex(a => a.id === artistId);
        if (idx !== -1) {
          artists[idx].care_info = careInfo;
          window.hqStore.saveArtists(artists);
        }
        
        U.toast('아티스트 케어 정보가 업데이트 되었습니다.');
        App.closeBottomSheet();
      } catch (err) {
        U.toast('업데이트 실패: ' + err.message);
      }
    } else {
      // Local mode
      const artists = await window.hqStore.getArtists();
      const idx = artists.findIndex(a => a.id === artistId);
      if (idx !== -1) {
        artists[idx].care_info = careInfo;
        window.hqStore.saveArtists(artists);
      }
      U.toast('로컬 모드: 아티스트 케어 정보가 업데이트 되었습니다.');
      App.closeBottomSheet();
    }
  }
};
