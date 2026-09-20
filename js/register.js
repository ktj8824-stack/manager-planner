/* =========================================
   ManagerPlanner v2 — Register Screen (Entertainment)
   ========================================= */

const Register = {
  searchTimer: null,
  course: null, // location
  date: null,
  timeH: null, timeM: null,
  duration: 1, // in hours
  editIdx: null,
  
  // New fields for entertainment
  artistId: null,
  category: 'music_show',
  vehicleId: null,
  shopNeeded: false,
  shopName: '',
  shopTimeH: null, shopTimeM: null,
  isSecret: false,

  reset() {
    this.editIdx = null;
    this.searchTimer = null;
    this.course = null;
    this.date = window._selectedDateForRegister || new Date();
    window._selectedDateForRegister = null;
    
    if (window._selectedHourForRegister !== undefined) {
      this.timeH = window._selectedHourForRegister;
      this.timeM = 0;
      window._selectedHourForRegister = undefined;
    } else {
      this.timeH = null; 
      this.timeM = null;
    }
    
    this.duration = 1;
    
    const artists = window.hqStore ? window.hqStore.getArtists() : [];
    this.artistId = artists.length > 0 ? artists[0].id : null;
    this.category = 'music_show';
    const vehicles = window.hqStore ? window.hqStore.getVehicles() : [];
    this.vehicleId = vehicles.length > 0 ? vehicles[0].id : null;
    this.shopNeeded = false;
    this.shopName = '청담 알루(ALUU) 본점';
    this.shopTimeH = null;
    this.shopTimeM = null;
    this.isSecret = false;
  },

  toggleSecret() {
    this.isSecret = !this.isSecret;
    this.render();
  },

  quickAdd(y, m, d, h) {
    window._selectedDateForRegister = new Date(y, m, d);
    window._selectedHourForRegister = h;
    App.navigate('register');
  },

  edit(idx) {
    // If editIdx is string (Supabase ID), we need to fetch from hqStore
    let s = null;
    if (typeof idx === 'string' && window.hqStore) {
      s = window.hqStore.getSchedules().find(x => x.id === idx);
    } else {
      s = State.schedules[idx];
    }
    
    if (!s) return;
    this.editIdx = idx;
    
    // Check if it's new HQ format or old format
    if (s.location) {
       // HQ format
       this.course = { name: s.location.split(' ')[0] || s.location, addr: s.location };
       this.date = new Date(s.date);
       if (s.startTime) {
         const [th, tm] = s.startTime.split(':').map(Number);
         this.timeH = th; this.timeM = tm;
       }
       this.artistId = s.artistId || this.artistId;
       this.category = s.category || this.category;
       this.vehicleId = s.vehicleId || this.vehicleId;
       this.isSecret = s.isSecret || false;
       this.shopNeeded = s.shop && s.shop.needed;
       if (this.shopNeeded) {
         this.shopName = s.shop.name;
         if (s.shop.time) {
           const [sh, sm] = s.shop.time.split(':').map(Number);
           this.shopTimeH = sh; this.shopTimeM = sm;
         }
       }
    } else {
       // Old format
       this.course = s.course;
       this.date = s.date ? new Date(s.date) : new Date();
       if (s.teeOff) {
         const [th, tm] = s.teeOff.split(':').map(Number);
         this.timeH = th;
         this.timeM = tm;
       }
       this.duration = s.duration || 1;
    }
    
    App.navigate('register');
  },

  init() { 
    if (this.editIdx === null) this.reset(); 
    this.render(); 
    setTimeout(() => {
      this.bind();
      if (this.editIdx !== null && this.course) {
        const input = U.$('#r-search');
        if(input) {
          input.value = this.course.name;
          U.$('#r-hint').innerHTML = `📍 ${this.course.addr || this.course.name}`;
          U.$('#r-hint').style.color = 'var(--accent)';
        }
      }
    }, 100); 
  },
  
  selectArtist(id) {
    this.artistId = id;
    this.render();
  },
  
  toggleShop() {
    this.shopNeeded = !this.shopNeeded;
    this.render();
  },

  render() {
    const el = U.$('#screen-register');
    const isEdit = this.editIdx !== null;
    const timeStr = (this.timeH !== null && this.timeM !== null) 
      ? U.fmtTimeKo(String(this.timeH).padStart(2,'0')+':'+String(this.timeM).padStart(2,'0')) 
      : '시간을 선택해주세요';
      
    const shopTimeStr = (this.shopTimeH !== null && this.shopTimeM !== null) 
      ? U.fmtTimeKo(String(this.shopTimeH).padStart(2,'0')+':'+String(this.shopTimeM).padStart(2,'0')) 
      : '샵 도착 시간';

    const durOptions = [1, 2, 3, 4, 5, 6, 8, 10];
    
    // Getting data from hqStore
    const artists = window.hqStore ? window.hqStore.getArtists() : [];
    const vehicles = window.hqStore ? window.hqStore.getVehicles() : [];
    const categories = window.SCHEDULE_CATEGORIES || {
      music_show: { name: '음악방송', icon: '📺' },
      shooting: { name: '화보/촬영/광고', icon: '📸' },
      event: { name: '행사/공연', icon: '🎪' },
      broadcast: { name: '예능/라디오', icon: '🎙️' },
      meeting: { name: '회의/미팅', icon: '💼' }
    };
    
    const artistChips = artists.map(a => `
      <div class="artist-chip ${this.artistId === a.id ? 'active' : ''}" 
           onclick="Register.selectArtist('${a.id}')"
           style="display:inline-flex; align-items:center; gap:6px; padding:8px 14px; background:${this.artistId === a.id ? a.color : '#f1f5f9'}; color:${this.artistId === a.id ? '#fff' : '#475569'}; border-radius:20px; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; margin-right:8px; white-space:nowrap; border:1px solid ${this.artistId === a.id ? 'transparent' : '#e2e8f0'}">
        <span>${a.emoji}</span>
        <span>${a.name}</span>
      </div>
    `).join('');
    
    const catOptions = Object.keys(categories).map(k => `
      <option value="${k}" ${this.category === k ? 'selected' : ''}>${categories[k].icon} ${categories[k].name}</option>
    `).join('');
    
    const vehOptions = vehicles.map(v => `
      <option value="${v.id}" ${this.vehicleId === v.id ? 'selected' : ''}>🚗 ${v.name}</option>
    `).join('');
    
    el.innerHTML = `
      <div class="header">
        <button class="header-btn" onclick="Register.editIdx=null; App.navigate('home')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 class="header-title">${isEdit ? '일정 수정' : '새 일정 추가'}</h1>
        <div class="header-btn" style="visibility:hidden"></div>
      </div>

      <div class="screen-scroll" style="padding-top: 0; background:var(--bg-app);">
        <div class="reg-content" style="max-width:600px; margin:0 auto; padding:24px;">
          <div class="reg-form" style="background:#fff; border-radius:16px; padding:24px; box-shadow:0 4px 20px rgba(0,0,0,0.05);">
            
            <!-- Artist -->
            <div class="field">
              <label class="field-label"><span class="req">*</span> 아티스트 선택</label>
              <div style="overflow-x:auto; white-space:nowrap; padding-bottom:8px; margin-bottom:-8px; -webkit-overflow-scrolling:touch;">
                ${artistChips}
              </div>
            </div>
            
            <!-- Category -->
            <div class="field" style="margin-top:20px">
              <label class="field-label"><span class="req">*</span> 스케줄 분류</label>
              <select id="r-category" class="field-select" style="width:100%; padding:14px; border:1px solid #e2e8f0; border-radius:12px; font-size:15px; font-weight:600; outline:none; background:#f8fafc; color:#1e293b;" onchange="Register.category=this.value">
                ${catOptions}
              </select>
            </div>

            <!-- Location -->
            <div class="field" style="margin-top:20px">
              <label class="field-label"><span class="req">*</span> 현장 장소 검색</label>
              <div class="search-wrap">
                <div class="field-input" style="position:relative;">
                  <input type="text" id="r-search" placeholder="장소 이름을 검색하세요" autocomplete="off" style="width:100%; padding:14px 14px 14px 40px; border:1px solid #e2e8f0; border-radius:12px; font-size:15px; font-weight:600; outline:none; background:#f8fafc; color:#1e293b;"/>
                  <span class="fi-icon" style="position:absolute; left:14px; top:50%; transform:translateY(-50%);">🔍</span>
                </div>
                <div class="search-drop" id="r-results" style="display:none; position:absolute; width:100%; background:#fff; border:1px solid #e2e8f0; border-radius:12px; margin-top:4px; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.1); max-height:200px; overflow-y:auto;"></div>
                <div id="r-hint" style="font-size:13px; color:var(--text-400); margin-top:8px;"></div>
              </div>
            </div>

            <!-- Date -->
            <div class="field" style="margin-top:20px">
              <label class="field-label"><span class="req">*</span> 날짜</label>
              <button class="picker-btn" onclick="Register.openDatePicker()" style="width:100%; display:flex; justify-content:space-between; align-items:center; padding:14px; border:1px solid #e2e8f0; border-radius:12px; font-size:15px; font-weight:600; background:#f8fafc; color:#1e293b;">
                <span class="picker-val ${!this.date?'is-empty':''}" id="r-date">${this.date ? U.fmtDateShort(this.date) : '날짜를 선택해주세요'}</span>
                <span class="picker-ico">📅</span>
              </button>
            </div>

            <!-- Arrival Time -->
            <div class="field" style="margin-top:20px">
              <label class="field-label"><span class="req">*</span> 현장 도착(시작) 시간</label>
              <button class="picker-btn" onclick="Register.openTimePicker('main')" style="width:100%; display:flex; justify-content:space-between; align-items:center; padding:14px; border:1px solid #e2e8f0; border-radius:12px; font-size:15px; font-weight:600; background:#f8fafc; color:#1e293b;">
                <span class="picker-val ${this.timeH === null ? 'is-empty' : ''}" id="r-time">${timeStr}</span>
                <span class="picker-ico">⏰</span>
              </button>
            </div>
            
            <!-- Shop Option -->
            <div class="field" style="margin-top:24px; padding-top:20px; border-top:1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <label class="field-label" style="margin:0;">💄 샵(헤어/메이크업) 경유</label>
                <div class="toggle-switch ${this.shopNeeded ? 'on' : ''}" onclick="Register.toggleShop()" style="width:44px; height:24px; background:${this.shopNeeded ? 'var(--accent)' : '#cbd5e1'}; border-radius:12px; position:relative; cursor:pointer; transition:all 0.2s;">
                  <div style="width:20px; height:20px; background:#fff; border-radius:50%; position:absolute; top:2px; left:${this.shopNeeded ? '22px' : '2px'}; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
                </div>
              </div>
              
              ${this.shopNeeded ? `
                <div style="background:#f8fafc; padding:16px; border-radius:12px; border:1px solid #e2e8f0; margin-top:12px;">
                  <div style="margin-bottom:12px;">
                    <label style="font-size:12px; color:#64748b; font-weight:600; display:block; margin-bottom:6px;">샵 이름</label>
                    <input type="text" id="r-shop-name" value="${this.shopName}" onchange="Register.shopName=this.value" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:8px; font-size:14px; outline:none;"/>
                  </div>
                  <div>
                    <label style="font-size:12px; color:#64748b; font-weight:600; display:block; margin-bottom:6px;">샵 도착 시간</label>
                    <button class="picker-btn" onclick="Register.openTimePicker('shop')" style="width:100%; display:flex; justify-content:space-between; align-items:center; padding:10px; border:1px solid #e2e8f0; border-radius:8px; font-size:14px; font-weight:600; background:#fff; color:#1e293b;">
                      <span class="picker-val ${this.shopTimeH === null ? 'is-empty' : ''}" id="r-shop-time">${shopTimeStr}</span>
                      <span class="picker-ico">🕒</span>
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <!-- Vehicle -->
            <div class="field" style="margin-top:24px; padding-top:20px; border-top:1px solid #e2e8f0;">
              <label class="field-label"><span class="req">*</span> 배차 차량</label>
              <select id="r-vehicle" class="field-select" style="width:100%; padding:14px; border:1px solid #e2e8f0; border-radius:12px; font-size:15px; font-weight:600; outline:none; background:#f8fafc; color:#1e293b;" onchange="Register.vehicleId=this.value">
                ${vehOptions}
              </select>
            </div>

            <!-- 🔒 Secret Schedule Toggle (Security & RBAC) -->
            <div class="field" style="margin-top:24px; padding-top:20px; border-top:1px solid #e2e8f0;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <label class="field-label" style="margin:0; display:flex; align-items:center; gap:6px; color:${this.isSecret ? '#dc2626' : '#1e293b'};">
                  <span>🔒 비공개 스케줄 (Secret Mode)</span>
                  ${this.isSecret ? '<span style="font-size:11px; background:#fee2e2; color:#dc2626; padding:2px 6px; border-radius:4px; font-weight:700;">극비 보안</span>' : ''}
                </label>
                <div class="toggle-switch ${this.isSecret ? 'on' : ''}" onclick="Register.toggleSecret()" style="width:44px; height:24px; background:${this.isSecret ? '#ef4444' : '#cbd5e1'}; border-radius:12px; position:relative; cursor:pointer; transition:all 0.2s;">
                  <div style="width:20px; height:20px; background:#fff; border-radius:50%; position:absolute; top:2px; left:${this.isSecret ? '22px' : '2px'}; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div>
                </div>
              </div>
              <div style="font-size:12px; color:#64748b; line-height:1.4;">
                ${this.isSecret 
                  ? '🔒 활성화됨: 대표이사(CEO) 및 총괄 관리자, 지정된 배정 매니저만 세부 내용을 볼 수 있습니다. (외부 스태프 및 타 매니저에게 마스킹/숨김 처리)' 
                  : '일반 공개 스케줄: 전담 매니저 및 현장 스태프가 열람할 수 있습니다.'}
              </div>
            </div>

            <!-- Duration (Optional for entertainment, but kept for compatibility) -->
            <div class="field" style="margin-top:20px">
              <label class="field-label">예상 소요 시간 (시간)</label>
              <div class="pills" id="r-dur-pills">
                ${durOptions.map(t => `<button class="pill ${t===this.duration?'on':''}" onclick="Register.setDuration(${t},this)">${t}</button>`).join('')}
              </div>
            </div>

          </div>
          
          <div class="reg-submit" style="margin-top:32px;">
            <button class="btn btn-primary" id="r-submit" onclick="Register.createPlan()" style="width:100%; height:56px; border-radius:16px; font-size:16px; font-weight:700; background:${this.isSecret ? 'linear-gradient(135deg, #1e1b4b, #312e81)' : '#1a1a1a'}; color:#fff; box-shadow:${this.isSecret ? '0 4px 14px rgba(49, 46, 129, 0.4)' : 'none'};">${isEdit ? (this.isSecret ? '🔒 비공개 일정 수정 완료' : '일정 수정 완료') : (this.isSecret ? '🔒 비공개 일정 등록 완료' : '일정 등록 완료')}</button>
          </div>
        </div>
      </div>
      
      <style>
        .search-item { padding: 14px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
        .search-item:last-child { border-bottom: none; }
        .search-item:active { background: #f8fafc; }
        .search-item-name { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .search-item-addr { font-size: 13px; color: #64748b; }
        .search-drop.show { display: block !important; }
        
        .pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill { padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 14px; font-weight: 600; color: #64748b; background: #fff; cursor: pointer; transition: all 0.2s; }
        .pill.on { background: var(--accent); color: #fff; border-color: var(--accent); }
      </style>
    `;
  },

  bind() {
    const input = U.$('#r-search');
    if (!input) return;
    input.addEventListener('input', e => {
      clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => {
        if (e.target.value.trim().length > 1) this.search(e.target.value.trim());
      }, 300);
    });
    input.addEventListener('focus', () => { if (input.value.trim().length > 1) this.search(input.value.trim()); });
    document.addEventListener('click', e => {
      const w = U.$('.search-wrap');
      if (w && !w.contains(e.target)) { const r = U.$('#r-results'); if (r) r.classList.remove('show'); }
    });
  },

  searchResults: [],

  async search(q) {
    const drop = U.$('#r-results'); if (!drop || !q) { drop?.classList.remove('show'); return; }
    
    drop.innerHTML = '<div class="search-item" style="justify-content:center;color:var(--text-500);text-align:center;">검색 중...</div>';
    drop.classList.add('show');
    
    // In ManagerPlanner, TmapAPI is still available from utils.js or home.js context
    if (window.TmapAPI) {
      this.searchResults = await window.TmapAPI.searchPlace(q);
    } else {
      // Mock data if Tmap API isn't loaded
      this.searchResults = [
        { id: '1', place_name: q + ' 스튜디오', address_name: '서울 강남구 ' + q + '로 1' },
        { id: '2', place_name: q + ' 방송국', address_name: '서울 마포구 상암동 123' },
      ];
    }
    
    if (!this.searchResults || !this.searchResults.length) { 
      drop.innerHTML = '<div class="search-item" style="justify-content:center;color:var(--text-500);text-align:center;">검색 결과 없음</div>'; 
      return; 
    }
    
    drop.innerHTML = this.searchResults.map(c => `
      <div class="search-item" onclick="Register.selectCourse('${c.id}')">
        <div class="search-item-info">
          <div class="search-item-name">${U.hlMatch(c.place_name, q)}</div>
          <div class="search-item-addr">${c.address_name}</div>
        </div>
      </div>`).join('');
  },

  selectCourse(id) {
    const c = this.searchResults.find(x => String(x.id) === String(id)); if(!c) return;
    
    this.course = {
      id: c.id,
      name: c.place_name,
      region: c.address_name.split(' ').slice(0, 2).join(' '),
      addr: c.address_name,
      lat: parseFloat(c.y || 0),
      lng: parseFloat(c.x || 0)
    };
    
    U.$('#r-search').value = this.course.name;
    U.$('#r-results').classList.remove('show');
    U.$('#r-hint').innerHTML = `📍 ${this.course.addr}`;
    U.$('#r-hint').style.color = 'var(--accent)';
    
    U.toast(`📍 ${c.place_name} 선택 완료`); U.haptic();
  },

  setDuration(t, btn) { 
    this.duration = t; 
    U.$$('#r-dur-pills .pill').forEach(b=>b.classList.remove('on')); 
    btn.classList.add('on'); 
    U.haptic(); 
  },

  openDatePicker() {
    const today = new Date();
    const curDate = this.date || today;
    const cy = curDate.getFullYear();
    const cm = curDate.getMonth() + 1;
    const cd = curDate.getDate();

    const currentYear = today.getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    const REPEAT = 40;
    const MID = Math.floor(REPEAT / 2);

    let yearHtml = years.map(y => `<div class="wheel-item" data-val="${y}">${y}년</div>`).join('');
    
    let monthItemsHtml = '';
    for(let i=1; i<=12; i++) monthItemsHtml += `<div class="wheel-item" data-val="${i}">${i}월</div>`;
    let monthHtml = monthItemsHtml.repeat(REPEAT);
    
    let dayItemsHtml = '';
    for(let i=1; i<=31; i++) dayItemsHtml += `<div class="wheel-item" data-val="${i}">${i}일</div>`;
    let dayHtml = dayItemsHtml.repeat(REPEAT);

    const content = `
      <div class="wheel-picker" id="r-date-wheel-picker">
        <div class="wheel-sel-bar"></div>
        <div class="wheel-col" id="w-year">${yearHtml}</div>
        <div class="wheel-col" id="w-month">${monthHtml}</div>
        <div class="wheel-col" id="w-day">${dayHtml}</div>
      </div>
      <button class="btn btn-primary" onclick="Register.confirmDatePicker()" style="width:100%; border-radius:12px; margin-top:16px;">선택 완료</button>
    `;
    
    App.showModal('📅 날짜 선택', content);

    setTimeout(() => {
      const hYear = U.$('#w-year');
      const hMonth = U.$('#w-month');
      const hDay = U.$('#w-day');
      
      const ITEM_HEIGHT = 44;
      const yIdx = years.indexOf(cy);
      hYear.scrollTop = (yIdx > -1 ? yIdx : 0) * ITEM_HEIGHT;
      hMonth.scrollTop = (MID * 12 + cm - 1) * ITEM_HEIGHT;
      hDay.scrollTop = (MID * 31 + cd - 1) * ITEM_HEIGHT;

      [hYear, hMonth, hDay].forEach(col => {
        col.addEventListener('scroll', () => {
          clearTimeout(col.snapTimer);
          col.snapTimer = setTimeout(() => Register.updateWheelActive(col), 50);
        });
        Register.updateWheelActive(col);
      });
    }, 100);
  },

  confirmDatePicker() {
    const ITEM_HEIGHT = 44;
    const getVal = (id) => {
      const col = U.$('#' + id);
      if (!col) return 1;
      const idx = Math.round(col.scrollTop / ITEM_HEIGHT);
      const item = col.querySelectorAll('.wheel-item')[idx];
      return item ? parseInt(item.dataset.val, 10) : 1;
    };

    const y = getVal('w-year');
    const m = getVal('w-month') - 1;
    const d = getVal('w-day');

    this.selectDate(new Date(y, m, d).toISOString());
  },

  selectDate(iso) {
    this.date = new Date(iso);
    const display = U.$('#r-date');
    display.textContent = U.fmtDate(this.date); display.classList.remove('is-empty');
    App.closeModal(); U.haptic();
  },

  targetTimeField: 'main', // 'main' or 'shop'

  openTimePicker(target = 'main') {
    this.targetTimeField = target;
    const isShop = target === 'shop';
    
    let defaultH = isShop ? this.shopTimeH : this.timeH;
    let defaultM = isShop ? this.shopTimeM : this.timeM;
    
    if (defaultH === null) {
      // Default to 1 hour before main time if shop
      if (isShop && this.timeH !== null) {
         defaultH = this.timeH - 1;
         defaultM = this.timeM;
         if (defaultH < 0) defaultH += 24;
      } else {
         defaultH = 9;
         defaultM = 0;
      }
    }
    
    const isPM = defaultH >= 12;
    const h12 = defaultH % 12 || 12;

    const REPEAT = 40;
    const MID = Math.floor(REPEAT / 2);

    let ampmHtml = ['오전', '오후'].map(v => `<div class="wheel-item" data-val="${v}">${v}</div>`).join('');
    let hourItems = '';
    for (let i = 1; i <= 12; i++) hourItems += `<div class="wheel-item" data-val="${i}">${i}</div>`;
    let hourHtml = hourItems.repeat(REPEAT);
    
    let minItems = '';
    for (let i = 0; i < 60; i+=10) minItems += `<div class="wheel-item" data-val="${i}">${String(i).padStart(2, '0')}</div>`;
    let minHtml = minItems.repeat(REPEAT);

    const title = isShop ? '🕒 샵 도착 시간' : '⏰ 현장 도착 시간';
    const content = `
      <div class="wheel-picker" id="r-wheel-picker">
        <div class="wheel-sel-bar"></div>
        <div class="wheel-col" id="w-ampm">${ampmHtml}</div>
        <div class="wheel-col" id="w-hour">${hourHtml}</div>
        <div class="wheel-col" id="w-min">${minHtml}</div>
      </div>
      <button class="btn btn-primary" onclick="Register.confirmTimePicker()" style="width:100%; border-radius:12px; margin-top:16px;">선택 완료</button>
    `;

    App.showModal(title, content);

    setTimeout(() => {
      const hAmPm = U.$('#w-ampm');
      const hHour = U.$('#w-hour');
      const hMin = U.$('#w-min');
      
      const ITEM_HEIGHT = 44;
      hAmPm.scrollTop = (isPM ? 1 : 0) * ITEM_HEIGHT;
      hHour.scrollTop = (MID * 12 + h12 - 1) * ITEM_HEIGHT;
      hMin.scrollTop = (MID * 6 + (defaultM/10)) * ITEM_HEIGHT; // since steps are 10

      [hAmPm, hHour, hMin].forEach(col => {
        col.addEventListener('scroll', () => {
          clearTimeout(col.snapTimer);
          col.snapTimer = setTimeout(() => Register.updateWheelActive(col), 50);
        });
        Register.updateWheelActive(col);
      });
    }, 100);
  },

  updateWheelActive(col) {
    const ITEM_HEIGHT = 44;
    const idx = Math.round(col.scrollTop / ITEM_HEIGHT);
    const activeItem = col.querySelector('.wheel-item.active');
    if (activeItem) activeItem.classList.remove('active');
    
    const items = col.querySelectorAll('.wheel-item');
    if (items[idx]) items[idx].classList.add('active');
  },

  confirmTimePicker() {
    const ITEM_HEIGHT = 44;
    const getVal = (id) => {
      const col = U.$('#' + id);
      if (!col) return '';
      const idx = Math.round(col.scrollTop / ITEM_HEIGHT);
      return col.querySelectorAll('.wheel-item')[idx].dataset.val;
    };

    const ampm = getVal('w-ampm');
    let h = parseInt(getVal('w-hour'), 10);
    const m = parseInt(getVal('w-min'), 10);

    if (ampm === '오후' && h !== 12) h += 12;
    if (ampm === '오전' && h === 12) h = 0;

    this.selectTime(h, m);
  },

  selectTime(h, m) {
    const hh = String(h).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    
    if (this.targetTimeField === 'shop') {
      this.shopTimeH = h;
      this.shopTimeM = m;
      const display = U.$('#r-shop-time');
      display.textContent = U.fmtTimeKo(`${hh}:${mm}`);
      display.classList.remove('is-empty');
    } else {
      this.timeH = h;
      this.timeM = m;
      const display = U.$('#r-time');
      display.textContent = U.fmtTimeKo(`${hh}:${mm}`);
      display.classList.remove('is-empty');
      
      // Auto calc shop time if not set yet
      if (this.shopNeeded && this.shopTimeH === null) {
         let sh = h - 2; // 2 hours before main time
         if (sh < 0) sh += 24;
         this.shopTimeH = sh;
         this.shopTimeM = m;
         this.render(); // re-render to update shop time UI
      }
    }
    
    App.closeModal();
    U.haptic();
  },

  async createPlan() {
    if (!this.course && !U.$('#r-search').value.trim()) { U.toast('⚠️ 장소를 입력해주세요'); return; }
    if (!this.date) { U.toast('⚠️ 날짜를 선택해주세요'); return; }
    if (this.timeH === null || this.timeM === null) { U.toast('⚠️ 시간을 선택해주세요'); return; }

    const teeOff = `${String(this.timeH).padStart(2,'0')}:${String(this.timeM).padStart(2,'0')}`;
    
    let endH = this.timeH + this.duration;
    if (endH >= 24) endH -= 24;
    const endTeeOff = `${String(endH).padStart(2,'0')}:${String(this.timeM).padStart(2,'0')}`;

    const y = this.date.getFullYear();
    const m = String(this.date.getMonth() + 1).padStart(2, '0');
    const d = String(this.date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    const locationStr = this.course ? this.course.addr : U.$('#r-search').value.trim();
    
    // Find metadata for hqStore
    let artistName = this.artistId;
    let vehicleName = this.vehicleId;
    let mgrName = '김태현 팀장'; // Default or from context
    let mgrId = 'mgr_1';
    
    if (window.hqStore) {
      const artist = window.hqStore.getArtists().find(a => a.id === this.artistId);
      if (artist) artistName = artist.name;
      
      const vehicle = window.hqStore.getVehicles().find(v => v.id === this.vehicleId);
      if (vehicle) vehicleName = vehicle.name;
      
      // Read current logged in user from localStorage / AuthPersona
      const currentMgrId = localStorage.getItem('bp_manager_id') || 'mgr_2';
      const me = window.hqStore.getManagers().find(m => m.id === currentMgrId);
      if (me) {
        mgrName = me.name;
        mgrId = me.id;
      } else {
        mgrName = localStorage.getItem('bp_user_name') || '현장 매니저';
        mgrId = currentMgrId;
      }
    }
    
    const titleText = (this.course?.name || U.$('#r-search').value.trim()) + ' ' + (window.SCHEDULE_CATEGORIES?.[this.category]?.name || '');

    const sched = {
      // HQ Format mapping
      id: this.editIdx && typeof this.editIdx === 'string' ? this.editIdx : 'sch_' + Date.now(),
      title: titleText,
      artistId: this.artistId,
      artistName: artistName,
      category: this.category,
      date: dateStr,
      startTime: teeOff,
      endTime: endTeeOff,
      managerId: mgrId,
      managerName: mgrName,
      vehicleId: this.vehicleId,
      vehicleName: vehicleName,
      isSecret: this.isSecret,
      secretLevel: this.isSecret ? 'confidential' : 'public',
      status: '예정',
      location: locationStr,
      shop: this.shopNeeded ? {
        needed: true,
        name: this.shopName || document.getElementById('r-shop-name')?.value || '샵',
        time: (this.shopTimeH !== null && this.shopTimeM !== null) ? `${String(this.shopTimeH).padStart(2,'0')}:${String(this.shopTimeM).padStart(2,'0')}` : teeOff,
        durationMin: 90
      } : { needed: false },
      
      // Legacy format fallback just in case
      course: this.course || { name: U.$('#r-search').value.trim(), addr: U.$('#r-search').value.trim() },
      teeOff: teeOff,
      duration: this.duration
    };

    // 🚨 배차/매니저 중복 충돌 검사
    if (window.hqStore && window.hqStore.checkConflict) {
      const conflictResult = window.hqStore.checkConflict(sched);
      if (conflictResult.hasConflict) {
        const warnMsgs = conflictResult.conflicts.map(c => {
          if (c.type === 'vehicle') {
            return `• 🚗 [${c.vehicleName}] 차량이 동일 시간대(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'에 이미 배정되어 있습니다.`;
          } else {
            return `• 👤 [${c.managerName}] 매니저가 동일 시간대(${c.conflictTime}) [${c.conflictArtist}] '${c.conflictScheduleTitle}'에 이미 배정되어 있습니다.`;
          }
        }).join('\n');

        const proceed = confirm(`⚠️ [배차/일정 중복 경고]\n\n${warnMsgs}\n\n동일 시간대 중복 배차가 발생합니다. 그래도 일정을 등록/수정하시겠습니까?`);
        if (!proceed) {
          return; // 저장 취소
        }
      }
    }
    
    // Use hqStore if available to sync with Supabase and global state
    if (window.hqStore) {
      await window.hqStore.saveSchedule(sched);
      
      // We also update the old State.schedules if needed for backward compatibility
      if (this.editIdx !== null && typeof this.editIdx === 'number') {
        State.updateSchedule(this.editIdx, sched);
      } else if (this.editIdx === null) {
        State.addSchedule(sched);
      }
    } else {
      // Fallback
      if (this.editIdx !== null) {
        State.updateSchedule(this.editIdx, sched);
      } else {
        State.addSchedule(sched);
      }
    }
    
    U.toast(this.editIdx !== null ? '✅ 일정이 수정되었습니다.' : '✅ 새 일정이 등록되었습니다.');

    this.reset();
    App.navigate('home');
    
    if (Home && Home.selectDate) {
      Home.selectDate(this.date.getFullYear(), this.date.getMonth(), this.date.getDate());
    }
  }
};
