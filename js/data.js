/* =========================================
   ManagerPlanner v2 — Entertainment Venues & Staff Data
   ========================================= */

const COURSES = [
  { id:1, name:'상암 SBS 프리즘타워', region:'서울 마포', lat:37.5786, lng:126.8922, addr:'서울 마포구 상암산로 82' },
  { id:2, name:'여의도 KBS 신관공개홀', region:'서울 영등포', lat:37.5242, lng:126.9164, addr:'서울 영등포구 여의서로 43' },
  { id:3, name:'상암 MBC 미디어센터', region:'서울 마포', lat:37.5815, lng:126.8905, addr:'서울 마포구 성암로 267' },
  { id:4, name:'상암 CJ ENM 센터', region:'서울 마포', lat:37.5791, lng:126.8892, addr:'서울 마포구 상암산로 66' },
  { id:5, name:'일산 MBC 드림센터', region:'경기 고양', lat:37.6553, lng:126.7718, addr:'경기 고양시 일산동구 호수로 596' },
  { id:6, name:'일산 JTBC 스튜디오', region:'경기 고양', lat:37.6656, lng:126.7589, addr:'경기 고양시 일산동구 한류월드로 270' },
  { id:7, name:'목동 SBS 방송센터', region:'서울 양천', lat:37.5282, lng:126.8758, addr:'서울 양천구 목동서로 161' },
  { id:8, name:'올림픽공원 KSPO DOME', region:'서울 송파', lat:37.5182, lng:127.1256, addr:'서울 송파구 올림픽로 424' },
  { id:9, name:'고척스카이돔', region:'서울 구로', lat:37.4982, lng:126.8670, addr:'서울 구로구 경인로 430' },
  { id:10, name:'인스파이어 아레나', region:'인천 영종', lat:37.4601, lng:126.5089, addr:'인천 중구 공항문화로 127' },
  { id:11, name:'청담 알루(ALUU) 본점', region:'서울 강남', lat:37.5242, lng:127.0456, addr:'서울 강남구 도산대로75길 17' },
  { id:12, name:'청담 정샘물 인스피레이션', region:'서울 강남', lat:37.5254, lng:127.0412, addr:'서울 강남구 압구정로79길 19' },
  { id:13, name:'빛마루 방송지원센터', region:'경기 고양', lat:37.6614, lng:126.7649, addr:'경기 고양시 일산동구 태극로 60' },
  { id:14, name:'파주 스튜디오 프리즘', region:'경기 파주', lat:37.7453, lng:126.7368, addr:'경기 파주시 탄현면 갈현리' },
  { id:15, name:'코엑스 D홀', region:'서울 강남', lat:37.5118, lng:127.0591, addr:'서울 강남구 영동대로 513' },
  { id:16, name:'동대문 DDP 아트홀', region:'서울 중구', lat:37.5669, lng:127.0094, addr:'서울 중구 을지로 281' },
  { id:17, name:'성수 복합스튜디오 에스팩토리', region:'서울 성동', lat:37.5415, lng:127.0561, addr:'서울 성동구 성수이로14길 14' },
  { id:18, name:'제주 신화월드 컨벤션', region:'제주', lat:33.3042, lng:126.3189, addr:'제주 서귀포시 안덕면 신화역사로304번길 38' }
];

const COMPANIONS = [
  { id:1, name:'헤어디자이너 (수석)', emoji:'💇', color:'#ec4899' },
  { id:2, name:'메이크업 실장', emoji:'💄', color:'#f43f5e' },
  { id:3, name:'스타일리스트 팀장', emoji:'👗', color:'#8b5cf6' },
  { id:4, name:'현장 전담 경호팀', emoji:'🛡️', color:'#3b82f6' },
  { id:5, name:'총괄 프로듀서(PD)', emoji:'🎬', color:'#10b981' },
  { id:6, name:'로드 매니저', emoji:'🚗', color:'#f59e0b' }
];

const RESTAURANTS = {
  1: {
    before:[
      { id:101,name:'상암 24시 누리꿈 콩나물국밥',distance:'400m',distMin:2,rating:4.4,reviews:156,cat:'국밥/해장',open:'24시간',features:['24시간 영업','새벽 사녹 전 든든한 식사','주차 편리'],menus:['전주 콩나물국밥','황태해장국'],phone:'02-3153-1234',emoji:'🍲',tag:'새벽 사녹 필수코스',lat:37.579,lng:126.891 },
      { id:102,name:'상암 롤링핀 브런치 & 샌드위치',distance:'350m',distMin:3,rating:4.6,reviews:210,cat:'카페/샌드위치',open:'06:30',features:['아침 6시 30분 오픈','스태프 단체 샌드위치 포장','커피 테이크아웃 빠름'],menus:['클럽 샌드위치 박스','아메리카노'],phone:'02-3153-5678',emoji:'🥪',tag:'스태프 간식 추천',lat:37.578,lng:126.893 },
      { id:103,name:'상암 전주현대옥 DMC점',distance:'500m',distMin:4,rating:4.5,reviews:180,cat:'한식',open:'06:00',features:['이른 아침 오픈','속 편한 국밥','깔끔한 밑반찬'],menus:['남부시장식 콩나물국밥','오징어사리'],phone:'02-3153-9012',emoji:'🥘',tag:'든든한 한끼',lat:37.580,lng:126.890 },
    ],
    after:[
      { id:201,name:'상암 일미락 (프라이빗 룸 고깃집)',distance:'600m',distMin:5,rating:4.8,reviews:340,cat:'구이/한우',open:'11:30',features:['개별 룸 완비 (보안 철저)','아티스트 및 제작진 회식 단골','발렛파킹'],menus:['통삼겹살','한우 꽃등심','칼비빔면'],phone:'02-3153-3456',emoji:'🥩',tag:'방송가 회식 1위',lat:37.577,lng:126.894 },
      { id:202,name:'상암 배꼽집 (평양냉면/한우)',distance:'450m',distMin:4,rating:4.7,reviews:295,cat:'한우/냉면',open:'11:00',features:['수요미식회 방영','룸 보유','스케줄 종료 후 든든한 보양식'],menus:['이베리코 생구이','평양냉면','갈비탕'],phone:'02-3153-7890',emoji:'🍖',tag:'연예인 단골 맛집',lat:37.579,lng:126.890 },
      { id:203,name:'상암 락희옥 (와인 & 한식주점)',distance:'700m',distMin:6,rating:4.6,reviews:190,cat:'한식주점',open:'11:30',features:['콜키지 프리','조용하고 쾌적한 룸','뒤풀이 추천'],menus:['보쌈 정식','거제 멍게비빔밥','성게알'],phone:'02-3153-1357',emoji:'🍷',tag:'제작진 뒤풀이 추천',lat:37.576,lng:126.895 },
    ]
  }
};

// Generate mock restaurants dynamically for all entertainment venues to prevent empty selections
COURSES.forEach(c => {
  if (!RESTAURANTS[c.id]) {
    const shortName = c.name.split(' ')[0];
    const regToken = c.region.split(' ')[1] || c.region;
    RESTAURANTS[c.id] = {
      before: [
        { id: c.id * 1000 + 101, name: `${shortName} 24시 기사식당`, distance: '300m', distMin: 3, rating: 4.4, reviews: 85, cat: '국밥/백반', open: '24시간', features: ['24시간 영업', '현장 3분 거리', '새벽 사녹 전 든든한 백반'], menus: ['소고기 국밥', '제육 백반'], phone: '02-123-4567', emoji: '🍲', tag: '새벽 식사 추천', lat: c.lat + 0.002, lng: c.lng - 0.001 },
        { id: c.id * 1000 + 102, name: `${regToken} 스태프 김밥 & 샌드위치`, distance: '250m', distMin: 2, rating: 4.6, reviews: 142, cat: '분식/간식', open: '06:00', features: ['새벽 6시 오픈', '단체 핑거푸드 포장', '차량 내 취식 편리'], menus: ['참치김밥 팩', '클럽 샌드위치'], phone: '02-987-6543', emoji: '🥪', tag: '스태프 간식 1위', lat: c.lat - 0.001, lng: c.lng + 0.002 }
      ],
      after: [
        { id: c.id * 1000 + 201, name: `${shortName} 가든 (프라이빗 룸)`, distance: '600m', distMin: 5, rating: 4.8, reviews: 230, cat: '한우/구이', open: '11:00', features: ['완벽 방음 개별 룸 완비', '아티스트/제작진 회식 최적', '발렛파킹 지원'], menus: ['한우 꽃등심', '양념 갈비 정식', '한우 육회'], phone: '02-555-5555', emoji: '🥩', tag: '제작진 회식 1위', lat: c.lat + 0.001, lng: c.lng + 0.001 },
        { id: c.id * 1000 + 202, name: `${regToken} 수라 한정식`, distance: '800m', distMin: 7, rating: 4.6, reviews: 115, cat: '한정식', open: '10:30', features: ['정갈하고 자극적이지 않은 룸 한상', '스케줄 피로 회복', '주차 편리'], menus: ['보리굴비 정식', '자연송이 불고기'], phone: '02-777-7777', emoji: '🥬', tag: '속 편한 정갈한 한상', lat: c.lat - 0.002, lng: c.lng - 0.002 },
        { id: c.id * 1000 + 203, name: `${shortName} 참숯 직화구이`, distance: '500m', distMin: 4, rating: 4.5, reviews: 98, cat: '구이/고기', open: '11:30', features: ['불향 가득한 숯불구이', '쾌적한 단체 테이블석', '스케줄 종료 후 뒤풀이'], menus: ['숯불 닭갈비', '제주 흑돼지 모둠'], phone: '02-888-8888', emoji: '🍗', tag: '현장 스태프 단골', lat: c.lat + 0.002, lng: c.lng + 0.003 }
      ]
    };
  }
});

const MANNER_TIME = 30;
const CHECKLIST = [
  '무대의상 착장 및 신발/액세서리 픽업 확인',
  '최신 큐시트/대본/악보 인쇄본 및 PDF 확인',
  '헤어/메이크업 수정 파우치 & 픽서/스프레이',
  '아티스트 전용 보온병/스트로우/비상 상비약',
  '차량 주유 상태 및 하이패스 잔액 사전 점검',
  '법인카드 및 현장 영수증 보관용 파우치'
];
const PREP_OPTIONS = [10,20,30,40,50,60,90,120];
const MEAL_TIME_OPTIONS = [30,40,50,60,70,80,90];

/* ── 방송가 & 스튜디오 인근 스태프 추천 맛집 (지역별 큐레이션) ── */
const STAFF_PICKS = {
  '서울 마포': [
    { place_name: '상암 24시 누리꿈 콩나물국밥', address_name: '서울 마포구 상암산로', category: '국밥/해장', tel: '02-3153-1234', tag: '🎬 새벽 사녹 1위', desc: '이른 아침 사녹 전 든든한 콩나물국밥' },
    { place_name: '상암 일미락 (개별 룸)', address_name: '서울 마포구 상암산로', category: '고기/구이', tel: '02-3153-3456', tag: '🔥 제작진 회식 1위', desc: '완벽 프라이빗 룸과 프리미엄 삼겹살' },
    { place_name: '상암 롤링핀 샌드위치', address_name: '서울 마포구 성암로', category: '카페/브런치', tel: '02-3153-5678', tag: '🥪 스태프 간식 추천', desc: '아침 6시 30분 오픈, 단체 포장 용이' },
  ],
  '서울 영등포': [
    { place_name: '여의도 원조 따로국밥', address_name: '서울 영등포구 여의서로', category: '국밥/해장', tel: '02-780-1234', tag: '🎬 방송가 추천', desc: 'KBS 본관/신관 앞 40년 전통 사골 해장국' },
    { place_name: '여의도 창고43 VIP룸', address_name: '서울 영등포구 국제금융로', category: '한우/구이', tel: '02-780-3456', tag: '🔥 프라이빗 룸 회식', desc: '아티스트 보안이 보장되는 최고급 한우' },
    { place_name: '여의도 마녀김밥 신관점', address_name: '서울 영등포구 여의나루로', category: '분식/김밥', tel: '02-780-5678', tag: '🍙 대기실 간식 1위', desc: '바삭한 튀김 김밥으로 신속한 식사' },
  ],
  '서울 강남': [
    { place_name: '청담 24시 새벽집', address_name: '서울 강남구 도산대로', category: '한우/육회비빔밥', tel: '02-546-1234', tag: '🎬 연예인/매니저 단골 1위', desc: '24시간 오픈, 꽃등심과 육회비빔밥의 성지' },
    { place_name: '도산공원 세시셀라 브런치', address_name: '서울 강남구 도산대로45길', category: '카페/브런치', tel: '02-546-5678', tag: '☕ 샵 대기 추천', desc: '헤메 샵 대기 시간 중 즐기기 좋은 카페' },
    { place_name: '청담 JS가든 프라이빗 룸', address_name: '서울 강남구 압구정로', category: '중식/룸', tel: '02-546-7890', tag: '🔥 비공개 미팅 추천', desc: '독립 룸 완비, 북경오리와 정갈한 코스' },
  ],
  '경기 고양': [
    { place_name: '일산 양평서울해장국 24시', address_name: '경기 고양시 일산동구 호수로', category: '해장국', tel: '031-901-1234', tag: '🎬 드림센터 스태프 단골', desc: 'MBC 드림센터 바로 앞 24시간 해장국' },
    { place_name: '일산 밤가시 솥밥정식', address_name: '경기 고양시 일산동구 일산로', category: '한정식', tel: '031-901-5678', tag: '🍱 정갈한 도시락/식사', desc: '아티스트 체력 보충을 위한 깔끔한 솥밥' },
    { place_name: '라페스타 제주도새기 룸구이', address_name: '경기 고양시 일산동구 중앙로', category: '고기/구이', tel: '031-901-9012', tag: '🔥 방송 뒤풀이 단골', desc: '넓은 룸 보유, 스케줄 종료 후 든든한 회식' },
  ],
  '경기 파주': [
    { place_name: '파주 탄현 세트장 기사식당', address_name: '경기 파주시 탄현면', category: '백반/뷔페', tel: '031-945-1234', tag: '🎬 세트장 스태프 성지', desc: '새벽부터 갓 지은 밥과 15첩 반찬 무한리필' },
    { place_name: '통일동산 장단콩 순두부', address_name: '경기 파주시 탄현면 평화로', category: '두부/순두부', tel: '031-945-5678', tag: '🍲 속 편한 한끼', desc: '야외 세트장 촬영 전 든든한 콩비지/순두부' },
  ],
  '서울 송파': [
    { place_name: '올림픽공원 방이동 24시 감자탕', address_name: '서울 송파구 올림픽로32길', category: '감자탕/해장', tel: '02-415-1234', tag: '🎬 콘서트 스태프 1위', desc: 'KSPO DOME 공연 전후 24시 든든한 식사' },
    { place_name: '방이동 한우마을 개별룸', address_name: '서울 송파구 오금로', category: '한우/구이', tel: '02-415-5678', tag: '🔥 콘서트 쫑파티 추천', desc: '단체 룸 완비, 대규모 스태프 회식 최적' },
  ],
  '인천 영종': [
    { place_name: '인스파이어 푸드홀', address_name: '인천 중구 공항문화로', category: '양식/한식', tel: '032-743-1234', tag: '🎬 아레나 현장 추천', desc: '아레나 공연 대기 중 신속하고 깔끔한 식사' },
    { place_name: '영종도 24시 백운 해물칼국수', address_name: '인천 중구 운서동', category: '칼국수', tel: '032-743-5678', tag: '🍜 심야 야식 추천', desc: '영종도 스케줄 종료 후 뜨끈한 해물칼국수' },
  ]
};
const GOLFER_PICKS = STAFF_PICKS; // 레거시 참조 호환성 유지

/* ── App State ── */
const State = {
  screen: 'home',
  schedules: [],
  customSchedules: [],
  eventOverrides: {},
  hiddenAutoEvents: [],
  currentScheduleIdx: 0,
  calMonth: new Date().getMonth(),
  calYear: new Date().getFullYear(),
  userAddresses: { home: '', office: '' },

  addSchedule(sched) {
    this.schedules.push(sched);
    this.calculateTimeline(this.schedules.length - 1);
    this.saveSchedules();
  },

  updateSchedule(idx, sched) {
    if (this.schedules[idx]) {
      this.schedules[idx] = sched;
      this.calculateTimeline(idx);
      this.saveSchedules();
    }
  },

  saveSchedules() {
    localStorage.setItem('bp_schedules_v2', JSON.stringify(this.schedules));
    localStorage.setItem('bp_custom_schedules_v2', JSON.stringify(this.customSchedules));
    localStorage.setItem('bp_event_overrides', JSON.stringify(this.eventOverrides));
    localStorage.setItem('bp_hidden_events', JSON.stringify(this.hiddenAutoEvents));
  },

  loadSchedules() {
    const data = localStorage.getItem('bp_schedules_v2');
    const customData = localStorage.getItem('bp_custom_schedules_v2');
    
    if (customData) {
      try {
        const parsed = JSON.parse(customData);
        this.customSchedules = parsed.map(s => {
          if (s.date && typeof s.date === 'string') s.date = new Date(s.date);
          return s;
        });
      } catch (e) {
        console.error('Failed to load custom schedules', e);
      }
    }

    const overridesData = localStorage.getItem('bp_event_overrides');
    const hiddenData = localStorage.getItem('bp_hidden_events');
    if (overridesData) {
      try { this.eventOverrides = JSON.parse(overridesData) || {}; } catch (e) { this.eventOverrides = {}; }
    }
    if (hiddenData) {
      try { this.hiddenAutoEvents = JSON.parse(hiddenData) || []; } catch (e) { this.hiddenAutoEvents = []; }
    }

    if (data) {
      try {
        const parsed = JSON.parse(data);
        this.schedules = parsed.map(s => {
          if (s.date && typeof s.date === 'string') {
            s.date = new Date(s.date);
          }
          return s;
        });
        return true;
      } catch (e) {
        console.error('Failed to load schedules', e);
      }
    }
    return false;
  },

  addCustomSchedule(sched) {
    sched.id = Date.now() + Math.random();
    this.customSchedules.push(sched);
    this.saveSchedules();
  },

  updateCustomSchedule(id, sched) {
    const idx = this.customSchedules.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.customSchedules[idx] = { ...this.customSchedules[idx], ...sched };
      this.saveSchedules();
    }
  },

  deleteCustomSchedule(id) {
    this.customSchedules = this.customSchedules.filter(s => s.id !== id);
    this.saveSchedules();
  },

  updateEvent(id, data) {
    if (id.toString().startsWith('auto_')) {
      if (!this.eventOverrides[id]) this.eventOverrides[id] = {};
      Object.assign(this.eventOverrides[id], data);
      this.saveSchedules();
    } else {
      this.updateCustomSchedule(id, data);
    }
  },

  hideEvent(id) {
    if (id.toString().startsWith('auto_')) {
      if (!this.hiddenAutoEvents.includes(id)) {
        this.hiddenAutoEvents.push(id);
        this.saveSchedules();
      }
    } else {
      this.deleteCustomSchedule(id);
    }
  },

  getCustomSchedulesForDate(y, m, d) {
    return this.customSchedules.filter(s => {
      const sd = s.date;
      return sd.getFullYear() === y && sd.getMonth() === m && sd.getDate() === d;
    });
  },

  calculateTimeline(idx) {
    const s = this.schedules[idx];
    if (!s) return;
    const [th, tm] = s.teeOff.split(':').map(Number);
    const arrivalMins = th * 60 + tm;
    const durMins = (s.duration || 1) * 60;

    s.timeline = {
      arrival: this.mToTime(arrivalMins),
      departure: this.mToTime(arrivalMins + durMins),
      duration: s.duration || 1
    };
  },

  currentManagerFilter: localStorage.getItem('bp_manager_filter') || 'ALL',

  setManagerFilter(mgrId) {
    this.currentManagerFilter = mgrId;
    localStorage.setItem('bp_manager_filter', mgrId);
  },

  getHQSchedulesForDate(y, m, d) {
    if (typeof window.hqStore === 'undefined') return [];
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${y}-${mm}-${dd}`;
    let schedules = (typeof window.hqStore.getSchedulesSync === 'function' ? window.hqStore.getSchedulesSync() : window.hqStore.getSchedules()).filter(s => s.date === dateStr);
    
    // 현재 로그인된 역할 및 정보 불러오기
    const userRole = localStorage.getItem('bp_user_role') || 'manager';
    const currentMgrId = localStorage.getItem('bp_manager_id');
    const assignedJson = localStorage.getItem('bp_assigned_artists');

    let assignedArtists = [];
    if (assignedJson) {
      try { assignedArtists = JSON.parse(assignedJson) || []; } catch(e) {}
    }

    // 1. CEO 및 본사 총괄 관리자 (전체 스케줄 및 비공개 스케줄 완전 열람)
    if (userRole === 'ceo' || userRole === 'hq_admin') {
      if (this.currentManagerFilter && this.currentManagerFilter !== 'ALL') {
        schedules = schedules.filter(s => s.managerId === this.currentManagerFilter || s.artistId === this.currentManagerFilter);
      }
      return schedules;
    }

    // 2. 현장 매니저 (Manager)
    if (userRole === 'manager') {
      schedules = schedules.filter(s => {
        // 비공개 스케줄인 경우 본인이 배정된 스케줄만 열람 가능
        if (s.isSecret) {
          return s.managerId === currentMgrId;
        }
        const isMyArtist = s.artistId === 'ALL' || (Array.isArray(assignedArtists) && assignedArtists.includes(s.artistId));
        const isMySchedule = s.managerId === 'ALL' || s.managerId === currentMgrId;
        return isMyArtist || isMySchedule;
      });

      if (this.currentManagerFilter && this.currentManagerFilter !== currentMgrId && this.currentManagerFilter !== 'ALL') {
        schedules = schedules.filter(s => s.artistId === this.currentManagerFilter);
      }
      return schedules;
    }

    // 3. 외부 전담 스태프 (Staff / Hair & Makeup / Security / Guest)
    if (userRole === 'staff') {
      // 비공개 스케줄은 완전 숨김, 본인 배정 아티스트의 스케줄만 노출
      schedules = schedules.filter(s => {
        if (s.isSecret) return false;
        const isMyArtist = s.artistId === 'ALL' || (Array.isArray(assignedArtists) && assignedArtists.includes(s.artistId));
        return isMyArtist;
      });

      if (this.currentManagerFilter && this.currentManagerFilter !== 'ALL') {
        schedules = schedules.filter(s => s.artistId === this.currentManagerFilter);
      }
      return schedules;
    }

    return schedules;
  },

  mToTime(m) {
    if (m < 0) m += 1440;
    const h = Math.floor(m / 60) % 24;
    const min = m % 60;
    return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
  },

  getSchedulesForDate(y, m, d) {
    const localScheds = this.schedules.filter(s => {
      const sd = s.date;
      return sd.getFullYear()===y && sd.getMonth()===m && sd.getDate()===d;
    });

    const hqScheds = this.getHQSchedulesForDate(y, m, d).map(hs => ({
      isHQ: true,
      id: hs.id,
      title: hs.title,
      artistName: hs.artistName,
      artistId: hs.artistId,
      category: hs.category,
      teeOff: hs.startTime,
      endTime: hs.endTime,
      duration: Math.max(1, Math.round(((parseInt(hs.endTime?.split(':')[0]||'18',10)*60 + parseInt(hs.endTime?.split(':')[1]||'0',10)) - (parseInt(hs.startTime?.split(':')[0]||'9',10)*60 + parseInt(hs.startTime?.split(':')[1]||'0',10))) / 60)),
      course: { name: hs.title, addr: hs.location },
      location: hs.location,
      managerId: hs.managerId,
      managerName: hs.managerName,
      vehicleId: hs.vehicleId,
      vehicleName: hs.vehicleName,
      isSecret: hs.isSecret || false,
      secretLevel: hs.secretLevel,
      shop: hs.shop,
      departure: hs.departure,
      status: hs.status,
      outfit: hs.outfit,
      supplies: hs.supplies,
      notes: hs.notes,
      timeline: hs.timeline
    }));

    return [...localScheds, ...hqScheds];
  },

  calculateDailyEvents(y, m, d) {
    const hqScheds = this.getHQSchedulesForDate(y, m, d);
    let scheds = this.schedules.filter(s => {
      const sd = s.date;
      return sd.getFullYear()===y && sd.getMonth()===m && sd.getDate()===d;
    });
    let customScheds = this.getCustomSchedulesForDate(y, m, d);
    
    let events = [];

    // 1. HQ 본사 연동 스케줄이 있는 경우: 스마트 동선 타임라인 우선 생성
    if (hqScheds && hqScheds.length > 0) {
      // Sort hqScheds by start time
      hqScheds.sort((a, b) => {
        const aStart = a.startTime || '09:00';
        const bStart = b.startTime || '09:00';
        return aStart.localeCompare(bStart);
      });

      let previousEndTimeStr = null;

      hqScheds.forEach((hs, hqIdx) => {
        // 스케줄 사이의 빈틈(Gap) 계산 및 삽입
        if (previousEndTimeStr && hs.timeline && hs.timeline.length > 0) {
          const firstEventTime = hs.timeline[0].time;
          const [ph, pm] = previousEndTimeStr.split(':').map(Number);
          const [nh, nm] = firstEventTime.split(':').map(Number);
          const prevMins = ph * 60 + pm;
          const nextMins = nh * 60 + nm;
          const gapMins = nextMins - prevMins;

          if (gapMins > 0) {
            const gapHours = Math.floor(gapMins / 60);
            const gapRemainMins = gapMins % 60;
            let gapText = gapHours > 0 ? `${gapHours}시간` : '';
            if (gapRemainMins > 0) gapText += ` ${gapRemainMins}분`;

            let gapLabel = `[대기/휴식] 다음 일정까지 ${gapText} 휴식`;
            if (gapMins >= 120) {
              gapLabel = `[식사/정비] 식사 및 이동 여유시간 (${gapText})`;
            } else if (gapMins >= 60) {
              gapLabel = `[대기/이동] 이동 및 대기 (${gapText})`;
            }

            events.push({
              id: `gap_${hqIdx}`,
              hqScheduleId: null, // Gap event is informational, doesn't belong to a specific schedule's state
              isHQ: true,
              isAuto: true,
              type: 'travel',
              stepCategory: 'rest',
              title: gapLabel,
              time: previousEndTimeStr,
              durMin: gapMins,
              desc: '개인 정비 및 식사 가능',
              done: true, // Auto complete or read-only
              moving: false,
              artistName: hs.artistName,
              managerName: hs.managerName,
              vehicleName: '',
              location: '자유 시간',
              outfit: '',
              status: '예정'
            });
          }
        }

        const [sh, sm] = (hs.startTime || '09:00').split(':').map(Number);
        const [eh, em] = (hs.endTime || '18:00').split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        const durMin = Math.max(30, endMins - startMins);

        // 스케줄에 저장된 세부 동선 타임라인이 있으면 그것을 직접 이벤트로 풀어서 전달
        if (hs.timeline && hs.timeline.length > 0) {
          hs.timeline.forEach((step, stepIdx) => {
            let icon = '⏱️';
            let type = 'schedule';
            if (step.label.includes('출발') || step.label.includes('픽업')) { icon = '🚗'; type = 'travel'; }
            else if (step.label.includes('샵') || step.label.includes('메이크업')) { icon = '💄'; type = 'prep'; }
            else if (step.label.includes('이동')) { icon = '🚐'; type = 'travel'; }
            else if (step.label.includes('리허설') || step.label.includes('녹화') || step.label.includes('본무대') || step.label.includes('메인')) { icon = '🎬'; type = 'schedule'; }
            else if (step.label.includes('식사') || step.label.includes('대기')) { icon = '🍱'; type = 'prep'; }
            else if (step.label.includes('종료') || step.label.includes('복귀')) { icon = '🏁'; type = 'travel'; }

            events.push({
              id: `hq_${hs.id}_step_${stepIdx}`,
              hqScheduleId: hs.id,
              timelineIdx: stepIdx,
              isHQ: true,
              isAuto: true,
              type: type,
              title: step.label,
              time: step.time,
              durMin: 30,
              icon: icon,
              desc: step.desc || '',
              done: step.done || false,
              doneAt: step.doneAt || null,    // 실제 현장 매니저 완료 타임스탬프
              moving: step.moving || false,   // 단계별 이동중 상태 (개별 관리)
              artistName: hs.artistName,
              managerName: hs.managerName,
              vehicleName: hs.vehicleName,
              location: hs.location,
              outfit: hs.outfit,
              status: hs.status
            });
          });

          // Update previous end time for next iteration
          const lastEvent = hs.timeline[hs.timeline.length - 1];
          previousEndTimeStr = lastEvent.time;
        } else {
          // 타임라인이 아직 없을 경우 기본 일정으로 추가
          events.push({
            id: `hq_main_${hs.id}`,
            hqScheduleId: hs.id,
            isHQ: true,
            type: 'schedule',
            title: `[${hs.artistName}] ${hs.title}`,
            time: hs.startTime,
            durMin: durMin,
            icon: '🎬',
            artistName: hs.artistName,
            managerName: hs.managerName,
            vehicleName: hs.vehicleName,
            location: hs.location,
            outfit: hs.outfit,
            status: hs.status,
            isAuto: true
          });
          previousEndTimeStr = hs.endTime || hs.startTime;
        }
      });
    }

    // 2. 일반 로컬 스케줄 계산 (기존 로직 보존)
    if (scheds && scheds.length > 0) {
      scheds.sort((a,b) => (a.teeOff < b.teeOff ? -1 : 1));
      const firstSched = scheds[0];
      const [th, tm] = firstSched.teeOff.split(':').map(Number);
      const arrivalMins = th * 60 + tm;
      const datePrefix = `${y}-${m}-${d}`;
      const artistDorm = (this.userAddresses && this.userAddresses.artist && this.userAddresses.artist.name) ? this.userAddresses.artist.name : '숙소';
      
      const getDur = (id, defaultDur) => {
        if (this.hiddenAutoEvents.includes(id)) return 0;
        if (this.eventOverrides[id] && this.eventOverrides[id].durMin !== undefined) {
          return parseInt(this.eventOverrides[id].durMin, 10);
        }
        return defaultDur;
      };

      const applyStep = (id, type, defaultTitle, icon, defaultDur, endTimeRef) => {
        const durMin = getDur(id, defaultDur);
        let startTime = endTimeRef - durMin;
        if (this.eventOverrides[id] && this.eventOverrides[id].time) {
           const [oh, om] = this.eventOverrides[id].time.split(':').map(Number);
           startTime = oh * 60 + om;
        }
        return {
          ev: {
            id, type, icon, isAuto: true,
            title: (this.eventOverrides[id] && this.eventOverrides[id].title) ? this.eventOverrides[id].title : defaultTitle,
            time: this.mToTime(startTime < 0 ? 0 : startTime),
            durMin
          },
          startTime
        };
      };

      let currentEnd = arrivalMins;
      const step5 = applyStep(`auto_${datePrefix}_travel_sched`, 'travel', `샵 ➔ ${firstSched.course.name} 이동`, '🚐', 40, currentEnd);
      currentEnd = step5.startTime;
      const step4 = applyStep(`auto_${datePrefix}_shop`, 'prep', '헤어/메이크업 샵', '✂️', 90, currentEnd);
      currentEnd = step4.startTime;
      const step3 = applyStep(`auto_${datePrefix}_travel_shop`, 'travel', `${artistDorm} ➔ 샵 이동`, '🚗', 30, currentEnd);
      currentEnd = step3.startTime;
      const step2 = applyStep(`auto_${datePrefix}_call`, 'prep', `${artistDorm} 모닝콜 및 대기`, '📱', 30, currentEnd);
      currentEnd = step2.startTime;
      const step1 = applyStep(`auto_${datePrefix}_wakeup`, 'prep', '매니저 기상 및 출근 준비', '⏰', 60, currentEnd);

      const baseAutoEvents = [step1.ev, step2.ev, step3.ev, step4.ev, step5.ev];
      baseAutoEvents.forEach(ev => {
        if (!this.hiddenAutoEvents.includes(ev.id)) events.push(ev);
      });

      for (let i = 0; i < scheds.length; i++) {
        const s = scheds[i];
        const [sh, sm] = s.teeOff.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const durMins = (s.duration || 1) * 60;
        events.push({
          id: `auto_${datePrefix}_sched_${i}`,
          type: 'schedule',
          title: s.course.name,
          time: s.teeOff, 
          durMin: durMins,
          durationHr: s.duration || 1,
          scheduleIdx: this.schedules.indexOf(s),
          icon: '🎬',
          isAuto: true
        });
      }
    }

    // Merge custom schedules
    const mappedCustom = customScheds.map(cs => ({
      id: cs.id,
      type: 'custom',
      title: cs.title,
      time: cs.time,
      durMin: cs.durMin || 30,
      icon: cs.icon || '📌',
      location: cs.location || '',
      isAuto: false
    }));

    events = events.concat(mappedCustom);

    // Sort by time
    events.sort((a, b) => {
      const aTime = parseInt((a.time||'00:00').replace(':', ''), 10) || 0;
      const bTime = parseInt((b.time||'00:00').replace(':', ''), 10) || 0;
      return aTime - bTime;
    });

    return events;
  },

  hasScheduleOnDate(y, m, d) {
    return this.getSchedulesForDate(y, m, d).length > 0;
  },

  initDemo() {
    // Disabled demo injection to prevent undefined schedules in manager app
  },
};

/* ── 식당 별점 평가 시스템 ── */
const ReviewStore = {
  STORAGE_KEY: 'bp_restaurant_reviews',

  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
    } catch { return {}; }
  },

  getReviews(restaurantName) {
    const all = this.getAll();
    return all[restaurantName] || { ratings: [], avgRating: 0, count: 0 };
  },

  addReview(restaurantName, stars, comment = '', courseName = '') {
    const all = this.getAll();
    if (!all[restaurantName]) {
      all[restaurantName] = { ratings: [], avgRating: 0, count: 0 };
    }
    all[restaurantName].ratings.push({
      stars,
      comment,
      courseName,
      date: new Date().toISOString(),
      user: State.userName || '현장 매니저'
    });
    // 평균 별점 재계산
    const ratings = all[restaurantName].ratings;
    all[restaurantName].count = ratings.length;
    all[restaurantName].avgRating = parseFloat((ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1));
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
    return all[restaurantName];
  },

  // 별점 렌더링 (읽기 전용)
  renderStars(avgRating, count) {
    const full = Math.floor(avgRating);
    const half = avgRating - full >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    let html = '';
    for (let i = 0; i < full; i++) html += '★';
    if (half) html += '☆';
    for (let i = 0; i < empty; i++) html += '☆';
    return `<span style="color:#f59e0b; font-size:0.85rem; letter-spacing:1px;">${html}</span> <span style="font-size:0.75rem; color:var(--text-400);">${avgRating} (${count}명)</span>`;
  },

  // 별점 입력 UI (인터랙티브)
  renderStarInput(currentStars = 0) {
    let html = '<div class="star-input" style="display:flex; gap:4px; font-size:1.8rem; cursor:pointer;">';
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star-btn" data-star="${i}" onclick="ReviewStore.onStarClick(${i})" style="color:${i <= currentStars ? '#f59e0b' : '#d1d5db'}; transition:color 0.15s; user-select:none;">${i <= currentStars ? '★' : '☆'}</span>`;
    }
    html += '</div>';
    return html;
  },

  onStarClick(stars) {
    window._selectedStars = stars;
    document.querySelectorAll('.star-btn').forEach(el => {
      const s = parseInt(el.dataset.star);
      el.textContent = s <= stars ? '★' : '☆';
      el.style.color = s <= stars ? '#f59e0b' : '#d1d5db';
    });
  },

  // 평가 모달 열기
  openRatingModal(restaurantName, courseName = '') {
    window._selectedStars = 0;
    window._ratingRestaurantName = restaurantName;
    window._ratingCourseName = courseName;

    const existing = this.getReviews(restaurantName);
    let existingHtml = '';
    if (existing.count > 0) {
      existingHtml = `
        <div style="margin-bottom:var(--sp-4); padding:var(--sp-3); background:var(--bg); border-radius:var(--r-md); border:1px solid var(--border);">
          <div style="font-size:var(--text-sm); color:var(--text-400); margin-bottom:4px;">현재 평가</div>
          <div>${this.renderStars(existing.avgRating, existing.count)}</div>
        </div>
      `;
      // 최근 리뷰 3개 표시
      const recentReviews = existing.ratings.slice(-3).reverse();
      if (recentReviews.length > 0) {
        existingHtml += '<div style="margin-bottom:var(--sp-4);">';
        existingHtml += '<div style="font-size:var(--text-sm); color:var(--text-400); margin-bottom:8px;">최근 매니저/스태프 평가</div>';
        recentReviews.forEach(r => {
          const d = new Date(r.date);
          const dateStr = `${d.getMonth()+1}/${d.getDate()}`;
          const stars = '★'.repeat(r.stars) + '☆'.repeat(5 - r.stars);
          existingHtml += `
            <div style="padding:8px; margin-bottom:6px; background:var(--bg); border-radius:6px; border:1px solid var(--border);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                <span style="font-size:var(--text-sm); color:#f59e0b;">${stars}</span>
                <span style="font-size:0.7rem; color:var(--text-500);">${r.user} · ${dateStr}</span>
              </div>
              ${r.comment ? `<div style="font-size:var(--text-sm); color:var(--text-300);">${r.comment}</div>` : ''}
            </div>
          `;
        });
        existingHtml += '</div>';
      }
    }

    const modalContent = `
      ${existingHtml}
      <div style="text-align:center; margin-bottom:var(--sp-3);">
        <div style="font-size:var(--text-sm); color:var(--text-400); margin-bottom:8px;">별점을 눌러주세요</div>
        ${this.renderStarInput(0)}
      </div>
      <textarea id="review-comment" placeholder="한줄 평가를 남겨주세요 (선택)" style="width:100%; padding:var(--sp-3); border:1px solid var(--border); border-radius:var(--r-md); font-size:var(--fs-sm); resize:none; height:60px; box-sizing:border-box; margin-bottom:var(--sp-3); font-family:inherit; background:var(--bg); color:var(--text-100);"></textarea>
      <button class="btn btn-primary" style="width:100%; background:linear-gradient(135deg,#f59e0b,#b45309);" onclick="ReviewStore.submitReview()">⭐ 평가 등록하기</button>
    `;
    App.showModal(`⭐ ${restaurantName} 평가`, modalContent);
  },

  submitReview() {
    const stars = window._selectedStars || 0;
    if (stars === 0) { U.toast('⚠️ 별점을 선택해주세요!'); return; }
    const comment = document.getElementById('review-comment')?.value || '';
    const name = window._ratingRestaurantName;
    const course = window._ratingCourseName;

    this.addReview(name, stars, comment, course);
    App.closeModal();
    U.toast(`⭐ ${name}에 ${stars}점 평가를 남겼습니다!`);
    U.haptic();
  }
};

/* =========================================
   STAFF_PICKS — 수도권 및 주요 지역 스태프 추천 맛집
   ========================================= */
Object.assign(STAFF_PICKS, {
  '서울': [
    { place_name:'상암 일미락 (룸 완비)',  category:'구이/한우', address_name:'서울 마포구 상암산로', tag:'제작진 회식 1위', rating:4.8 },
    { place_name:'여의도 창고43 VIP룸',     category:'한우',     address_name:'서울 영등포구 여의서로', tag:'프라이빗 룸 회식', rating:4.9 },
    { place_name:'청담 새벽집 24시',        category:'한우/육회', address_name:'서울 강남구 도산대로',   tag:'연예인 단골 1위',   rating:4.8 },
    { place_name:'방이동 24시 감자탕',      category:'감자탕',   address_name:'서울 송파구 올림픽로',   tag:'콘서트 스태프 추천', rating:4.6 },
    { place_name:'동대문 24시 닭한마리',    category:'한식',     address_name:'서울 종로구 종로40가길', tag:'심야 스케줄 후 추천', rating:4.7 },
  ],
  '경기': [
    { place_name:'일산 드림센터 앞 해장국', category:'해장국', address_name:'경기 고양시 일산동구 호수로', tag:'새벽 사녹 필수', rating:4.6 },
    { place_name:'파주 탄현 세트장 백반',  category:'백반',   address_name:'경기 파주시 탄현면',       tag:'세트장 스태프 1위', rating:4.7 },
    { place_name:'성남 판교 회식 정육식당', category:'한우',   address_name:'경기 성남시 분당구',       tag:'제작진 단체 추천', rating:4.6 },
    { place_name:'수원 인계동 24시 국밥',  category:'국밥',   address_name:'경기 수원시 팔달구',       tag:'든든한 야식',      rating:4.5 },
  ],
  '인천': [
    { place_name:'인스파이어 아레나 푸드홀', category:'양식/한식', address_name:'인천 중구 공항문화로', tag:'아레나 공연장 추천', rating:4.7 },
    { place_name:'영종도 해물칼국수',        category:'칼국수',   address_name:'인천 중구 운서동',       tag:'스케줄 종료 후 추천', rating:4.6 },
    { place_name:'송도 센트럴 룸 한정식',    category:'한정식',   address_name:'인천 연수구 송도동',     tag:'정갈한 미팅 식당',  rating:4.7 },
  ],
  '강원': [
    { place_name:'춘천 호반 닭갈비 본점',   category:'닭갈비',   address_name:'강원 춘천시 낙원동',     tag:'로케 촬영 스태프 추천', rating:4.7 },
    { place_name:'강릉 초당 순두부마을',    category:'순두부',   address_name:'강원 강릉시 초당동',     tag:'속 편한 아침 식사',  rating:4.8 },
    { place_name:'원주 단계동 한우타운',    category:'한우',     address_name:'강원 원주시 단계동',     tag:'지방 행사 뒤풀이',   rating:4.7 },
  ],
  '제주': [
    { place_name:'제주 흑돼지 연동 본점',   category:'흑돼지',   address_name:'제주 제주시 연동',       tag:'제주 공연 후 필수', rating:4.9 },
    { place_name:'서귀포 갈치조림 명가',    category:'한식',     address_name:'제주 서귀포시 정방동',   tag:'제주 스케줄 단골',  rating:4.8 },
    { place_name:'애월 해안도로 브런치',    category:'카페',     address_name:'제주 제주시 애월읍',     tag:'촬영 대기 추천',    rating:4.7 },
  ]
});

