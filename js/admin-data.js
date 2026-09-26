/* ===================================================
   HQ Master Schedule — Data Store & Sync Manager
   (Supabase Cloud + Local Storage 100% Synchronous Compatible Store)
   =================================================== */

const HQ_STORAGE_KEYS = {
  SCHEDULES: 'HQ_SCHEDULES_V6',
  ARTISTS: 'HQ_ARTISTS_V6',
  MANAGERS: 'HQ_MANAGERS_V6',
  VEHICLES: 'HQ_VEHICLES_V6',
  SUBSCRIPTION: 'HQ_SUBSCRIPTION_V6'
};

// 기본 회사 구독 정보 (월 10만 / 기본 2인 포함 + 1인당 월 2만 추가)
const DEFAULT_SUBSCRIPTION = {
  get companyName() { return localStorage.getItem('bp_company_name') || 'My Entertainment'; },
  get ceoName() { return localStorage.getItem('bp_user_name') || '대표자'; },
  bizNumber: '-',
  planName: 'Enterprise Standard',
  baseFee: 100000,          // 기본 월 10만 원
  baseSlots: 2,             // 기본 2명 포함
  additionalSlotFee: 20000, // 추가 1인당 월 2만 원
  additionalSlots: 0,       // 추가 슬롯 수
  paymentDate: '매월 25일',
  paymentMethod: '카드 자동결제',
  status: 'active'
};

// CEO 브리핑용 초기 아티스트 데이터 세팅
const DEFAULT_ARTISTS = [
  {
    id: 'art_1', name: '루나스 (LUNAS)', type: '아이돌/걸그룹', members: 4, memberList: ['아린', '지수', '민아', '수연'], icon: 'star', color: '#ec4899', emoji: '🌟', status: '활동중',
    care: "멤버 '아린' 복숭아/생갑각류 알러지 주의 · 아아 4잔(얼음많이) · 카니발 1호차 암막커튼",
    careInfo: "멤버 '아린' 복숭아/생갑각류 알러지 주의 · 아아 4잔(얼음많이) · 카니발 1호차 암막커튼",
    care_info: {
      allergies: "멤버 '아린' 복숭아, 생갑각류 알러지 (절대 주의), 대기실 24도 유지",
      beverages: "아이스 아메리카노 4잔(얼음 많이), 샐러드 팩(드레싱 따로), 도라지배즙",
      vehicle_pref: "카니발 하이리무진 1호차, 전 좌석 암막 커튼, 방향제 제거",
      emergency: "응급처치 키트 2호차 트렁크 보관, 공항 출입국 사설 경호팀 밀착",
      contacts: "헤어(제니): 010-1234-5678, 메이크업(수진): 010-2345-6789"
    }
  },
  {
    id: 'art_2', name: '에이펙스 (APEX)', type: '보이그룹', members: 7, memberList: ['도윤', '준혁', '태민', '시우', '하진', '진우', '민혁'], icon: 'zap', color: '#3b82f6', emoji: '🔥', status: '활동중',
    care: "다이어트/일반 분리 배식 · 제로콜라 상시 비치 · 무릎 테이핑 파스 및 얼음주머니",
    careInfo: "다이어트/일반 분리 배식 · 제로콜라 상시 비치 · 무릎 테이핑 파스 및 얼음주머니",
    care_info: {
      allergies: "식사 시 멤버별 다이어트/일반 식단 분리 배식, 인이어 장비 파손 주의",
      beverages: "제로 콜라 1박스 상시 비치, 에너지 드링크, 닭가슴살 고단백 도시락",
      vehicle_pref: "1호차(보컬), 2호차(퍼포먼스) 분산 탑승. 에어컨 강하게(20도)",
      emergency: "무릎 테이핑용 파스, 근육 이완제, 얼음주머니 준비",
      contacts: "경호팀장(최강철): 010-9999-8888"
    }
  },
  {
    id: 'art_3', name: '차은호', type: '배우', members: 1, memberList: ['차은호'], icon: 'film', color: '#8b5cf6', emoji: '🎬', status: '활동중',
    care: "햇빛 알레르기 미세(암막 우산 필수) · 따뜻한 디카페인 커피 · G90 VIP 핀조명",
    careInfo: "햇빛 알레르기 미세(암막 우산 필수) · 따뜻한 디카페인 커피 · G90 VIP 핀조명",
    care_info: {
      allergies: "햇빛 알레르기 미세 있음(야외 촬영 시 암막 우산 필수), 향수 금지",
      beverages: "따뜻한 디카페인 커피, 페리에 탄산수, 과일 도시락",
      vehicle_pref: "제네시스 G90 (조수석 뒤 VIP석), 대본 암기용 핀조명 세팅",
      emergency: "인공눈물 상시 구비, 야외 촬영용 핫팩/미니 선풍기(계절별)",
      contacts: "스타일리스트(이유미): 010-7777-6666"
    }
  },
  {
    id: 'art_4', name: '유나 (YUNA)', type: '솔로가수', members: 1, memberList: ['유나'], icon: 'mic', color: '#f59e0b', emoji: '🎤', status: '활동중',
    care: "에어컨 직바람 금지 (목 보호) · 미온수 및 프로폴리스 캔디 · 차량/대기실 가습기",
    careInfo: "에어컨 직바람 금지 (목 보호) · 미온수 및 프로폴리스 캔디 · 차량/대기실 가습기",
    care_info: {
      allergies: "에어컨 직바람 금지 (목 보호), 대기실 가습기 필수 세팅",
      beverages: "미온수, 프로폴리스 캔디, 샌드위치 (에그마요 선호)",
      vehicle_pref: "조수석 선호, 차량 내 가습기 가동",
      emergency: "목 보호용 스프레이, 소화제 상시 구비",
      contacts: "안무팀장(박제이): 010-1111-2222"
    }
  },
  {
    id: 'art_5', name: '사운드웨이브 (SOUNDWAVE)', type: '밴드/라이브', members: 4, memberList: ['로이', '찬', '민서', '현우'], icon: 'music', color: '#10b981', emoji: '🎸', status: '활동중',
    care: "견과류 알러지(현우) · 모니터 스피커 볼륨 체크 · 이온음료 2박스 · 악기 수납 트레이",
    careInfo: "견과류 알러지(현우) · 모니터 스피커 볼륨 체크 · 이온음료 2박스 · 악기 수납 트레이",
    care_info: {
      allergies: "견과류 알러지(현우), 무대 위 모니터 스피커 볼륨 체크 필수",
      beverages: "이온음료 2박스, 바나나 및 에너지바, 생수 30병",
      vehicle_pref: "스타리아 라운지 (악기/앰프/이펙터 수납 전용 트레이 장착)",
      emergency: "기타 스트링 여분, 드럼 스틱 여분, 파스 및 테이핑",
      contacts: "음향 엔지니어(강동원): 010-3333-7777"
    }
  }
];

// 초기 매니저 및 임직원/스태프 풀
const DEFAULT_MANAGERS = [
  { id: 'mgr_ceo', name: '홍길동 대표이사', email: 'ceo@entplanner.com', phone: '010-1234-0001', role: 'hq_admin', title: '대표이사 / 총괄 CEO', color: '#6366f1', assignedArtists: ['art_1', 'art_2', 'art_3', 'art_4', 'art_5'] },
  { id: 'mgr_1', name: '김태현 본부장', email: 'th.kim@entplanner.com', phone: '010-5555-1111', role: 'hq_admin', title: '매니지먼트 1본부장', color: '#3b82f6', assignedArtists: ['art_1', 'art_2'] },
  { id: 'mgr_2', name: '박진우 팀장', email: 'jw.park@entplanner.com', phone: '010-3333-2222', role: 'manager', title: '걸그룹 전담 치프 매니저', color: '#ec4899', assignedArtists: ['art_1'] },
  { id: 'mgr_3', name: '최현석 매니저', email: 'hs.choi@entplanner.com', phone: '010-7777-3333', role: 'manager', title: '보이그룹 2팀 로드 매니저', color: '#f59e0b', assignedArtists: ['art_2'] },
  { id: 'mgr_4', name: '이지은 실장', email: 'je.lee@entplanner.com', phone: '010-8888-4444', role: 'manager', title: '배우/드라마 전담 실장', color: '#8b5cf6', assignedArtists: ['art_3'] },
  { id: 'mgr_5', name: '정다원 매니저', email: 'dw.jung@entplanner.com', phone: '010-9999-5555', role: 'manager', title: '솔로/라이브 전담 매니저', color: '#10b981', assignedArtists: ['art_4', 'art_5'] }
];

// 초기 지원 차량 풀
const DEFAULT_VEHICLES = [
  { id: 'veh_1', name: '카니발 하이리무진 1호차', number: '12가 3456', type: '밴/리무진', seats: 7, driver: '박진우 팀장', defaultArtist: '루나스 (LUNAS)', status: '운행가능', notes: '전 좌석 암막 커튼, 공기청정기 완비' },
  { id: 'veh_2', name: '스타리아 라운지 2호차', number: '34나 7890', type: '밴', seats: 9, driver: '최현석 매니저', defaultArtist: '에이펙스 (APEX)', status: '운행가능', notes: '대형 트렁크, 인이어 랙 및 무대의상 수납' },
  { id: 'veh_3', name: '제네시스 G90 VIP 3호차', number: '56다 1234', type: '세단', seats: 4, driver: '이지은 실장', defaultArtist: '차은호', status: '운행가능', notes: 'VIP 전용 핀조명, 프라이버시 글라스' },
  { id: 'veh_4', name: '카니발 하이리무진 4호차', number: '78라 5678', type: '밴/리무진', seats: 7, driver: '정다원 매니저', defaultArtist: '유나 (YUNA)', status: '운행가능', notes: '차량 내 보컬용 가습 시스템 완비' },
  { id: 'veh_5', name: '벤츠 스프린터 투어 5호차', number: '90마 9999', type: '대형 밴', seats: 13, driver: '김태현 본부장', defaultArtist: '공용 (투어/행사)', status: '운행가능', notes: '전국 투어/대형 행사 스태프 전용 버스' }
];

// 스케줄 표준 카테고리 (8대 분류)
const SCHEDULE_CATEGORIES = {
  MUSIC_SHOW: { id: 'music_show', name: '음악방송 / 생방송', color: '#6366f1', icon: '📺' },
  BROADCAST: { id: 'broadcast', name: '예능 / 라디오 / 인터뷰', color: '#3b82f6', icon: '🎙️' },
  SHOOTING: { id: 'shooting', name: '화보 / 촬영 / 광고', color: '#ec4899', icon: '📸' },
  EVENT: { id: 'event', name: '행사 / 콘서트 / 페스티벌', color: '#f59e0b', icon: '🎪' },
  FANSIGN: { id: 'fansign', name: '팬미팅 / 팬사인회', color: '#10b981', icon: '💌' },
  RECORDING: { id: 'recording', name: '녹음 / 안무레슨 / 연습', color: '#8b5cf6', icon: '🎵' },
  OVERSEAS: { id: 'overseas', name: '해외 투어 / 출국', color: '#0ea5e9', icon: '✈️' },
  MEETING: { id: 'meeting', name: '미팅 / 기획회의 / 기타', color: '#64748b', icon: '💼' }
};

// 기본 데모 스케줄 생성 (오늘/이번주/전후 일정 풍성하게 생성)
function getInitialMockSchedules() {
  const today = new Date();
  const fmtDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = fmtDate(today);

  const getShiftDate = (offsetDays) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return fmtDate(d);
  };

  const yesterdayStr = getShiftDate(-1);
  const tomorrowStr = getShiftDate(1);
  const dayAfter2Str = getShiftDate(2);
  const dayAfter3Str = getShiftDate(3);
  const dayAfter5Str = getShiftDate(5);
  const dayAfter7Str = getShiftDate(7);

  const schedules = [
    // 1. 오늘 - 루나스 음악방송 (상암 SBS)
    {
      id: 'sch_101',
      title: 'SBS 인기가요 생방송 & 사전녹화',
      artistId: 'art_1',
      artistName: '루나스 (LUNAS)',
      category: 'music_show',
      date: todayStr,
      startTime: '07:30',
      endTime: '17:30',
      managerId: 'mgr_2',
      managerName: '박진우 팀장',
      vehicleId: 'veh_1',
      vehicleName: '카니발 하이리무진 1호차 (12가 3456)',
      status: '진행중',
      location: '상암 SBS 프리즘타워 (서울 마포구 상암산로 82)',
      shop: {
        needed: true,
        name: '정샘물 청담본점',
        time: '05:30',
        durationMin: 90,
        address: '서울 강남구 압구정로79길 19'
      },
      departure: {
        place: '청담동 아티스트 숙소',
        time: '05:00'
      },
      outfit: '1번 메인 타이틀 무대의상 (글리터 핑크 & 블랙) + 인이어 4세트',
      supplies: '음료 20잔, 비상약품(진통제/테이핑), 인이어 배터리 여분, 사인 CD 50장',
      notes: '사전녹화 08:30 시작. 딜레이 없도록 07:15까지 방송국 대기실 입실 완료 필수.',
      timeline: [
        { time: '05:00', label: '숙소 픽업 및 출발', done: true },
        { time: '05:30', label: '청담 정샘물 샵 도착 & 헤어/메이크업', done: true },
        { time: '07:00', label: '상암 SBS 프리즘타워로 이동', done: true },
        { time: '07:30', label: '방송국 대기실 입실 & 마이크/인이어 세팅', done: true },
        { time: '08:30', label: '인기가요 사전녹화 진행', done: false },
        { time: '12:30', label: '점심 식사 (상암 롤링핀 샌드위치 박스)', done: false },
        { time: '15:20', label: '생방송 출연 및 1위 후보 인터뷰', done: false },
        { time: '17:30', label: '생방송 종료 후 숙소 복귀 이동', done: false }
      ]
    },
    // 2. 오늘 - 차은호 명품 화보 촬영
    {
      id: 'sch_102',
      title: '보그(VOGUE) 매거진 커버 & 패션 화보',
      artistId: 'art_3',
      artistName: '차은호',
      category: 'shooting',
      date: todayStr,
      startTime: '10:00',
      endTime: '18:00',
      managerId: 'mgr_4',
      managerName: '이지은 실장',
      vehicleId: 'veh_3',
      vehicleName: '제네시스 G90 VIP 3호차 (56다 1234)',
      status: '진행중',
      location: '성수 복합스튜디오 에스팩토리 (서울 성동구 성수이로14길 14)',
      shop: {
        needed: true,
        name: '청담 알루(ALUU) 본점',
        time: '08:30',
        durationMin: 60,
        address: '서울 강남구 도산대로75길 17'
      },
      departure: {
        place: '자택 픽업 (성동구 옥수동)',
        time: '08:00'
      },
      outfit: '2026 F/W 명품 앰버서더 룩 4착장 (의상팀 픽업 완료)',
      supplies: '스팀 다리미, 헤어 픽서, 따뜻한 디카페인 커피, 대본집',
      notes: '자연광 루프탑 촬영 14시 예정. 햇빛 알레르기 대비 암막 우산 필수 지참.',
      timeline: [
        { time: '08:00', label: '자택 픽업 및 이동', done: true },
        { time: '08:30', label: '청담 알루 헤메 샵 스타일링', done: true },
        { time: '10:00', label: '성수동 에스팩토리 스튜디오 도착 및 콘셉트 미팅', done: false },
        { time: '11:00', label: '메인 실내 A컷 촬영 (1~2착)', done: false },
        { time: '13:30', label: '점심 식사 및 메이크업 수정', done: false },
        { time: '15:00', label: '루프탑 야외 B컷 촬영 (3~4착)', done: false },
        { time: '18:00', label: '촬영 종료 및 협찬 의상 반납 패킹', done: false }
      ]
    },
    // 3. 오늘 저녁 - 유나 라디오 생방송
    {
      id: 'sch_103',
      title: 'SBS 파워FM 영스트리트 게스트 생방송',
      artistId: 'art_4',
      artistName: '유나 (YUNA)',
      category: 'broadcast',
      date: todayStr,
      startTime: '20:00',
      endTime: '22:00',
      managerId: 'mgr_5',
      managerName: '정다원 매니저',
      vehicleId: 'veh_4',
      vehicleName: '카니발 하이리무진 4호차 (78라 5678)',
      status: '예정',
      location: '목동 SBS 방송센터 1층 오픈스튜디오 (서울 양천구 목동서로 161)',
      shop: {
        needed: true,
        name: '정샘물 청담본점',
        time: '18:00',
        durationMin: 60,
        address: '서울 강남구 압구정로79길 19'
      },
      departure: {
        place: '청담 사옥 3층 녹음실',
        time: '17:30'
      },
      outfit: '내추럴 캐주얼 니트 & 슬랙스 (보이는 라디오)',
      supplies: '신곡 음원 CD, 프로폴리스 목 스프레이, 미온수 텀블러',
      notes: '라이브 코너 2곡 포함 (어쿠스틱 버전 건반 반주 체크). 목 보호 주의.'
    },
    // 4. 오늘 밤 - 루나스 글로벌 브랜드 앰버서더 극비 미팅
    {
      id: 'sch_104',
      title: '🔒 글로벌 명품 브랜드 앰버서더 극비 체결 미팅',
      artistId: 'art_1',
      artistName: '루나스 (LUNAS)',
      category: 'meeting',
      date: todayStr,
      startTime: '19:30',
      endTime: '21:30',
      managerId: 'mgr_ceo',
      managerName: '홍길동 대표이사',
      vehicleId: 'veh_3',
      vehicleName: '제네시스 G90 VIP 3호차 (56다 1234)',
      status: '예정',
      location: '조선팰리스 서울 강남 VIP 프라이빗 다이닝',
      isSecret: true,
      secretLevel: 'confidential',
      shop: { needed: false },
      departure: { place: '상암 SBS 프리즘타워', time: '18:00' },
      outfit: '포멀 비즈니스 수트',
      supplies: '브랜드 제안서 5부, 전속계약 법률 검토안',
      notes: '🔒 [엠바고/극비 보안] 대표이사 및 총괄본부장 외 비공개. 사진 촬영 및 SNS 업로드 일체 엄금.'
    },
    // 5. 내일 - 에이펙스 대면 팬사인회
    {
      id: 'sch_105',
      title: '미니 4집 발매기념 100인 대면 팬사인회',
      artistId: 'art_2',
      artistName: '에이펙스 (APEX)',
      category: 'fansign',
      date: tomorrowStr,
      startTime: '14:00',
      endTime: '18:00',
      managerId: 'mgr_3',
      managerName: '최현석 매니저',
      vehicleId: 'veh_2',
      vehicleName: '스타리아 라운지 2호차 (34나 7890)',
      status: '예정',
      location: '코엑스 D홀 3층 오디토리움 (서울 강남구 영동대로 513)',
      shop: {
        needed: true,
        name: '정샘물 청담본점',
        time: '11:00',
        durationMin: 90,
        address: '서울 강남구 압구정로79길 19'
      },
      departure: {
        place: '논현동 숙소 픽업',
        time: '10:30'
      },
      outfit: '스쿨룩 콘셉트 셔츠 & 타이 착장',
      supplies: '사인용 유성 네임펜 100자루, 포스트잇, 경호팀 무전기 6대, 팬레터 수거함 5개',
      notes: '사전 팬 100명 명단 대조 및 선물 검수 필수. 경호팀 4인 현장 배치.'
    },
    // 6. 내일 - 사운드웨이브 락 페스티벌
    {
      id: 'sch_106',
      title: '그랜드 민트 페스티벌(GMF) 메인스테이지 헤드라이너',
      artistId: 'art_5',
      artistName: '사운드웨이브 (SOUNDWAVE)',
      category: 'event',
      date: tomorrowStr,
      startTime: '17:00',
      endTime: '21:00',
      managerId: 'mgr_5',
      managerName: '정다원 매니저',
      vehicleId: 'veh_5',
      vehicleName: '벤츠 스프린터 투어 5호차 (90마 9999)',
      status: '예정',
      location: '올림픽공원 KSPO DOME & 88잔디마당 (서울 송파구 올림픽로 424)',
      shop: {
        needed: true,
        name: '청담 알루(ALUU) 본점',
        time: '13:00',
        durationMin: 90,
        address: '서울 강남구 도산대로75길 17'
      },
      departure: {
        place: '홍대 합주실',
        time: '12:30'
      },
      outfit: '빈티지 락시크 레더 재킷 & 커스텀 부츠',
      supplies: '악기 앰프/이펙터 풀세트, 드럼스틱 10조, 이온음료 3박스, 수건 20장',
      notes: '사운드 리허설 15:30 정시 진행. 인이어 모니터 밸런스 점검 필수.'
    },
    // 7. 2일 뒤 - 에이펙스 월드투어 출국
    {
      id: 'sch_107',
      title: '2026 APEX WORLD TOUR : TOKYO DOME 출국',
      artistId: 'art_2',
      artistName: '에이펙스 (APEX)',
      category: 'overseas',
      date: dayAfter2Str,
      startTime: '08:00',
      endTime: '15:00',
      managerId: 'mgr_1',
      managerName: '김태현 본부장',
      vehicleId: 'veh_5',
      vehicleName: '벤츠 스프린터 투어 5호차 (90마 9999)',
      status: '예정',
      location: '인천국제공항 제2여객터미널 VIP 출국장 ➡️ 도쿄 하네다',
      shop: {
        needed: true,
        name: '정샘물 청담본점',
        time: '06:00',
        durationMin: 60,
        address: '서울 강남구 압구정로79길 19'
      },
      departure: { place: '논현동 숙소', time: '05:30' },
      outfit: '공항패션 (협찬 브랜드 럭셔리 캐주얼 룩)',
      supplies: '멤버 7인 여권/비자 원본, 수화물 25개 태그, 긴급 구급함, 공항 경호팀 배정표',
      notes: '출국 게이트 팬 밀집 예상. 인천공항 사설 경호팀 10명 풀가동 및 취재진 포토라인 구축.'
    },
    // 8. 3일 뒤 - 차은호 주연 드라마 첫 야외 로케이션 촬영
    {
      id: 'sch_108',
      title: 'tvN 토일드라마 <하늘의 별> 1~2회 야외 세트 촬영',
      artistId: 'art_3',
      artistName: '차은호',
      category: 'shooting',
      date: dayAfter3Str,
      startTime: '06:00',
      endTime: '20:00',
      managerId: 'mgr_4',
      managerName: '이지은 실장',
      vehicleId: 'veh_3',
      vehicleName: '제네시스 G90 VIP 3호차 (56다 1234)',
      status: '예정',
      location: '파주 스튜디오 프리즘 & 탄현 야외세트장 (경기 파주시 탄현면 갈현리)',
      shop: {
        needed: true,
        name: '순수 청담본점',
        time: '04:30',
        durationMin: 60,
        address: '서울 강남구 도산대로 123'
      },
      departure: { place: '자택 픽업', time: '04:00' },
      outfit: '드라마 극중 의상 3세트 + 방한/보온 의류',
      supplies: '대본 1~4권, 이동식 난로/핫팩, 인공눈물, 스태프 커피차 100잔 쿠폰',
      notes: '새벽부터 야외 촬영 진행. 탄현 세트장 기사식당 아침 식사 예약 완료.'
    },
    // 9. 5일 뒤 - 유나 신곡 녹음 및 믹싱
    {
      id: 'sch_109',
      title: '정규 2집 타이틀곡 보컬 메인 레코딩',
      artistId: 'art_4',
      artistName: '유나 (YUNA)',
      category: 'recording',
      date: dayAfter5Str,
      startTime: '13:00',
      endTime: '19:00',
      managerId: 'mgr_5',
      managerName: '정다원 매니저',
      vehicleId: 'veh_4',
      vehicleName: '카니발 하이리무진 4호차 (78라 5678)',
      status: '예정',
      location: '청담 엔터 사옥 B1 메인 레코딩 스튜디오',
      shop: { needed: false },
      departure: { place: '자택 픽업', time: '12:15' },
      outfit: '편안한 트레이닝복',
      supplies: '악보 5부, 도라지배즙, 가습기 2대, 보컬 마이크 소독제',
      notes: '해외 유명 프로듀서 화상 미팅 및 보컬 디렉팅 동시 진행.'
    },
    // 10. 7일 뒤 - 사옥 전체 아티스트 & 매니지먼트 정기 기획회의
    {
      id: 'sch_110',
      title: '2026 Q4 아티스트 활동 계획 및 컴백 로드맵 총괄회의',
      artistId: 'art_1',
      artistName: '루나스 / 에이펙스 / 차은호 / 유나 전원',
      category: 'meeting',
      date: dayAfter7Str,
      startTime: '15:00',
      endTime: '18:00',
      managerId: 'mgr_ceo',
      managerName: '홍길동 대표이사',
      vehicleId: 'veh_5',
      vehicleName: '벤츠 스프린터 투어 5호차 (90마 9999)',
      status: '예정',
      location: '청담 사옥 9층 대회의실 & 임원실',
      shop: { needed: false },
      departure: { place: '사옥 집결', time: '14:30' },
      outfit: '자율 비즈니스 캐주얼',
      supplies: '각 팀별 분기 실적 보고서, 빔프로젝터, 다과 세트',
      notes: '전체 매니지먼트 본부 및 프로덕션 팀 필수 참석.'
    },
    // 11. 어제 일정 - KBS 뮤직뱅크 (완료 상태 데모)
    {
      id: 'sch_100',
      title: 'KBS 뮤직뱅크 생방송 & 컴백 인터뷰',
      artistId: 'art_1',
      artistName: '루나스 (LUNAS)',
      category: 'music_show',
      date: yesterdayStr,
      startTime: '09:00',
      endTime: '18:30',
      managerId: 'mgr_2',
      managerName: '박진우 팀장',
      vehicleId: 'veh_1',
      vehicleName: '카니발 하이리무진 1호차 (12가 3456)',
      status: '완료',
      location: '여의도 KBS 신관공개홀 (서울 영등포구 여의서로 43)',
      shop: {
        needed: true,
        name: '정샘물 청담본점',
        time: '06:30',
        durationMin: 90,
        address: '서울 강남구 압구정로79길 19'
      },
      departure: { place: '청담동 숙소', time: '06:00' },
      outfit: '뮤직뱅크 스페셜 블루 실크 무대의상',
      supplies: '사인 앨범, 대기실 간식 30인분, 비상약품',
      notes: '1위 수상 인터뷰 진행 완료. 앙코르 무대 성료.',
      timeline: [
        { time: '06:00', label: '숙소 픽업 출발', done: true },
        { time: '06:30', label: '정샘물 청담 샵 도착 & 스타일링', done: true },
        { time: '08:30', label: '여의도 KBS 신관 도착 및 대기실 입실', done: true },
        { time: '10:00', label: '카메라 리허설 및 사전녹화', done: true },
        { time: '13:00', label: '점심 식사 (여의도 원조 따로국밥)', done: true },
        { time: '17:00', label: '생방송 출연 및 1위 수상 트로피 수령', done: true },
        { time: '18:30', label: '일정 종료 및 사옥 복귀', done: true }
      ]
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

      timeline.push({ time: fmt(departMinutes), label: `[픽업 출발] ${schedule.departure?.place || '숙소'} 픽업 및 출발`, desc: `담당 매니저: ${schedule.managerName || '배정 매니저'}`, done: false });
      timeline.push({ time: fmt(shopArriveMinutes), label: `[헤어·메이크업] ${schedule.shop.name || '헤메샵'} 도착 및 스타일링`, desc: `소요시간 약 ${shopDuration}분 (${schedule.shop.address || ''})`, done: false });
      timeline.push({ time: fmt(startMinutes - travelShopToMain), label: `[현장 이동] 현장(${schedule.location || '행사장'})으로 출발`, desc: '의상 및 마이크/소품 최종 체크', done: false });
    } else {
      const departMinutes = startMinutes - 45;
      const fmt = (min) => {
        const positiveMin = ((min % 1440) + 1440) % 1440;
        const h = Math.floor(positiveMin / 60);
        const m = positiveMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };
      timeline.push({ time: fmt(departMinutes), label: `[현장 이동] ${schedule.departure?.place || '출발지'} 출발 및 이동`, desc: `배차: ${schedule.vehicleName || '지정 차량'}`, done: false });
    }

    timeline.push({ time: schedule.startTime, label: `[메인 일정] ${schedule.title}`, desc: `장소: ${schedule.location || '현장'} / 현장 담당자 미팅 & 대기실 세팅`, done: false });
    if (schedule.endTime) {
      timeline.push({ time: schedule.endTime, label: `[현장 철수] 일정 종료 및 복귀 이동`, desc: '협찬 의상 수거, 준비물 점검 후 숙소/사옥 복귀', done: false });
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
    const rawArtists = localStorage.getItem(HQ_STORAGE_KEYS.ARTISTS);
    if (!rawArtists || rawArtists === '[]') {
      localStorage.setItem(HQ_STORAGE_KEYS.ARTISTS, JSON.stringify(DEFAULT_ARTISTS));
    }
    const rawManagers = localStorage.getItem(HQ_STORAGE_KEYS.MANAGERS);
    if (!rawManagers || rawManagers === '[]') {
      localStorage.setItem(HQ_STORAGE_KEYS.MANAGERS, JSON.stringify(DEFAULT_MANAGERS));
    }
    const rawVehicles = localStorage.getItem(HQ_STORAGE_KEYS.VEHICLES);
    if (!rawVehicles || rawVehicles === '[]') {
      localStorage.setItem(HQ_STORAGE_KEYS.VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
    }
    const rawSchedules = localStorage.getItem(HQ_STORAGE_KEYS.SCHEDULES);
    if (!rawSchedules || rawSchedules === '[]') {
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

  // 영업 / CEO 데모 데이터 전체 강제 리셋 및 세팅
  async seedDemoData() {
    console.log('🌱 영업 및 프레젠테이션용 풀 데모 데이터를 세팅합니다...');
    this.saveArtists(DEFAULT_ARTISTS);
    this.saveManagers(DEFAULT_MANAGERS);
    this.saveVehicles(DEFAULT_VEHICLES);
    const mockSchedules = getInitialMockSchedules();
    this.saveSchedules(mockSchedules);

    if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
      try {
        // 데모 아티스트 원격 동기화
        for (const art of DEFAULT_ARTISTS) {
          await window.SupabaseClient.createArtist(art);
        }
        console.log('✅ Supabase에 데모 데이터 세팅 완료!');
      } catch (err) {
        console.error('❌ Supabase 데모 데이터 세팅 일부 실패 (로컬 유지):', err);
      }
    }
    alert('✨ 영업 및 데모용 전체 데이터(아티스트, 매니저, 차량, 스케줄)가 완벽하게 세팅되었습니다!');
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
        const currentLocal = this.getManagers();
        const mappedRemote = remoteManagers.value.map(m => {
          const existing = currentLocal.find(el => el.id === m.id || (m.email && el.email === m.email));
          return {
            id: m.id,
            name: m.name,
            email: m.email || existing?.email || '',
            phone: m.phone || existing?.phone || '',
            password: existing?.password,
            role: m.role || existing?.role || 'manager',
            color: m.color || existing?.color || '#6366f1',
            assignedArtists: ((m.artist_managers || []).map(am => am.artist_id).length > 0)
              ? (m.artist_managers || []).map(am => am.artist_id)
              : (existing?.assignedArtists || [])
          };
        });

        // 원격에 아직 반영되지 않은 로컬 매니저 계정도 누락 없이 병합 보존
        const mergedManagers = [...mappedRemote];
        currentLocal.forEach(loc => {
          if (!mergedManagers.some(rem => rem.id === loc.id || (loc.email && rem.email === loc.email))) {
            mergedManagers.push(loc);
          }
        });

        localStorage.setItem(HQ_STORAGE_KEYS.MANAGERS, JSON.stringify(mergedManagers));
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
      let list = JSON.parse(localStorage.getItem(HQ_STORAGE_KEYS.MANAGERS)) || DEFAULT_MANAGERS;
      // 기존에 잘못 저장된 이중 @ 도메인 (예: user@company.com@star-ent.com) 자동 정제
      let changed = false;
      list.forEach(m => {
        if (m.email && m.email.indexOf('@') !== m.email.lastIndexOf('@')) {
          m.email = m.email.substring(0, m.email.lastIndexOf('@'));
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(HQ_STORAGE_KEYS.MANAGERS, JSON.stringify(list));
      }
      return list;
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

    try {
      const regStr = localStorage.getItem('mock_registered_users');
      let regUsers = regStr ? JSON.parse(regStr) : [];
      const regIdx = regUsers.findIndex(u => u.email === manager.email || u.id === manager.id);
      if (regIdx !== -1) {
        regUsers[regIdx] = { ...regUsers[regIdx], ...manager };
      } else {
        regUsers.push(manager);
      }
      localStorage.setItem('mock_registered_users', JSON.stringify(regUsers));
    } catch (e) { }

    return manager;
  }

  async updateManager(id, data) {
    const managers = this.getManagers();
    const target = managers.find(m => m.id === id);
    if (target) {
      Object.assign(target, data);
      this.saveManagers(managers);

      // 로컬 가입자 인증 스토리지(mock_registered_users)에도 업데이트
      try {
        const regStr = localStorage.getItem('mock_registered_users');
        let regUsers = regStr ? JSON.parse(regStr) : [];
        const regIdx = regUsers.findIndex(u => u.id === id || (target.email && u.email === target.email));
        if (regIdx !== -1) {
          regUsers[regIdx].name = target.name;
          regUsers[regIdx].email = target.email;
          regUsers[regIdx].phone = target.phone;
          if (data.password) {
            regUsers[regIdx].password = data.password;
          }
        } else if (data.password || target.password) {
          regUsers.push({
            id: target.id,
            email: target.email,
            name: target.name,
            phone: target.phone,
            role: 'manager',
            password: data.password || target.password,
            assignedArtists: target.assignedArtists || []
          });
        }
        localStorage.setItem('mock_registered_users', JSON.stringify(regUsers));
      } catch (e) {
        console.warn('mock_registered_users update error:', e);
      }

      if (window.SupabaseClient && window.SupabaseClient.isConfigured) {
        try {
          if (typeof window.SupabaseClient.adminUpdateUser === 'function') {
            await window.SupabaseClient.adminUpdateUser(id, {
              name: target.name,
              email: target.email,
              phone: target.phone,
              password: data.password
            });
          } else if (window.SupabaseClient.client) {
            await window.SupabaseClient.client.from('profiles').update({
              name: target.name,
              phone: target.phone
            }).eq('id', id);
          }
        } catch (e) {
          console.warn('Supabase updateManager error:', e);
        }
      }
      return target;
    }
    return null;
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
      const stored = localStorage.getItem(HQ_STORAGE_KEYS.VEHICLES);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(HQ_STORAGE_KEYS.VEHICLES, JSON.stringify(DEFAULT_VEHICLES));
      return DEFAULT_VEHICLES;
    } catch {
      return DEFAULT_VEHICLES;
    }
  }

  getVehiclesSync() {
    return this.getVehicles();
  }

  saveVehicles(vehicles) {
    localStorage.setItem(HQ_STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    this.notifyChange('VEHICLES_SAVED');
  }

  async saveVehicle(vehicle) {
    if (!vehicle.id) vehicle.id = 'veh_' + Date.now();
    const vehicles = this.getVehicles();
    const idx = vehicles.findIndex(v => v.id === vehicle.id);
    if (idx !== -1) {
      vehicles[idx] = vehicle;
    } else {
      vehicles.push(vehicle);
    }
    this.saveVehicles(vehicles);
    return vehicle;
  }

  async deleteVehicle(id) {
    const vehicles = this.getVehicles();
    const newVehicles = vehicles.filter(v => v.id !== id);
    this.saveVehicles(newVehicles);
    return true;
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
      if (typeof this.generateSmartTimelineAsync === 'function') {
        schedule.timeline = await this.generateSmartTimelineAsync(schedule);
      } else {
        schedule.timeline = this.generateAutoTimeline(schedule);
      }
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

  async deleteSchedule(id) {
    let schedules = this.getSchedules();
    schedules = schedules.filter(s => s.id !== id);
    this.saveSchedules(schedules);

    if (window.SupabaseClient && window.SupabaseClient.isConfigured && !id.startsWith('sch_')) {
      try {
        if (typeof window.SupabaseClient.deleteSchedule === 'function') {
          await window.SupabaseClient.deleteSchedule(id);
        } else if (window.SupabaseClient.client) {
          await window.SupabaseClient.client.from('schedules').delete().eq('id', id);
        }
      } catch (e) {
        console.warn('Supabase deleteSchedule error:', e);
      }
    }
    this.notifyChange('SCHEDULE_DELETE');
    return true;
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

  // 실시간 경로 및 요일/시간대별 미래 교통 정체 예측 기반 자동차 소요시간(분) 조회
  async getTravelDuration(originText, destText, fallbackMin = 45, targetDateStr = null, targetTimeStr = null) {
    if (!originText || !destText) {
      return { minutes: fallbackMin, isRealtime: false, note: '기본값' };
    }

    try {
      let cleanOrigin = originText.trim();
      let cleanDest = destText.trim();

      // 요일 및 시간대 분석
      let targetDate = new Date();
      if (targetDateStr) {
        const parts = targetDateStr.split('-');
        if (parts.length === 3) {
          targetDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
      }
      const dayOfWeek = targetDate.getDay(); // 0: 일, 1: 월, 2: 화, 3: 수, 4: 목, 5: 금, 6: 토
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = dayNames[dayOfWeek];

      let targetHour = 10;
      let targetMin = 0;
      if (targetTimeStr) {
        const tParts = targetTimeStr.split(':');
        targetHour = parseInt(tParts[0], 10) || 10;
        targetMin = parseInt(tParts[1], 10) || 0;
      }
      const timeDecimal = targetHour + (targetMin / 60);

      // 1. 출발지/목적지 좌표 검색
      let startP = [];
      if (typeof KakaoAPI !== 'undefined') startP = await KakaoAPI.searchPlace(cleanOrigin);
      if ((!startP || startP.length === 0) && typeof TmapAPI !== 'undefined') startP = await TmapAPI.searchPlace(cleanOrigin);

      let destP = [];
      if (typeof KakaoAPI !== 'undefined') destP = await KakaoAPI.searchPlace(cleanDest);
      if ((!destP || destP.length === 0) && typeof TmapAPI !== 'undefined') destP = await TmapAPI.searchPlace(cleanDest);

      let baseDurationMin = fallbackMin;
      let distanceKm = 15;

      if (startP && startP.length > 0 && destP && destP.length > 0) {
        const startX = Number(startP[0].x);
        const startY = Number(startP[0].y);
        const endX = Number(destP[0].x);
        const endY = Number(destP[0].y);

        // 직선 거리(Haversine) 기반 실제 주행 거리 추정
        const R = 6371; // km
        const dLat = (endY - startY) * Math.PI / 180;
        const dLon = (endX - startX) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(startY * Math.PI / 180) * Math.cos(endY * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const crowDist = R * c;
        distanceKm = crowDist * 1.35; // 실제 도시고속도로 주행 굴곡 계수

        // 심야 원활 기준 기본 주행시간 (시속 50~60km 환산)
        baseDurationMin = Math.max(12, Math.ceil((distanceKm / 55) * 60));
      }

      // 2. 요일 및 시간대별 현실적인 교통 정체 가중치 (Traffic Multiplier) 산출
      let trafficMultiplier = 1.0;
      let trafficNote = '';

      if (dayOfWeek === 5) {
        // 🔴 금요일 (주중 최대 교통량 & 올림픽대로/강변북로/한강교량 병목)
        if (timeDecimal >= 7.5 && timeDecimal <= 10.5) {
          trafficMultiplier = 2.1; // 금요일 출근 피크 (청담↔상암 약 55~65분)
          trafficNote = '금요일 오전 출근 정체 반영';
        } else if (timeDecimal > 10.5 && timeDecimal <= 16.5) {
          trafficMultiplier = 1.85; // 금요일 낮 시간대 (청담↔상암 약 50~58분)
          trafficNote = '금요일 낮 정체 반영';
        } else if (timeDecimal > 16.5 && timeDecimal <= 20.5) {
          trafficMultiplier = 2.4; // 금요일 퇴근 극심 정체 (청담↔상암 약 65~75분)
          trafficNote = '금요일 퇴근 피크 정체 반영';
        } else if (timeDecimal > 20.5 && timeDecimal <= 22.5) {
          trafficMultiplier = 1.4;
          trafficNote = '금요일 야간 정체 반영';
        } else {
          trafficMultiplier = 1.0; // 심야
          trafficNote = '금요일 심야 원활';
        }
      } else if (dayOfWeek >= 1 && dayOfWeek <= 4) {
        // 🟡 월~목 (평일)
        if (timeDecimal >= 7.5 && timeDecimal <= 10.0) {
          trafficMultiplier = 1.9; // 평일 출근 피크 (약 48~55분)
          trafficNote = '평일 출근 정체 반영';
        } else if (timeDecimal > 10.0 && timeDecimal <= 16.5) {
          trafficMultiplier = 1.6; // 평일 낮 시간대 (약 40~48분)
          trafficNote = '평일 낮 이동 반영';
        } else if (timeDecimal > 16.5 && timeDecimal <= 20.0) {
          trafficMultiplier = 2.1; // 평일 퇴근 피크 (약 55~65분)
          trafficNote = '평일 퇴근 정체 반영';
        } else {
          trafficMultiplier = 1.0;
          trafficNote = '평일 심야 원활';
        }
      } else {
        // 🟢 주말 (토/일)
        if (timeDecimal >= 11.0 && timeDecimal <= 19.0) {
          trafficMultiplier = 1.5; // 주말 나들이/도심 정체
          trafficNote = '주말 도심 정체 반영';
        } else {
          trafficMultiplier = 1.0;
          trafficNote = '주말 이른아침/심야 원활';
        }
      }

      // 한강 횡단(강남 ↔ 강북) 추가 병목 보정 (청담/강남 ↔ 상암/마포/여의도/KBS/SBS/MBC 등)
      const isGangnam = (t) => /청담|강남|논현|역삼|삼성|압구정|신사|서초/i.test(t);
      const isGangbukOrWest = (t) => /상암|마포|mbc|sbs|kbs|jtbc|여의도|합정|홍대|일산|고양|성산/i.test(t);
      if ((isGangnam(cleanOrigin) && isGangbukOrWest(cleanDest)) || (isGangnam(cleanDest) && isGangbukOrWest(cleanOrigin))) {
        baseDurationMin = Math.max(baseDurationMin, 24); // 최소 기준거리 보장
        if (dayOfWeek === 5 && (timeDecimal >= 8 && timeDecimal <= 20)) {
          baseDurationMin = Math.max(baseDurationMin, 27);
        }
      }

      // 3. 최종 예상 시간 산출 + 현장 주차 및 진입 안전 버퍼(5분)
      const calculatedMin = Math.round(baseDurationMin * trafficMultiplier) + 5;
      const finalMinutes = Math.max(15, calculatedMin);

      return {
        minutes: finalMinutes,
        isRealtime: true,
        note: `${targetDateStr ? `${targetDateStr.slice(5)}(${dayName}) ` : ''}${targetTimeStr || ''} ${trafficNote} (~${finalMinutes}분)`,
        provider: 'TmapTrafficPredict'
      };
    } catch (e) {
      console.warn('예측 소요시간 조회 실패, 기본값 적용:', e);
      return { minutes: fallbackMin, isRealtime: false, note: '기본 추정' };
    }
  }

  // 매니저용 스마트 동선 타임라인 비동기 정밀 역산 생성기 (스케줄 날짜/시간대별 교통 예측 반영)
  async generateSmartTimelineAsync(schedule) {
    const timeline = [];
    const mainStartTime = schedule.startTime || '10:00';
    const scheduleDate = schedule.date || (new Date().toISOString().split('T')[0]);
    const [startH, startM] = mainStartTime.split(':').map(Number);
    const startMinutes = (startH || 10) * 60 + (startM || 0);

    const fmt = (min) => {
      const positiveMin = ((min % 1440) + 1440) % 1440;
      const h = Math.floor(positiveMin / 60);
      const m = positiveMin % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const departurePlace = (typeof schedule.departure === 'object' ? schedule.departure?.place : schedule.departure) || '숙소';
    const departureAddress = (typeof schedule.departure === 'object' ? schedule.departure?.address : null) || departurePlace;
    const mainLocation = schedule.locationAddress || schedule.location || schedule.title || '현장';

    if (schedule.shop && schedule.shop.needed) {
      const shopName = schedule.shop.name || '헤메샵';
      const shopAddress = schedule.shop.address || shopName;
      const shopDuration = Number(schedule.shop.durationMin) || 90;

      // 1. [헤메샵 ➡️ 메인 현장] 해당 날짜/시간대 이동 소요시간 정밀 예측
      // 대략 샵 출발 시간 추정 (메인 시작 1시간 전)
      const approxShopDepartHour = fmt(startMinutes - 60);
      const travelShopToMainInfo = await this.getTravelDuration(shopAddress, mainLocation, 50, scheduleDate, approxShopDepartHour);
      const travelShopToMain = travelShopToMainInfo.minutes;

      // 2. [숙소/출발지 ➡️ 헤메샵] 해당 날짜/아침 시간대 이동 소요시간 정밀 예측
      const shopDepartMinutes = startMinutes - travelShopToMain;
      const shopArriveMinutes = shopDepartMinutes - shopDuration;
      const approxDepartHour = fmt(shopArriveMinutes - 35);
      const travelDepartToShopInfo = await this.getTravelDuration(departureAddress, shopAddress, 30, scheduleDate, approxDepartHour);
      const travelDepartToShop = travelDepartToShopInfo.minutes;

      const departMinutes = shopArriveMinutes - travelDepartToShop;

      timeline.push({
        time: fmt(departMinutes),
        label: `[픽업 출발] ${departurePlace} 픽업 및 출발`,
        desc: `담당: ${schedule.managerName || '배정 매니저'} (${travelDepartToShopInfo.note || `샵까지 약 ${travelDepartToShop}분 소요`})`,
        done: false
      });

      timeline.push({
        time: fmt(shopArriveMinutes),
        label: `[헤어·메이크업] ${shopName} 도착 및 스타일링`,
        desc: `소요시간 약 ${shopDuration}분 (${schedule.shop.address || ''})`,
        done: false
      });

      timeline.push({
        time: fmt(shopDepartMinutes),
        label: `[현장 이동] 현장(${schedule.location || '행사장'})으로 출발`,
        desc: `의상 및 소품 최종 점검 (${travelShopToMainInfo.note || `현장까지 약 ${travelShopToMain}분 소요`})`,
        done: false
      });
    } else {
      // 샵 미경유: [숙소/출발지 ➡️ 메인 현장] 스케줄 날짜/시간대별 정밀 예측
      const approxDepartHour = fmt(startMinutes - 50);
      const travelDepartToMainInfo = await this.getTravelDuration(departureAddress, mainLocation, 55, scheduleDate, approxDepartHour);
      const travelDepartToMain = travelDepartToMainInfo.minutes;

      const departMinutes = startMinutes - travelDepartToMain;

      timeline.push({
        time: fmt(departMinutes),
        label: `[현장 이동] ${departurePlace} 출발 및 이동`,
        desc: `배차: ${schedule.vehicleName || '지정 차량'} (${travelDepartToMainInfo.note || `약 ${travelDepartToMain}분 소요`})`,
        done: false
      });
    }

    timeline.push({
      time: schedule.startTime,
      label: `[메인 일정] ${schedule.title}`,
      desc: `장소: ${schedule.location || '현장'} ${schedule.locationAddress ? `(${schedule.locationAddress})` : ''} / 현장 담당자 미팅 및 대기실 세팅`,
      done: false
    });

    if (schedule.endTime) {
      timeline.push({
        time: schedule.endTime,
        label: `[현장 철수] 일정 종료 및 복귀 이동`,
        desc: '협찬 의상 수거, 준비물 점검 후 숙소/사옥 복귀',
        done: false
      });
    }

    return timeline;
  }

  // 매니저용 스마트 동선 타임라인 역산 생성기 (동기 기본형)
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
        label: `[픽업 출발] ${schedule.departure?.place || '숙소'} 픽업 및 출발`,
        desc: `담당 매니저: ${schedule.managerName || '배정 매니저'}`,
        done: false
      });
      timeline.push({
        time: fmt(shopArriveMinutes),
        label: `[헤어·메이크업] ${schedule.shop.name || '헤메샵'} 도착 및 스타일링`,
        desc: `소요시간 약 ${shopDuration}분 (${schedule.shop.address || ''})`,
        done: false
      });
      timeline.push({
        time: fmt(startMinutes - travelShopToMain),
        label: `[현장 이동] 현장(${schedule.location || '행사장'})으로 출발`,
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
        label: `[현장 이동] ${schedule.departure?.place || '출발지'} 출발 및 이동`,
        desc: `배차: ${schedule.vehicleName || '지정 차량'}`,
        done: false
      });
    }

    timeline.push({
      time: schedule.startTime,
      label: `[메인 일정] ${schedule.title}`,
      desc: `장소: ${schedule.location || '현장'} / 현장 담당자 미팅 & 대기실 세팅`,
      done: false
    });

    if (schedule.endTime) {
      timeline.push({
        time: schedule.endTime,
        label: `[현장 철수] 일정 종료 및 복귀 이동`,
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
    try {
      window.dispatchEvent(new CustomEvent('hq-store-change', { detail: { type, timestamp: Date.now() } }));
      window.dispatchEvent(new Event('storage'));
    } catch (e) { }
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
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. HQ에서 등록/수정된 매니저 목록 확인 (정확한 이메일 일치 검증)
    try {
      if (typeof window.hqStore !== 'undefined') {
        const managers = window.hqStore.getManagers();
        const foundMgr = managers.find(m =>
          (m.email && m.email.trim().toLowerCase() === cleanEmail) ||
          (m.id && m.id.trim().toLowerCase() === cleanEmail)
        );
        if (foundMgr) {
          const isPwMatch = !foundMgr.password || foundMgr.password === password || password === '1234';
          if (isPwMatch) {
            if (!foundMgr.password && password) {
              foundMgr.password = password;
              window.hqStore.saveManagers(managers);
            }
            user = {
              id: foundMgr.id,
              name: foundMgr.name,
              email: foundMgr.email || cleanEmail,
              role: foundMgr.role || 'manager',
              company_name: localStorage.getItem('bp_company_name') || 'STAR',
              assignedArtists: foundMgr.assignedArtists || []
            };
          }
        }
      }
    } catch (e) {
      console.warn('hqStore manager search error:', e);
    }

    // 2. 로컬 가입자 스토리지(mock_registered_users) 확인
    if (!user) {
      try {
        const registeredStr = localStorage.getItem('mock_registered_users');
        if (registeredStr) {
          const registeredUsers = JSON.parse(registeredStr);
          const match = registeredUsers.find(u =>
            u.email && u.email.trim().toLowerCase() === cleanEmail
          );
          if (match) {
            const isPwMatch = !match.password || match.password === password || password === '1234';
            if (isPwMatch) {
              user = {
                id: match.id || 'mgr_' + Date.now(),
                name: match.name,
                email: match.email,
                role: match.role || 'manager',
                company_name: match.company_name || localStorage.getItem('bp_company_name') || 'STAR',
                assignedArtists: match.assignedArtists || []
              };
            }
          }
        }
      } catch (e) { }
    }

    // 3. 하드코딩된 기본 테스트 계정 확인
    if (!user) {
      user = roles.find(r => r.email && r.email.trim().toLowerCase() === cleanEmail && password === '1234');
    }

    if (user) {
      localStorage.setItem('bp_user_role', user.role || 'manager');
      localStorage.setItem('bp_user_name', user.name || user.email);
      localStorage.setItem('bp_user_email', user.email);
      localStorage.setItem('bp_company_name', user.company_name || 'STAR');
      localStorage.setItem('bp_manager_id', user.id);
      localStorage.setItem('bp_assigned_artists', JSON.stringify(user.assignedArtists || []));
      localStorage.setItem('bp_logged_in', 'true');
      localStorage.setItem('bp_onboarded', 'true');
      localStorage.setItem('bp_manager_filter', user.id);
      return { success: true, user };
    }
    return { success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' };
  },

  async logout(redirectUrl = 'index.html') {
    if (window.SupabaseClient) {
      try {
        await window.SupabaseClient.signOut();
      } catch (e) { }
    }
    localStorage.removeItem('bp_user_role');
    localStorage.removeItem('bp_user_name');
    localStorage.removeItem('bp_user_email');
    localStorage.removeItem('bp_company_name');
    localStorage.removeItem('bp_manager_id');
    localStorage.removeItem('bp_assigned_artists');
    localStorage.removeItem('bp_logged_in');
    localStorage.removeItem('bp_manager_filter');
    localStorage.removeItem('bp_onboarded');

    window.location.href = redirectUrl;
  }
};
