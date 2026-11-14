/* =========================================
   RoadPlanner — Utilities
   ========================================= */

const U = {
  /* ── Environment Aware HQ Portal Navigation ── */
  // 본사 주소는 js/site-config.js 한 곳에서 관리 (도메인 바꿀 때 거기만 수정)
  getHQPortalUrl() { return window.SITE ? SITE.hq('') : 'admin.html'; },
  getHQLoginUrl() { return window.SITE ? SITE.hq('admin-login.html') : 'admin-login.html'; },
  openHQPortal() {
    window.open(this.getHQPortalUrl(), '_blank');
  },

  /* ── Korean Chosung Search ── */
  CHO: ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'],

  getCho(str) {
    let r='';
    for(let i=0;i<str.length;i++){
      const c=str.charCodeAt(i);
      if(c>=0xAC00&&c<=0xD7A3) r+=this.CHO[Math.floor((c-0xAC00)/588)];
      else r+=str[i];
    }
    return r;
  },
  isCho(c){ return this.CHO.includes(c); },

  matchCho(text,q) {
    if(!q)return false;
    if(text.toLowerCase().includes(q.toLowerCase()))return true;
    const allCho=[...q].every(c=>this.isCho(c));
    if(allCho)return this.getCho(text).includes(q);
    return this.getCho(text).includes(this.getCho(q));
  },

  hlMatch(text,q) {
    if(!q)return text;
    const i=text.toLowerCase().indexOf(q.toLowerCase());
    if(i!==-1)return text.slice(0,i)+'<span class="hl">'+text.slice(i,i+q.length)+'</span>'+text.slice(i+q.length);
    return text;
  },

  /* ── Date / Time ── */
  DAYS: ['일','월','화','수','목','금','토'],

  fmtDate(d){
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return String(d);
    return `${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일 (${this.DAYS[dt.getDay()]})`;
  },
  fmtDateShort(d){
    if (!d) return '';
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt)) return String(d);
    return `${dt.getMonth()+1}월 ${dt.getDate()}일 (${this.DAYS[dt.getDay()]})`;
  },

  dday(target) {
    const t=new Date();t.setHours(0,0,0,0);
    const tg=new Date(target);tg.setHours(0,0,0,0);
    const diff=Math.ceil((tg-t)/(864e5));
    if(diff===0)return 'D-Day';
    return diff>0?`D-${diff}`:`D+${Math.abs(diff)}`;
  },

  isHoliday(y, m, d) {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const fixedHolidays = ['01-01', '03-01', '05-05', '06-06', '08-15', '10-03', '10-09', '12-25'];
    if (fixedHolidays.includes(`${mm}-${dd}`)) return true;

    const lunarHolidays = [
      '2026-02-16', '2026-02-17', '2026-02-18', '2026-03-02', '2026-05-24', '2026-05-25', '2026-09-24', '2026-09-25', '2026-09-26',
      '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09', '2027-05-13', '2027-06-07', '2027-08-16', '2027-09-14', '2027-09-15', '2027-09-16', '2027-09-17', '2027-10-04'
    ];
    if (lunarHolidays.includes(`${y}-${mm}-${dd}`)) return true;

    return false;
  },

  fmtTimeKo(s) {
    const [h,m]=s.split(':').map(Number);
    const p=h<12?'오전':'오후';
    const dh=h===0?12:h>12?h-12:h;
    return `${p} ${String(dh).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  },

  /* ── DOM ── */
  $(sel,p=document){return p.querySelector(sel);},
  $$(sel,p=document){return p.querySelectorAll(sel);},
  el(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html)e.innerHTML=html;return e;},

  /* ── Toast ── */
  toast(msg,dur=2500) {
    const old=document.querySelector('.toast');if(old)old.remove();
    const t=this.el('div','toast',msg);document.body.appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),400);},dur);
  },

  /* ── Stagger Animate ── */
  stagger(container,sel,delay=80) {
    const items=container.querySelectorAll(sel);
    items.forEach((item,i)=>{
      item.style.opacity='0';item.style.transform='translateY(14px)';
      item.style.transition=`all 0.4s cubic-bezier(0.22,1,0.36,1) ${i*delay}ms`;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{item.style.opacity='1';item.style.transform='translateY(0)';}));
    });
  },

  /* ── iCalendar (.ics) Generation ── */
  generateICS(schedule) {
    const s = schedule;
    const pad = (n) => String(n).padStart(2,'0');
    const d = s.date;
    const [th,tm] = s.teeOff.split(':').map(Number);

    const dtStart = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(th)}${pad(tm)}00`;
    // 스케줄은 보통 5시간
    const endH = th + 5;
    const dtEnd = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(endH % 24)}${pad(tm)}00`;

    // 알림: 준비 시작 시간
    const tl = s.timeline;
    const [ah,am] = tl.prepStart.split(':').map(Number);
    const alarmMinutes = (th*60+tm) - (ah*60+am);

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//RoadPlanner//KO',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART;TZID=Asia/Seoul:${dtStart}`,
      `DTEND;TZID=Asia/Seoul:${dtEnd}`,
      `SUMMARY:🎬 ${s.course.name} 스케줄`,
      `DESCRIPTION:콜타임: ${U.fmtTimeKo(s.teeOff)}\\n장소: ${s.course.addr}\\n${tl.hasMeal ? '식사: '+tl.restaurantName+'\\n' : ''}준비 시작: ${U.fmtTimeKo(tl.prepStart)}\\n출발: ${U.fmtTimeKo(tl.homeDepart)}`,
      `LOCATION:${s.course.name}\\, ${s.course.addr}`,
      `GEO:${s.course.lat};${s.course.lng}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT' + alarmMinutes + 'M',
      'ACTION:DISPLAY',
      `DESCRIPTION:⏰ 스케줄 준비를 시작하세요! (${s.course.name})`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    return ics;
  },

  generateGoogleCalendarLink(s) {
    const pad = (n) => String(n).padStart(2,'0');
    const d = s.date;
    const [th,tm] = s.teeOff.split(':').map(Number);
    const startStr = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(th)}${pad(tm)}00`;
    const endH = th + 5;
    const endStr = `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(endH % 24)}${pad(tm)}00`;
    
    const title = encodeURIComponent(`🎬 ${s.course.name} 스케줄`);
    const tl = s.timeline;
    const startPt = s.startPoint || '집';
    const details = encodeURIComponent(`콜타임: ${U.fmtTimeKo(s.teeOff)}\n장소: ${s.course.addr}\n출발지: ${startPt}\n준비 시작: ${U.fmtTimeKo(tl.prepStart)}\n출발: ${U.fmtTimeKo(tl.homeDepart)}`);
    const location = encodeURIComponent(`${s.course.name}, ${s.course.addr}`);
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}&sf=true&output=xml`;
  },

  showCalendarSyncModal(schedule) {
    const googleUrl = this.generateGoogleCalendarLink(schedule);
    const idx = State.schedules.indexOf(schedule);
    
    const ua = navigator.userAgent.toLowerCase();
    const isIOS = /ipad|iphone|ipod/.test(ua) && !window.MSStream;
    const isAndroid = /android/.test(ua);
    
    let showApple = true;
    let showGoogle = true;
    
    if (isIOS) showGoogle = false;
    if (isAndroid) showApple = false;
    
    const appleBtn = showApple ? `
        <button class="btn" style="margin-bottom:var(--sp-3);width:100%;background:var(--bg-input);border:1px solid var(--border-default);color:var(--text-100);" onclick="U.downloadICSFile(${idx})">
          🍏 아이폰 캘린더 연동
        </button>
    ` : '';
    
    const googleBtn = showGoogle ? `
        <a href="${esc(googleUrl)}" target="_blank" class="btn" style="margin-bottom:var(--sp-3);display:flex;align-items:center;justify-content:center;width:100%;background:var(--bg-input);border:1px solid var(--border-default);color:var(--text-100);text-decoration:none;font-weight:var(--fw-bold);height:48px;border-radius:var(--r-md);" onclick="App.closeModal()">
          🤖 안드로이드 캘린더 연동
        </a>
    ` : '';

    const modalContent = `
      <div class="cal-sync-modal-content" style="padding:var(--sp-2) 0;">
        <div style="font-size:48px; text-align:center; margin-bottom:var(--sp-2);">🗓️</div>
        <h3 style="text-align:center; margin-bottom:var(--sp-2);">일정 및 알람 연동</h3>
        <p style="margin-bottom:var(--sp-5);text-align:center;font-size:var(--fs-sm);color:var(--text-400);line-height:var(--lh-relaxed);">
          스마트 플랜을 캘린더와 알람에 연동하여 일정을 놓치지 마세요!
        </p>
        <button class="btn btn-primary" style="margin-bottom:var(--sp-3);width:100%;background:var(--accent);color:#fff;border:none;" onclick="App.closeModal(); setTimeout(()=>U.openNativeAlarm(${idx}), 100)">
          ⏰ 기상 알람 자동 설정
        </button>
        ${appleBtn}
        ${googleBtn}
        <button class="btn" style="margin-top:var(--sp-2); width:100%; background:transparent; border:none; color:var(--text-400);" onclick="App.closeModal()">다음에 할게요</button>
      </div>
    `;
    App.showModal('📅 알람 및 캘린더 연동', modalContent);
  },

  downloadICS(schedule) {
    this.showCalendarSyncModal(schedule);
  },

  downloadICSFile(idx) {
    const schedule = State.schedules[idx];
    if (!schedule) return;
    
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('kakaotalk')) {
      alert('카카오톡에서는 캘린더 저장이 제한됩니다. 사파리(기본 브라우저)로 자동 전환합니다.');
      window.location.href = 'kakaotalk://web/openExternal?url=' + encodeURIComponent(window.location.href);
      return;
    }
    if (ua.includes('naver') || ua.includes('instagram')) {
      alert('현재 앱에서는 캘린더 저장이 제한됩니다. 브라우저 메뉴에서 Safari로 열기를 선택해주세요.');
      return;
    }

    const ics = this.generateICS(schedule);
    const blob = new Blob([ics], { type:'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadplanner_${schedule.course.name.replace(/\s/g,'_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    App.closeModal();
    this.toast('✅ 캘린더 파일이 다운로드되었습니다. 다운로드 항목에서 열어주세요!');
  },

  autoSyncCalendar(schedule, idx) {
    // 1. 정식 앱(Native App) 환경: 네이티브 캘린더에 백그라운드로 자동 등록
    if (window.Android && window.Android.addCalendarEvent) {
      window.Android.addCalendarEvent(JSON.stringify(schedule));
      this.toast('📅 앱 기본 캘린더에 자동 연동되었습니다.');
      return;
    }
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.addCalendarEvent) {
      window.webkit.messageHandlers.addCalendarEvent.postMessage(JSON.stringify(schedule));
      this.toast('📅 앱 기본 캘린더에 자동 연동되었습니다.');
      return;
    }

    // 타임라인 화면 진입 직후 캘린더 동기화 모달을 자동으로 띄워줍니다.
    setTimeout(() => {
      this.showCalendarSyncModal(schedule);
    }, 500);
  },



  openNativeAlarm(idx) {
    const s = State.schedules[idx];
    if (!s || !s.timeline || !s.timeline.prepStart) return;
    
    const [h, m] = s.timeline.prepStart.split(':').map(Number);
    const msg = encodeURIComponent(`로드플래너 기상 (${s.course.name})`);
    
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isAndroid) {
      // Android Intent for Clock App
      const intentUrl = `intent://#Intent;action=android.intent.action.SET_ALARM;i.android.intent.extra.alarm.HOUR=${h};i.android.intent.extra.alarm.MINUTES=${m};S.android.intent.extra.alarm.MESSAGE=${msg};B.android.intent.extra.alarm.SKIP_UI=false;end`;
      window.location.href = intentUrl;
    } else {
      // iOS / Desktop Fallback
      const modalContent = `
        <div style="padding:var(--sp-2) 0; text-align:center;">
          <div style="font-size:48px; font-weight:800; color:var(--accent); margin-bottom:var(--sp-2);">
            ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}
          </div>
          <p style="color:var(--text-400); line-height:1.5; margin-bottom:var(--sp-4); font-size:15px;">
            아이폰(애플) 정책상 웹 브라우저에서 알람을 자동으로 설정할 수 없습니다.<br><br>
            <strong>번거로우시겠지만 위 시간에 맞춰 직접 알람을 설정해 주세요!</strong><br><br>
            <span style="font-size:13px; color:var(--text-500);">※ 향후 앱스토어에 정식 앱이 출시되면 100% 자동 알람 연동이 지원됩니다.</span>
          </p>
          <button class="btn btn-primary" style="width:100%" onclick="App.closeModal()">확인했습니다</button>
        </div>
      `;
      App.showModal('⏰ 기상 알람 수동 설정 안내', modalContent);
    }
  },

  /* ── 🚗 Navigation Integration (Tmap & KakaoNavi) ──
   * - 목적지 이름/주소를 카카오 로컬 검색으로 좌표로 바꾼 뒤, 좌표로 '경로 안내'를 연다 (이름 검색보다 정확).
   * - 안드로이드: intent 주소 → 앱이 없으면 플레이스토어로 이동.
   * - 아이폰: 앱 주소 → 앱이 안 열리면 카카오맵 웹 길찾기(또는 앱스토어)로 이동.
   * - 카카오내비는 공개 앱 주소가 없어, JavaScript 키(KakaoAPI.JS_KEY)가 설정되면 카카오 SDK로 바로 내비를 열고,
   *   없으면 카카오맵 앱의 자동차 길찾기로 연다.
   */
  _navCache: {},
  // "MBC 상암 신사옥 (서울 마포구 성암로 267)" → { name:'MBC 상암 신사옥', addr:'서울 마포구 성암로 267' }
  _splitPlace(s) {
    const str = String(s || '').replace(/\s+/g, ' ').trim();
    const m = str.match(/^(.*?)\s*[(\[]([^()\[\]]+)[)\]]\s*$/);
    const looksAddr = (v) => /(시|도|구|군|읍|면|동|리|로|길)\s*\d|\d+(-\d+)?\s*$/.test(v) && /(시|도|구|군)\s/.test(v + ' ');
    if (m && m[1].trim() && looksAddr(m[2])) return { name: m[1].trim(), addr: m[2].trim() };
    if (looksAddr(str)) return { name: '', addr: str };
    return { name: m && m[1].trim() ? m[1].trim() : str, addr: '' };
  },

  async _resolveDest(destName, destAddr) {
    const raw = String(destAddr || destName || '').trim();
    if (!raw) return null;
    if (this._navCache[raw]) return this._navCache[raw];
    if (typeof KakaoAPI === 'undefined' || !KakaoAPI.searchPlace) return null;
    const parts = this._splitPlace(raw);
    const label = parts.name || destName || parts.addr || raw;
    // 이름·주소를 동시에 찾되, 이름이 같은(또는 주소가 같은) 장소를 우선 — 같은 건물의 다른 가게로 안내되지 않게
    // (괄호가 섞인 긴 문자열은 검색이 안 되므로 나눠서 찾음)
    const queries = [...new Set([parts.addr, parts.name, raw].filter(Boolean))];
    const norm = (v) => String(v || '').replace(/\s+/g, '').toLowerCase();
    const want = norm(parts.name), wantAddr = norm(parts.addr);
    const pick = (docs) => {
      const list = (Array.isArray(docs) ? docs : []).filter(d => d && d.x && d.y);
      if (!list.length) return null;
      return (want && list.find(d => norm(d.place_name) === want))
        || (want && list.find(d => norm(d.place_name).includes(want) || want.includes(norm(d.place_name))))
        || (wantAddr && list.find(d => norm(d.road_address_name).includes(wantAddr) || norm(d.address_name).includes(wantAddr)))
        || list[0];
    };
    const find = async (q) => {
      const d = pick(await KakaoAPI.searchPlace(q));
      if (!d) throw new Error('none');
      return { name: parts.name || d.place_name || label, lat: String(d.y), lng: String(d.x) };
    };
    try {
      const pt = await Promise.race([
        Promise.any(queries.map(find)),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))
      ]);
      this._navCache[raw] = pt;
      return pt;
    } catch (e) { return null; }
  },
  // 앱 주소를 열고, 앱이 열리지 않으면(화면이 그대로면) 대체 주소로 이동
  _go(url) { window.location.href = url; },
  _launchApp(appUrl, fallbackUrl) {
    let left = false;
    const mark = () => { left = true; };
    document.addEventListener('visibilitychange', mark, { once: true });
    window.addEventListener('pagehide', mark, { once: true });
    this._go(appUrl);
    if (fallbackUrl) setTimeout(() => { if (!left && !document.hidden) this._go(fallbackUrl); }, 1800);
  },

  async openNavigation(destName, destAddr, forcedNavi = null) {
    if (!destName && !destAddr) {
      this.toast('목적지 정보가 없습니다.');
      return;
    }
    const label = (this._splitPlace(destName || destAddr).name || this._splitPlace(destName || destAddr).addr || destName || destAddr);
    const pref = forcedNavi || localStorage.getItem('bp_preferred_navi') || 'choice';
    if (pref === 'choice' && !forcedNavi) {
      this.showNaviChoiceModal(destName, destAddr);
      return;
    }

    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = isAndroid || isIOS;
    const enc = encodeURIComponent;

    const pt = await this._resolveDest(destName, destAddr);
    const name = (pt && pt.name) || label;
    const webRoute = pt ? `https://map.kakao.com/link/to/${enc(name)},${pt.lat},${pt.lng}` : `https://map.kakao.com/link/search/${enc(label)}`;
    if (!pt) this.toast('정확한 위치를 찾지 못해 이름으로 검색합니다.');

    if (pref === 'tmap') {
      if (!isMobile) {
        window.open(webRoute, '_blank');
        this.toast('PC에서는 티맵 앱을 열 수 없어 카카오맵 웹 길찾기로 엽니다.');
        return;
      }
      // 티맵 앱 주소 형식: route?goalname=&goalx=(경도)&goaly=(위도) — 이름을 같이 넘겨야 티맵이 근처 다른 가게 이름으로 바꾸지 않음
      const path = pt ? `route?goalname=${enc(name)}&goalx=${pt.lng}&goaly=${pt.lat}` : `search?name=${enc(label)}`;
      if (isAndroid) this._go(`intent://${path}#Intent;scheme=tmap;package=com.skt.tmap.ku;end`);
      else this._launchApp(`tmap://${path}`, 'https://apps.apple.com/kr/app/id431589174');
      this.toast(`🚗 티맵으로 [${name}] 길안내를 엽니다.`);
    } else if (pref === 'kakao') {
      // 카카오내비 SDK가 준비돼 있으면 내비로 바로 (JavaScript 키 + 도메인 등록 필요)
      if (isMobile && pt && window.Kakao && window.Kakao.Navi && window.Kakao.isInitialized && window.Kakao.isInitialized()) {
        try {
          window.Kakao.Navi.start({ name, x: Number(pt.lng), y: Number(pt.lat), coordType: 'wgs84' });
          this.toast(`🟡 카카오내비로 [${name}] 길안내를 엽니다.`);
          return;
        } catch (e) { /* 아래 카카오맵으로 */ }
      }
      if (!isMobile) {
        window.open(webRoute, '_blank');
        this.toast('PC에서는 카카오맵 웹 길찾기로 엽니다.');
        return;
      }
      const path = pt ? `route?ep=${pt.lat},${pt.lng}&by=CAR` : `search?q=${enc(label)}`;
      if (isAndroid) this._go(`intent://${path}#Intent;scheme=kakaomap;package=net.daum.android.map;S.browser_fallback_url=${enc(webRoute)};end`);
      else this._launchApp(`kakaomap://${path}`, webRoute);
      this.toast(`🟡 카카오맵 길찾기로 [${name}] 경로를 엽니다.`);
    }
  },

  showNaviChoiceModal(destName, destAddr) {
    const query = destName || destAddr;
    const modalHtml = `
      <div style="padding:16px 0; text-align:center;">
        <div style="font-size:15px; font-weight:800; color:var(--text-100); margin-bottom:6px;">
          📍 목적지: ${esc(query)}
        </div>
        <p style="font-size:13px; color:var(--text-400); margin-bottom:20px;">
          사용하실 네비게이션 앱을 선택해주세요.
        </p>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <button onclick="App.closeModal(); U.openNavigation('${query.replace(/'/g, "\\'")}', '', 'tmap')" style="display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; background:#000000; color:#ffffff; border-radius:12px; font-weight:800; font-size:15px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff"><path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16zM11.99 1.5L2.5 9l9.49 7.5L21.5 9l-9.51-7.5z"/></svg>
            티맵 (Tmap)으로 바로 안내
          </button>

          <button onclick="App.closeModal(); U.openNavigation('${query.replace(/'/g, "\\'")}', '', 'kakao')" style="display:flex; align-items:center; justify-content:center; gap:10px; padding:14px; background:#fee500; color:#191919; border-radius:12px; font-weight:800; font-size:15px; border:none; cursor:pointer; box-shadow:0 4px 12px rgba(254,229,0,0.3);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919"><path d="M12 3c-5.523 0-10 3.553-10 7.938 0 2.825 1.83 5.303 4.606 6.744l-1.01 3.7c-.053.195.166.353.332.227l4.316-2.82c.575.08 1.162.124 1.756.124 5.523 0 10-3.553 10-7.938C22 6.553 17.523 3 12 3z"/></svg>
            카카오내비로 바로 안내
          </button>
        </div>

        <div style="margin-top:16px; font-size:12px; color:#94a3b8;">
          ※ [내정보]에서 선호하는 네비를 설정하시면 원클릭으로 바로 실행됩니다.
        </div>
      </div>
    `;
    App.showModal('🚗 네비게이션 앱 선택', modalHtml);
  },

  haptic() { if(navigator.vibrate) navigator.vibrate(10); }
};
