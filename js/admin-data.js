/* ===================================================
   HQ Master Schedule — Data Store & Sync Manager
   (Supabase Cloud + Local Storage 100% Synchronous Compatible Store)
   =================================================== */

const HQ_STORAGE_KEYS = {
  SCHEDULES: 'HQ_SCHEDULES_V5',
  ARTISTS: 'HQ_ARTISTS_V5',
  MANAGERS: 'HQ_MANAGERS_V5',
  VEHICLES: 'HQ_VEHICLES_V5',
  SUBSCRIPTION: 'HQ_SUBSCRIPTION_V5'
};

// 기본 회사 구독 정보 (월 10만 / 기본 2인 포함 + 1인당 월 2만 추가)
const DEFAULT_SUBSCRIPTION = {
  companyName: '스타엔터테인먼트 (STAR ENT)',
  bizNumber: '123-45-67890',
  ceoName: '홍길동',
  planName: 'Enterprise Standard',
  baseFee: 100000,          // 기본 월 10만 원
  baseSlots: 2,             // 기본 2명 포함
  additionalSlotFee: 20000, // 추가 1인당 월 2만 원
  additionalSlots: 0,       // 추가 슬롯 수
  paymentDate: '매월 25일',
  paymentMethod: '현대카드 (•••• 4589) 자동결제',
  status: 'active'
};

// CEO 브리핑용 초기 아티스트 데이터 세팅
const DEFAULT_ARTISTS = [
  {
    id: 'art_1', name: '루나스 (LUNAS)', type: '아이돌/걸그룹', members: 4, color: '#ec4899', emoji: '🌟', status: '활동중',
    care_info: {
      allergies: "멤버 '아린' 복숭아, 생갑각류 알러지 (절대 주의), 대기실 24도 유지",
      beverages: "아이스 아메리카노 4잔(얼음 많이), 샐러드 팩(드레싱 따로), 도라지배즙",
      vehicle_pref: "카니발 하이리무진 1호차, 전 좌석 암막 커튼, 방향제 제거",
      emergency: "응급처치 키트 2호차 트렁크 보관, 공항 출입국 사설 경호팀 밀착",
      contacts: "헤어(제니): 010-1234-5678, 메이크업(수진): 010-2345-6789"
    }
  },
  {
    id: 'art_2', name: '에이펙스 (APEX)', type: '보이그룹', members: 7, color: '#3b82f6', emoji: '🔥', status: '활동중',
    care_info: {
      allergies: "식사 시 멤버별 다이어트/일반 식단 분리 배식, 인이어 장비 파손 주의",
      beverages: "제로 콜라 1박스 상시 비치, 에너지 드링크, 닭가슴살 고단백 도시락",
      vehicle_pref: "1호차(보컬), 2호차(퍼포먼스) 분산 탑승. 에어컨 강하게(20도)",
      emergency: "무릎 테이핑용 파스, 근육 이완제, 얼음주머니 준비",
      contacts: "경호팀장(최강철): 010-9999-8888"
    }
  },
  {
    id: 'art_3', name: '차은호', type: '배우', members: 1, color: '#8b5cf6', emoji: '🎬', status: '활동중',
    care_info: {
      allergies: "햇빛 알레르기 미세 있음(야외 촬영 시 암막 우산 필수), 향수 금지",
      beverages: "따뜻한 디카페인 커피, 페리에 탄산수, 과일 도시락",
      vehicle_pref: "제네시스 G90 (조수석 뒤 VIP석), 대본 암기용 핀조명 세팅",
      emergency: "인공눈물 상시 구비, 야외 촬영용 핫팩/미니 선풍기(계절별)",
      contacts: "스타일리스트(이유미): 010-7777-6666"
    }
  },
  {
    id: 'art_4', name: '유나 (YUNA)', type: '솔로가수', members: 1, color: '#f59e0b', emoji: '🎤', status: '활동중',
    care_info: {
      allergies: "에어컨 직바람 금지 (목 보호), 대기실 가습기 필수 세팅",
      beverages: "미온수, 프로폴리스 캔디, 샌드위치 (에그마요 선호)",
      vehicle_pref: "조수석 선호, 차량 내 가습기 가동",
      emergency: "목 보호용 스프레이, 소화제 상시 구비",
      contacts: "안무팀장(박제이): 010-1111-2222"
    }
  }
];

// 초기 매니저 및 임직원/스태프 풀 (빈 상태로 시작)
const DEFAULT_MANAGERS = [];

// 초기 지원 차량 풀 (빈 상태로 시작)
const DEFAULT_VEHICLES = [];

// 스케줄 카테고리
const SCHEDULE_CATEGORIES = {
  MUSIC_SHOW: { id: 'music_show', name: '음악방송', color: '#ef4444', icon: '📺' },
  SHOOTING: { id: 'shooting', name: '화보/촬영/광고', color: '#f59e0b', icon: '📸' },
  EVENT: { id: 'event', name: '행사/콘서트/공연', color: '#8b5cf6', icon: '🎪' },
  FANSIGN: { id: 'fansign', name: '팬사인회/팬미팅', color: '#ec4899', icon: '💌' },
  BROADCAST: { id: 'broadcast', name: '예능/라디오/인터뷰', color: '#3b82f6', icon: '🎙️' },
  RECORDING: { id: 'recording', name: '녹음/안무레슨/연습', color: '#10b981', icon: '🎵' },
  MEETING: { id: 'meeting', name: '기획회의/미팅', color: '#6b7280', icon: '💼' }
};

// 기본 데모 스케줄 생성
function getInitialMockSchedules() {
  return [];
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomY = tomorrow.getFullYear();
  const tomM = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomD = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${tomY}-${tomM}-${tomD}`;

  const schedules = [
    {
      id: 'sch_101',
      title: 'SBS 인기가요 생방송 & 사녹',
      artistId: 'art_1',
      artistName: '루나스 (LUNAS)',
      category: 'music_show',
      date: todayStr,
      startTime: '07:30',
      endTime: '17:00',
      managerId: 'mgr_2',
      managerName: '박진우 매니저',
      vehicleId: 'veh_1',
      vehicleName: '카니발 하이리무진 1호차 (12가 3456)',
      status: '진행중',
      location: '상암 SBS 프리즘타워 (서울 마포구 상암산로 82)',
      shop: {
        needed: true,
        name: '정샘물 청담점',
        time: '05:30',
        durationMin: 90,
        address: '서울 강남구 압구정로 456'
      },
      departure: {
        place: '청담 숙소',
        time: '05:00'
      },
      outfit: '1번 무대의상 (블랙&글리터 수트) + 인이어 4세트',
      supplies: '음료 20잔, 비상용 구급약, 사인 CD 30장, 인이어 배터리',
      notes: '사전녹화 08:30 시작 예정. 딜레이 없도록 07:10까지 방송국 도착 필수.',
      timeline: [
        { time: '05:00', label: '숙소 픽업 및 출발', done: true },
        { time: '05:30', label: '청담 헤어/메이크업 샵 도착 및 세팅', done: true },
        { time: '07:00', label: '상암 SBS 프리즘타워로 이동', done: false },
        { time: '07:30', label: '방송국 대기실 입실 & 마이크 세팅', done: false },
        { time: '08:30', label: '인기가요 사전녹화 진행', done: false },
        { time: '12:00', label: '대기실 도시락 식사 & 팬 역조공 체크', done: false },
        { time: '15:20', label: '생방송 출연 및 1위 후보 인터뷰', done: false },
        { time: '17:00', label: '생방송 종료 후 숙소 복귀 이동', done: false }
      ]
    },
    {
      id: 'sch_102',
      title: '보그(VOGUE) 9월호 커버 화보 촬영',
      artistId: 'art_3',
      artistName: '강서준',
      category: 'shooting',
      date: todayStr,
      startTime: '10:00',
      endTime: '18:00',
      managerId: 'mgr_4',
      managerName: '이지은 대리',
      vehicleId: 'veh_4',
      vehicleName: '제네시스 G90 (78라 5678)',
      status: '예정',
      location: '스튜디오 성수 루프탑 (서울 성동구 성수이로 22)',
      shop: {
        needed: true,
        name: '순수 청담본점',
        time: '08:30',
        durationMin: 60,
        address: '서울 강남구 도산대로 123'
      },
      departure: {
        place: '자택 픽업 (성동구 옥수동)',
        time: '08:00'
      },
      outfit: '명품 브랜드 앰버서더 룩 4착장 픽업 완료',
      supplies: '스팀 다리미, 헤어 픽서, 간식 박스, 포트폴리오',
      notes: '야외 자연광 촬영 포함. 우천 시 실내 A스튜디오로 대체.',
      timeline: [
        { time: '08:00', label: '자택 픽업', done: false },
        { time: '08:30', label: '헤어/메이크업 샵 도착', done: false },
        { time: '10:00', label: '성수동 스튜디오 도착 & 콘셉트 미팅', done: false },
        { time: '11:00', label: 'A컷 메인 촬영 시작 (1~2착)', done: false },
        { time: '14:00', label: '점심 식사 및 메이크업 체인지', done: false },
        { time: '15:00', label: 'B컷 루프탑 야외 촬영 (3~4착)', done: false },
        { time: '18:00', label: '촬영 종료 및 의상 반납 패킹', done: false }
      ]
    },
    {
      id: 'sch_103',
      title: '미니 3집 발매기념 대면 팬사인회',
      artistId: 'art_2',
      artistName: '에이펙스 (APEX)',
      category: 'fansign',
      date: tomorrowStr,
      startTime: '14:00',
      endTime: '17:30',
      managerId: 'mgr_3',
      managerName: '최현석 매니저',
      vehicleId: 'veh_2',
      vehicleName: '카니발 하이리무진 2호차 (34나 7890)',
      status: '예정',
      location: '코엑스 아티움 5층 대강당 (서울 강남구 영동대로 513)',
      shop: {
        needed: true,
        name: '정샘물 청담점',
        time: '11:00',
        durationMin: 90,
        address: '서울 강남구 압구정로 456'
      },
      departure: {
        place: '숙소 픽업',
        time: '10:30'
      },
      outfit: '스페셜 캐주얼 무드의상 & 명찰/머리띠 수거함 준비',
      supplies: '네임펜 50자루, 포스트잇, 경호팀 무전기 5대, 이벤트 선물',
      notes: '팬 100명 추첨 대면 진행. 경호팀 사전 동선 브리핑 13:00 실시.',
      timeline: [
        { time: '10:30', label: '숙소 픽업', done: false },
        { time: '11:00', label: '헤어/메이크업 진행', done: false },
        { time: '13:00', label: '코엑스 행사장 도착 및 음향/동선 리허설', done: false },
        { time: '14:00', label: '팬사인회 1부 진행', done: false },
        { time: '16:00', label: '포토타임 & 미니 토크쇼', done: false },
        { time: '17:30', label: '사인회 종료 및 퇴근길 경호', done: false }
      ]
    },
    {
      id: 'sch_104',
      title: '드라마 대본 리딩',
      artistId: 'art_5',
      artistName: '차은호',
      category: 'meeting',
      date: todayStr,
      startTime: '10:00',
      endTime: '12:00',
      managerId: 'mgr_4',
      managerName: '이지은 대리',
      vehicleId: 'veh_4',
      vehicleName: '제네시스 G90 (78라 5678)',
      status: '예정',
      location: 'tvN 상암사옥 대회의실',
      shop: { needed: false },
      departure: { place: '자택 픽업', time: '09:00' },
      outfit: '단정한 사복',
      supplies: '대본, 펜, 텀블러',
      notes: '주연 배우 첫 전체 리딩'
    },
    {
      id: 'sch_105',
      title: '드라마 제작발표회',
      artistId: 'art_5',
      artistName: '차은호',
      category: 'event',
      date: todayStr,
      startTime: '13:00',
      endTime: '15:00',
      managerId: 'mgr_4',
      managerName: '이지은 대리',
      vehicleId: 'veh_4',
      vehicleName: '제네시스 G90 (78라 5678)',
      status: '예정',
      location: '상암 스탠포드 호텔 2층 그랜드볼룸',
      shop: {
        needed: true,
        name: '순수 청담본점',
        time: '11:30',
        durationMin: 60,
        address: '서울 강남구 도산대로 123'
      },
      departure: { place: 'tvN 상암사옥', time: '11:00' },
      outfit: '제작발표회용 협찬 수트',
      supplies: '헤어 수정 도구, 질문지',
      notes: '기자 Q&A 진행 예정'
    },
    {
      id: 'sch_106',
      title: '유튜브 채널 예능 게스트 출연',
      artistId: 'art_5',
      artistName: '차은호',
      category: 'broadcast',
      date: todayStr,
      startTime: '17:00',
      endTime: '20:00',
      managerId: 'mgr_4',
      managerName: '이지은 대리',
      vehicleId: 'veh_4',
      vehicleName: '제네시스 G90 (78라 5678)',
      status: '예정',
      location: '강남구 논현동 스튜디오',
      shop: { needed: false },
      departure: { place: '상암 스탠포드 호텔', time: '16:00' },
      outfit: '편안한 캐주얼',
      supplies: '간식, 홍보용 굿즈',
      notes: '먹방 컨셉 촬영'
    },
    {
      id: 'sch_107',
      title: '글로벌 명품 브랜드 앰버서더 극비 계약 미팅',
      artistId: 'art_1',
      artistName: '루나스 (LUNAS)',
      category: 'meeting',
      date: todayStr,
      startTime: '19:00',
      endTime: '21:00',
      managerId: 'mgr_1',
      managerName: '김태현 총괄팀장',
      vehicleId: 'veh_4',
      vehicleName: '제네시스 G90 (78라 5678)',
      status: '예정',
      location: '조선팰리스 서울 강남 VIP 프라이빗 다이닝',
      isSecret: true,
      secretLevel: 'confidential',
      shop: { needed: false },
      departure: { place: '상암 SBS 프리즘타워', time: '17:30' },
      outfit: '포멀 비즈니스 캐주얼',
      supplies: '브랜드 제안서, 전속계약 검토안',
      notes: '🔒 [언론 엠바고 & 극비 보안] 대표이사 및 총괄팀장 외 비공개. 일반 매니저/스태프 열람 제한.'
    }
  ];

  // 자동으로 타임라인이 없는 데이터는 역산 로직을 태움
  const generateAutoTimelineFn = (schedule) => {
    const timeline = [];
    const mainStartTime = schedule.startTime || '10:00';
    const [startH, startM] = mainStartTime.split(':').map(Number);
    const startMinutes = (startH || 10) * 60 + (startM || 0);

    if (schedule.shop && schedule.shop.needed) {
      const shopDuration = Number(schedule.shop.durationMin) || 90;
      const travelShopToMain = 35;
      const shopArriveMinutes = startMinutes - travelShopToMain - shopDuration;
      const departMinutes = shopArriveMinutes - 30;

      const fmt = (min) => {
        const positiveMin = ((min % 1440) + 1440) % 1440;
        const h = Math.floor(positiveMin / 60);
        const m = positiveMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      timeline.push({ time: fmt(departMinutes), label: `${schedule.departure?.place || '숙소'} 픽업 및 출발`, desc: `담당 매니저: ${schedule.managerName || '배정 매니저'}`, done: false });
      timeline.push({ time: fmt(shopArriveMinutes), label: `💄 [헤어/메이크업] ${schedule.shop.name || '헤메샵'} 도착 및 스타일링`, desc: `소요시간 약 ${shopDuration}분 (${schedule.shop.address || ''})`, done: false });
      timeline.push({ time: fmt(startMinutes - travelShopToMain), label: `🚗 현장(${schedule.location || '행사장'})으로 이동 출발`, desc: '의상 및 마이크/소품 최종 체크', done: false });
    } else {
      const departMinutes = startMinutes - 45;
      const fmt = (min) => {
        const positiveMin = ((min % 1440) + 1440) % 1440;
        const h = Math.floor(positiveMin / 60);
        const m = positiveMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };
      timeline.push({ time: fmt(departMinutes), label: `${schedule.departure?.place || '출발지'} 출발 및 이동`, desc: `배차: ${schedule.vehicleName || '지정 차량'}`, done: false });
    }

    timeline.push({ time: schedule.startTime, label: `🎬 [메인 일정] ${schedule.title}`, desc: `장소: ${schedule.location || '현장'} / 현장 담당자 미팅 & 대기실 세팅`, done: false });
    if (schedule.endTime) {
      timeline.push({ time: schedule.endTime, label: `🏁 일정 종료 및 현장 철수 / 복귀 이동`, desc: '협찬 의상 수거, 준비물 점검 후 숙소/사옥 복귀', done: false });
    }
    return timeline;
  };

  return schedules.map(sch => {
    if (!sch.timeline || sch.timeline.length === 0) {
      sch.timeline = generateAutoTimelineFn(sch);
    }
    return sch;
  });
}

class HQDataStore {
  constructor() {
    this.initStorage();
    this.broadcast = new BroadcastChannel('HQ_PLANNER_CHANNEL');
    this.syncFromSupabase();
  }

  initStorage() {
    if (!localStorage.getItem(HQ_STORAGE_KEYS.ARTISTS)) {
      localStorage.setItem(HQ_STORAGE_KEYS.ARTISTS, JSON.stringify(DEFAULT_ARTISTS));
    }
    if (!localStorage.getItem(HQ_STORAGE_KEYS.MANAGERS)) {
      localStorage.setItem(HQ_STORAGE_KEYS.MANAGERS, JSON.stringify(DEFAULT_MANAGERS));
    }
    if (!localStorage.getItem(HQ_STORAGE_KEYS.VEHICLES)) {
      localStorage.setItem(HQ_STORAGE_KEYS.VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
    }
    
    if (!localStorage.getItem(HQ_STORAGE_KEYS.SCHEDULES)) {
      localStorage.setItem(HQ_STORAGE_KEYS.SCHEDULES, JSON.stringify(getInitialMockSchedules()));
    }

    if (!localStorage.getItem(HQ_STORAGE_KEYS.SUBSCRIPTION)) {
      localStorage.setItem(HQ_STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(DEFAULT_SUBSCRIPTION));
    }
  }

  // ── 🏢 회사 구독 & 매니저 슬롯 (Seat) 관리 ──
  getSubscription() {
    try {
      const sub = JSON.parse(localStorage.getItem(HQ_STORAGE_KEYS.SUBSCRIPTION)) || DEFAULT_SUBSCRIPTION;
      const managers = this.getManagers();
      // 매니저 수 실시간 계산 (총괄 hq_admin 제외 현장 매니저 수 카운트)
      const activeManagerCount = managers.filter(m => m.role !== 'hq_admin').length;
      const totalSlots = (sub.baseSlots || 2) + (sub.additionalSlots || 0);
      const monthlyFee = (sub.baseFee || 100000) + ((sub.additionalSlots || 0) * (sub.additionalSlotFee || 20000));

      return {
        ...sub,
        activeManagerCount,
        totalSlots,
        monthlyFee,
        isFull: activeManagerCount >= totalSlots,
        availableSlots: Math.max(0, totalSlots - activeManagerCount)
      };
    } catch {
      return DEFAULT_SUBSCRIPTION;
    }
  }

  saveSubscription(sub) {
    localStorage.setItem(HQ_STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(sub));
    this.notifyChange('SUBSCRIPTION_UPDATED');
  }

  addManagerSlot(count = 1) {
    const sub = this.getSubscription();
    sub.additionalSlots = Math.max(0, (sub.additionalSlots || 0) + count);
    this.saveSubscription(sub);
    return this.getSubscription();
  }

  removeManagerSlot(count = 1) {
    const sub = this.getSubscription();
    sub.additionalSlots = Math.max(0, (sub.additionalSlots || 0) - count);
    this.saveSubscription(sub);
    return this.getSubscription();
  }

  canAddManager() {
    const sub = this.getSubscription();
    return sub.activeManagerCount < sub.totalSlots;
  }

  // CEO PPT 브리핑을 위한 데모 데이터 강제 세팅
  async seedDemoData() {
    console.log('🌱 CEO 데모용 아티스트 데이터를 세팅합니다...');
    this.saveArtists(DEFAULT_ARTISTS);
    
    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        // 기존 아티스트 삭제 (간단히)
        const remoteArtists = await window.SupabaseClient.getArtists();
        for (const a of remoteArtists) {
          if (window.SupabaseClient.deleteArtist) {
            await window.SupabaseClient.deleteArtist(a.id);
          }
        }
        // 데모 아티스트 추가
        for (const art of DEFAULT_ARTISTS) {
          await window.SupabaseClient.createArtist(art);
        }
        console.log('✅ Supabase에 데모 아티스트 세팅 완료!');
      } catch (err) {
        console.error('❌ Supabase 데모 데이터 세팅 실패:', err);
      }
    }
    alert('데모용 아티스트 세팅이 완료되었습니다. 화면을 새로고침 해주세요.');
  }

  // Supabase 비동기 백그라운드 동기화
  async syncFromSupabase() {
    if (typeof window.SupabaseClient === 'undefined' || !window.SupabaseClient.isConfigured) return;
    try {
      const [remoteArtists, remoteManagers, remoteVehicles, remoteSchedules] = await Promise.allSettled([
        window.SupabaseClient.getArtists(),
        window.SupabaseClient.getManagers(),
        window.SupabaseClient.getVehicles(),
        window.SupabaseClient.getSchedules()
      ]);

      if (remoteArtists.status === 'fulfilled' && Array.isArray(remoteArtists.value) && remoteArtists.value.length > 0) {
        localStorage.setItem(HQ_STORAGE_KEYS.ARTISTS, JSON.stringify(remoteArtists.value));
      }
      if (remoteManagers.status === 'fulfilled' && Array.isArray(remoteManagers.value) && remoteManagers.value.length > 0) {
        const mapped = remoteManagers.value.map(m => ({
          id: m.id,
          name: m.name,
          role: m.role || 'manager',
          phone: m.phone || '',
          color: m.color || '#6366f1',
          assignedArtists: (m.artist_managers || []).map(am => am.artist_id)
        }));
        localStorage.setItem(HQ_STORAGE_KEYS.MANAGERS, JSON.stringify(mapped));
      }
      if (remoteVehicles.status === 'fulfilled' && Array.isArray(remoteVehicles.value) && remoteVehicles.value.length > 0) {
        localStorage.setItem(HQ_STORAGE_KEYS.VEHICLES, JSON.stringify(remoteVehicles.value));
      }
      if (remoteSchedules.status === 'fulfilled' && Array.isArray(remoteSchedules.value) && remoteSchedules.value.length > 0) {
        const mappedSch = remoteSchedules.value.map(s => ({
          id: s.id,
          title: s.title,
          category: s.category || 'broadcast',
          artistId: s.artist_id,
          artistName: s.artists?.name || this.getArtistName(s.artist_id),
          managerId: s.manager_id,
          managerName: s.profiles?.name || this.getManagerName(s.manager_id),
          vehicleId: s.vehicle_id,
          vehicleName: s.vehicles?.name || this.getVehicleName(s.vehicle_id),
          date: s.date,
          startTime: s.start_time ? s.start_time.substring(0, 5) : '10:00',
          endTime: s.end_time ? s.end_time.substring(0, 5) : '18:00',
          location: s.location || '',
          shopLocation: s.shop_location || '',
          status: s.status || 'scheduled',
          isSecret: s.is_secret || false,
          secretLevel: s.secret_level || (s.is_secret ? 'confidential' : 'public'),
          notes: s.notes || '',
          timeline: s.timeline_items || [],
          statusLogs: s.status_logs || [],
          outfit: s.outfit || '',
          supplies: s.supplies || '',
          departure: s.departure_info || { place: '숙소 픽업' }
        }));
        localStorage.setItem(HQ_STORAGE_KEYS.SCHEDULES, JSON.stringify(mappedSch));
      }
    } catch (e) {
      console.warn('syncFromSupabase error:', e);
    }
  }

  // ── 아티스트 (항상 동기 배열 반환) ──
  getArtists() {
    try {
      return JSON.parse(localStorage.getItem(HQ_STORAGE_KEYS.ARTISTS)) || DEFAULT_ARTISTS;
    } catch {
      return DEFAULT_ARTISTS;
    }
  }

  getArtistsSync() {
    return this.getArtists();
  }

  saveArtists(artists) {
    localStorage.setItem(HQ_STORAGE_KEYS.ARTISTS, JSON.stringify(artists));
    this.notifyChange('ARTISTS_SAVED');
  }

  async addArtist(artist) {
    const artists = this.getArtists();
    artists.push(artist);
    this.saveArtists(artists);

    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        await window.SupabaseClient.createArtist(artist);
      } catch (e) {
        console.warn('Supabase addArtist error:', e);
      }
    }
    return artist;
  }

  async deleteArtist(id) {
    let artists = this.getArtists();
    artists = artists.filter(a => a.id !== id);
    this.saveArtists(artists);

    if (window.SupabaseClient && window.SupabaseClient.isConfigured && !id.startsWith('art_')) {
      try {
        // Assume SupabaseClient has deleteArtist, or we ignore it if it doesn't.
        if (window.SupabaseClient.deleteArtist) {
          await window.SupabaseClient.deleteArtist(id);
        }
      } catch (e) {
        console.warn('Supabase deleteArtist error:', e);
      }
    }
    return true;
  }

  async updateArtist(id, data) {
    const artists = this.getArtists();
    const idx = artists.findIndex(a => a.id === id);
    if (idx !== -1) {
      artists[idx] = { ...artists[idx], ...data };
      this.saveArtists(artists);

      if (window.SupabaseClient && window.SupabaseClient.isConfigured && !id.startsWith('art_')) {
        try {
          if (window.SupabaseClient.updateArtist) {
            await window.SupabaseClient.updateArtist(id, data);
          }
        } catch (e) {
          console.warn('Supabase updateArtist error:', e);
        }
      }
      return artists[idx];
    }
    return null;
  }

  // ── 매니저 (항상 동기 배열 반환) ──
  getManagers() {
    try {
      return JSON.parse(localStorage.getItem(HQ_STORAGE_KEYS.MANAGERS)) || DEFAULT_MANAGERS;
    } catch {
      return DEFAULT_MANAGERS;
    }
  }

  getManagersSync() {
    return this.getManagers();
  }

  saveManagers(managers) {
    localStorage.setItem(HQ_STORAGE_KEYS.MANAGERS, JSON.stringify(managers));
    this.notifyChange('MANAGERS_SAVED');
  }

  async updateManagerAssignment(managerId, assignedArtistIds) {
    const managers = this.getManagers();
    const target = managers.find(m => m.id === managerId);
    if (target) {
      target.assignedArtists = assignedArtistIds;
      this.saveManagers(managers);
    }

    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        for (const artId of (target?.assignedArtists || [])) {
          await window.SupabaseClient.unassignManagerFromArtist(artId, managerId);
        }
        for (const artId of assignedArtistIds) {
          await window.SupabaseClient.assignManagerToArtist(artId, managerId);
        }
      } catch (e) {
        console.warn('Supabase updateManagerAssignment error:', e);
      }
    }

    this.notifyChange('MANAGER_ASSIGNED');
    return true;
  }

  async addManager(manager) {
    const managers = this.getManagers();
    managers.push(manager);
    this.saveManagers(managers);
    return manager;
  }

  async deleteManager(id) {
    const managers = this.getManagers();
    const newManagers = managers.filter(m => m.id !== id);
    this.saveManagers(newManagers);
    return true;
  }

  // ── 차량 (항상 동기 배열 반환) ──
  getVehicles() {
    try {
      return JSON.parse(localStorage.getItem(HQ_STORAGE_KEYS.VEHICLES)) || DEFAULT_VEHICLES;
    } catch {
      return DEFAULT_VEHICLES;
    }
  }

  getVehiclesSync() {
    return this.getVehicles();
  }

  // ── 스케줄 (항상 동기 배열 반환) ──
  getSchedules(filter = {}) {
    let schedules = [];
    try {
      schedules = JSON.parse(localStorage.getItem(HQ_STORAGE_KEYS.SCHEDULES)) || getInitialMockSchedules();
    } catch {
      schedules = getInitialMockSchedules();
    }

    if (filter.artistId && filter.artistId !== 'ALL') {
      schedules = schedules.filter(s => s.artistId === filter.artistId);
    }
    if (filter.managerId && filter.managerId !== 'ALL') {
      schedules = schedules.filter(s => s.managerId === filter.managerId);
    }
    if (filter.date) {
      schedules = schedules.filter(s => s.date === filter.date);
    }
    return schedules;
  }

  getSchedulesSync(filter = {}) {
    return this.getSchedules(filter);
  }

  saveSchedules(schedules) {
    localStorage.setItem(HQ_STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    this.notifyChange('SCHEDULES_SAVED');
  }

  async saveSchedule(schedule) {
    if (!schedule.id) schedule.id = 'sch_' + Date.now();
    if (!schedule.timeline || schedule.timeline.length === 0) {
      schedule.timeline = this.generateAutoTimeline(schedule);
    }

    const schedules = this.getSchedules();
    const idx = schedules.findIndex(s => s.id === schedule.id);
    if (idx !== -1) {
      schedules[idx] = schedule;
    } else {
      schedules.push(schedule);
    }
    this.saveSchedules(schedules);

    // Supabase 저장
    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        const payload = {
          title: schedule.title,
          category: schedule.category || 'broadcast',
          artist_id: schedule.artistId,
          manager_id: schedule.managerId || null,
          vehicle_id: schedule.vehicleId || null,
          date: schedule.date,
          start_time: schedule.startTime,
          end_time: schedule.endTime,
          location: schedule.location,
          shop_location: schedule.shop?.name ? `${schedule.shop.name} (${schedule.shop.time || ''})` : null,
          status: schedule.status || 'scheduled',
          is_secret: schedule.isSecret || false,
          secret_level: schedule.secretLevel || (schedule.isSecret ? 'confidential' : 'public'),
          notes: schedule.notes || '',
          timeline_items: schedule.timeline || [],
          status_logs: schedule.statusLogs || [],
          departure_info: schedule.departure || {},
          outfit: schedule.outfit || null,
          supplies: schedule.supplies || null
        };
        if (idx !== -1 && !schedule.id.startsWith('sch_')) {
          await window.SupabaseClient.updateSchedule(schedule.id, payload);
        } else {
          const res = await window.SupabaseClient.createSchedule(payload);
          if (res && res.id) schedule.id = res.id;
        }
      } catch (e) {
        console.warn('Supabase saveSchedule error:', e);
      }
    }

    return schedule;
  }

  async updateSchedule(id, updates) {
    let schedules = this.getSchedules();
    const sch = schedules.find(s => s.id === id);
    if (!sch) return;

    Object.assign(sch, updates);
    this.saveSchedules(schedules);

    if (window.SupabaseClient && window.SupabaseClient.isConfigured && !id.startsWith('sch_')) {
      try {
        const payload = {};
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.timeline !== undefined) payload.timeline_items = updates.timeline;
        if (updates.statusLogs !== undefined) payload.status_logs = updates.statusLogs;
        if (updates.isSecret !== undefined) payload.is_secret = updates.isSecret;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        await window.SupabaseClient.updateSchedule(id, payload);
      } catch (e) {
        console.warn('Supabase updateSchedule error:', e);
      }
    }
    this.notifyChange('SCHEDULE_UPDATE');
    return sch;
  }

  // ── 배차/매니저 중복 충돌 감지 (Conflict Detection) ──
  checkConflict(targetSchedule) {
    if (!targetSchedule || !targetSchedule.date || !targetSchedule.startTime || !targetSchedule.endTime) {
      return { hasConflict: false, conflicts: [] };
    }

    const allSchedules = this.getSchedules();
    const targetStart = targetSchedule.startTime.substring(0, 5);
    const targetEnd = targetSchedule.endTime.substring(0, 5);
    const targetId = targetSchedule.id;

    const conflicts = [];

    // 같은 날짜의 다른 스케줄 탐색
    allSchedules.forEach(sch => {
      if (sch.id === targetId || sch.date !== targetSchedule.date) return;
      if (sch.status === '취소' || sch.status === 'cancelled') return;

      const schStart = (sch.startTime || '00:00').substring(0, 5);
      const schEnd = (sch.endTime || '23:59').substring(0, 5);

      // 시간대 겹침 확인 (StartA < EndB && StartB < EndA)
      const isOverlap = (targetStart < schEnd && schStart < targetEnd);

      if (isOverlap) {
        // 1. 차량 중복 배차
        if (targetSchedule.vehicleId && sch.vehicleId && targetSchedule.vehicleId === sch.vehicleId) {
          conflicts.push({
            type: 'vehicle',
            vehicleId: sch.vehicleId,
            vehicleName: sch.vehicleName || '차량',
            conflictScheduleTitle: sch.title,
            conflictArtist: sch.artistName,
            conflictTime: `${schStart} ~ ${schEnd}`
          });
        }

        // 2. 매니저 중복 배차
        if (targetSchedule.managerId && sch.managerId && targetSchedule.managerId === sch.managerId) {
          conflicts.push({
            type: 'manager',
            managerId: sch.managerId,
            managerName: sch.managerName || '매니저',
            conflictScheduleTitle: sch.title,
            conflictArtist: sch.artistName,
            conflictTime: `${schStart} ~ ${schEnd}`
          });
        }
      }
    });

    return {
      hasConflict: conflicts.length > 0,
      conflicts: conflicts
    };
  }

  // ── 타임스탬프 상세 히스토리 로그 기록 ──
  async addStatusLog(scheduleId, logEntry) {
    let schedules = this.getSchedules();
    const sch = schedules.find(s => s.id === scheduleId);
    if (!sch) return;

    if (!Array.isArray(sch.statusLogs)) {
      sch.statusLogs = [];
    }

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newLog = {
      id: 'log_' + Date.now(),
      time: timeStr,
      date: dateStr,
      recordedAt: now.toISOString(),
      label: logEntry.label || '상태 변경',
      status: logEntry.status || sch.status,
      stepIdx: logEntry.stepIdx !== undefined ? logEntry.stepIdx : null,
      managerName: logEntry.managerName || localStorage.getItem('bp_user_name') || '현장 매니저'
    };

    sch.statusLogs.unshift(newLog); // 최신 로그가 앞에 오도록
    this.saveSchedules(schedules);
    this.notifyChange('SCHEDULE_UPDATE');
    return newLog;
  }

  async deleteSchedule(id) {
    let schedules = this.getSchedules();
    schedules = schedules.filter(s => s.id !== id);
    this.saveSchedules(schedules);

    if (window.SupabaseClient && window.SupabaseClient.isConfigured && !id.startsWith('sch_')) {
      try {
        await window.SupabaseClient.deleteSchedule(id);
      } catch (e) {
        console.warn('Supabase deleteSchedule error:', e);
      }
    }
  }

  // 헬퍼
  getArtistName(artistId) {
    const a = this.getArtists().find(x => x.id === artistId);
    return a ? a.name : artistId;
  }
  getManagerName(managerId) {
    const m = this.getManagers().find(x => x.id === managerId);
    return m ? m.name : managerId;
  }
  getVehicleName(vehicleId) {
    const v = this.getVehicles().find(x => x.id === vehicleId);
    return v ? v.name : vehicleId;
  }

  // 매니저용 스마트 동선 타임라인 역산 생성기
  generateAutoTimeline(schedule) {
    const timeline = [];
    const mainStartTime = schedule.startTime || '10:00';
    const [startH, startM] = mainStartTime.split(':').map(Number);
    const startMinutes = (startH || 10) * 60 + (startM || 0);

    if (schedule.shop && schedule.shop.needed) {
      const shopDuration = Number(schedule.shop.durationMin) || 90;
      const travelShopToMain = 35;
      const shopArriveMinutes = startMinutes - travelShopToMain - shopDuration;
      const departMinutes = shopArriveMinutes - 30;

      const fmt = (min) => {
        const positiveMin = ((min % 1440) + 1440) % 1440;
        const h = Math.floor(positiveMin / 60);
        const m = positiveMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      timeline.push({
        time: fmt(departMinutes),
        label: `${schedule.departure?.place || '숙소'} 픽업 및 출발`,
        desc: `담당 매니저: ${schedule.managerName || '배정 매니저'}`,
        done: false
      });
      timeline.push({
        time: fmt(shopArriveMinutes),
        label: `💄 [헤어/메이크업] ${schedule.shop.name || '헤메샵'} 도착 및 스타일링`,
        desc: `소요시간 약 ${shopDuration}분 (${schedule.shop.address || ''})`,
        done: false
      });
      timeline.push({
        time: fmt(startMinutes - travelShopToMain),
        label: `🚗 현장(${schedule.location || '행사장'})으로 이동 출발`,
        desc: '의상 및 마이크/소품 최종 체크',
        done: false
      });
    } else {
      const departMinutes = startMinutes - 45;
      const fmt = (min) => {
        const positiveMin = ((min % 1440) + 1440) % 1440;
        const h = Math.floor(positiveMin / 60);
        const m = positiveMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      timeline.push({
        time: fmt(departMinutes),
        label: `${schedule.departure?.place || '출발지'} 출발 및 이동`,
        desc: `배차: ${schedule.vehicleName || '지정 차량'}`,
        done: false
      });
    }

    timeline.push({
      time: schedule.startTime,
      label: `🎬 [메인 일정] ${schedule.title}`,
      desc: `장소: ${schedule.location || '현장'} / 현장 담당자 미팅 & 대기실 세팅`,
      done: false
    });

    if (schedule.endTime) {
      timeline.push({
        time: schedule.endTime,
        label: `🏁 일정 종료 및 현장 철수 / 복귀 이동`,
        desc: '협찬 의상 수거, 준비물 점검 후 숙소/사옥 복귀',
        done: false
      });
    }

    return timeline;
  }

  notifyChange(type) {
    try {
      this.broadcast.postMessage({ type, timestamp: Date.now() });
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }
}

// Global HQ Store Instance
window.hqStore = new HQDataStore();

/* ===================================================
   🎭 AuthPersona — Role-Based Access Control (RBAC) & Persona Switcher
   =================================================== */
window.AuthPersona = {
  ROLES: {
    ceo: {
      key: 'ceo',
      id: 'mgr_0',
      name: '홍길동 대표이사',
      role: 'ceo',
      email: 'ceo@star-ent.com',
      badge: '👑 대표 (CEO)',
      shortBadge: '👑 CEO',
      color: '#f59e0b',
      assignedArtists: ['art_1', 'art_2', 'art_3', 'art_4', 'art_5'],
      desc: '전사 스케줄 & 비공개 일정, 전사 통계 열람'
    },
    hq_admin: {
      key: 'hq_admin',
      id: 'mgr_1',
      name: '김태현 총괄팀장',
      role: 'hq_admin',
      email: 'admin@star-ent.com',
      badge: '🏢 본사 총괄 (HQ)',
      shortBadge: '🏢 HQ 총괄',
      color: '#6366f1',
      assignedArtists: ['art_1', 'art_2', 'art_3', 'art_4', 'art_5'],
      desc: '전체 스케줄 등록/수정, 배차 관제, 비공개 관리'
    },
    manager: {
      key: 'manager',
      id: 'mgr_2',
      name: '박진우 현장매니저',
      role: 'manager',
      email: 'manager.park@star-ent.com',
      badge: '🚗 현장 매니저',
      shortBadge: '🚗 현장 매니저',
      color: '#ec4899',
      assignedArtists: ['art_1'],
      desc: '루나스 전담 배정, 타임스탬프 갱신, 카톡 브리핑, 내비'
    },
    staff: {
      key: 'staff',
      id: 'mgr_6',
      name: '이수진 수석실장 (헤메)',
      role: 'staff',
      email: 'staff.lee@star-ent.com',
      badge: '🎧 외부 스태프',
      shortBadge: '🎧 외부 스태프',
      color: '#14b8a6',
      assignedArtists: ['art_1', 'art_2'],
      desc: '외부 스태프 전용 클린 뷰 (타임라인/장소/콜타임 중심)'
    }
  },

  getCurrentRole() {
    return localStorage.getItem('bp_user_role') || 'manager';
  },

  getCurrentUser() {
    const roleKey = this.getCurrentRole();
    const persona = this.ROLES[roleKey] || this.ROLES.manager;
    const customName = localStorage.getItem('bp_user_name');
    const customEmail = localStorage.getItem('bp_user_email');
    return {
      ...persona,
      name: customName || persona.name,
      email: customEmail || persona.email
    };
  },

  canViewSecret(schedule) {
    const role = this.getCurrentRole();
    if (role === 'ceo' || role === 'hq_admin') return true;
    const currentMgrId = localStorage.getItem('bp_manager_id');
    if (role === 'manager' && schedule && schedule.managerId === currentMgrId) return true;
    return false;
  },

  login(email, password) {
    const roles = Object.values(this.ROLES);
    let user = null;

    // 1. 로컬 환경에서 임시 가입한 유저 확인
    try {
      const registeredStr = localStorage.getItem('mock_registered_users');
      if (registeredStr) {
        const registeredUsers = JSON.parse(registeredStr);
        const match = registeredUsers.find(u => u.email === email && u.password === password);
        if (match) {
          user = match;
        }
      }
    } catch(e) {}

    // 2. 하드코딩된 기본 테스트 계정 확인 (비밀번호 1234 고정)
    if (!user) {
      user = roles.find(r => r.email === email && password === '1234');
    }

    if (user) {
      localStorage.setItem('bp_user_role', user.role);
      localStorage.setItem('bp_user_name', user.name);
      localStorage.setItem('bp_user_email', user.email);
      localStorage.setItem('bp_company_name', user.company_name || 'STAR');
      localStorage.setItem('bp_manager_id', user.id);
      localStorage.setItem('bp_assigned_artists', JSON.stringify(user.assignedArtists));
      localStorage.setItem('bp_logged_in', 'true');
      localStorage.setItem('bp_manager_filter', 'ALL');
      return { success: true, user };
    }
    return { success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' };
  },

  logout(redirectUrl = 'index.html') {
    localStorage.removeItem('bp_user_role');
    localStorage.removeItem('bp_user_name');
    localStorage.removeItem('bp_user_email');
    localStorage.removeItem('bp_company_name');
    localStorage.removeItem('bp_manager_id');
    localStorage.removeItem('bp_assigned_artists');
    localStorage.removeItem('bp_logged_in');
    localStorage.removeItem('bp_manager_filter');

    window.location.href = redirectUrl;
  }
};
