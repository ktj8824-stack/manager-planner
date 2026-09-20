import re

with open('c:/Users/giga/Downloads/influ/매니저플래너/admin.html', 'r', encoding='utf-8', errors='replace') as f:
    text = f.read()

replacements = [
    (r'<title>.*?</title>', '<title>HQ 엔터테인먼트 마스터 스케줄러</title>'),
    (r'<div class="brand-title">.*?</div>', '<div class="brand-title">STAR SCHEDULER</div>'),
    (r'<div class="brand-subtitle">.*?</div>', '<div class="brand-subtitle">ENTERPRISE MANAGEMENT</div>'),
    (r'<div class="menu-label">.*?</div>', '<div class="menu-label">전체 소속 아티스트<br><small>통합 캘린더 모드</small></div>'),
    (r'<div class="user-name">.*?</div>', '<div class="user-name">홍길동 대표이사<br><small>(👑 CEO)</small></div>'),
    (r'<button id="btn-open-settings" class="btn-util">.*?</button>', '<button id="btn-open-settings" class="btn-util">⚙️ 관리자 설정</button>'),
    (r'<button id="btn-open-artist-manage" class="btn-util">.*?</button>', '<button id="btn-open-artist-manage" class="btn-util">🌟 아티스트 관리</button>'),
    (r'<button id="btn-open-noti-modal" class="btn-util">.*?</button>', '<button id="btn-open-noti-modal" class="btn-util">🔔 알림 발송</button>'),
    (r'<button id="btn-open-manager-manage" class="btn-util">.*?</button>', '<button id="btn-open-manager-manage" class="btn-util">👥 매니저 관리</button>'),
    (r'<button id="btn-open-add-schedule" class="btn-primary">.*?</button>', '<button id="btn-open-add-schedule" class="btn-primary">📅 신규 스케줄 등록</button>'),
    (r'<div class="kpi-label">.*?일정.*?</div>', '<div class="kpi-label">오늘 진행중인 일정</div>'),
    (r'<div class="kpi-label">.*?경유.*?</div>', '<div class="kpi-label">헤어/메이크업 경유 일정</div>'),
    (r'<div class="kpi-label">.*?가동.*?</div>', '<div class="kpi-label">현재 가동중인 차량/팀</div>'),
    (r'<button id="btn-view-month" class="view-btn active">.*?</button>', '<button id="btn-view-month" class="view-btn active">월간 캘린더</button>'),
    (r'<button id="btn-view-week" class="view-btn">.*?</button>', '<button id="btn-view-week" class="view-btn">주간 시간표</button>'),
    (r'<button id="btn-view-day" class="view-btn">.*?</button>', '<button id="btn-view-day" class="view-btn">일간 타임라인</button>'),
    (r'<button id="btn-view-timeline" class="view-btn">.*?</button>', '<button id="btn-view-timeline" class="view-btn">아티스트별 현황</button>'),
    (r'<button id="btn-view-kpi" class="view-btn">.*?</button>', '<button id="btn-view-kpi" class="view-btn">종합 통계/분석</button>'),
    (r'<button id="btn-open-add-artist" class="btn-util" style="margin-bottom:15px; width:100%;">.*?</button>', '<button id="btn-open-add-artist" class="btn-util" style="margin-bottom:15px; width:100%;">+ 신규 아티스트 등록</button>'),
    (r'<h3 id="modal-schedule-title">.*?</h3>', '<h3 id="modal-schedule-title">새 스케줄 등록</h3>'),
    (r'<label class="form-label">.*?스케줄명.*?</label>', '<label class="form-label">스케줄명 (행사/프로그램명)</label>'),
    (r'<label class="form-label">.*?아티스트.*?</label>', '<label class="form-label">담당 아티스트</label>'),
    (r'<label class="form-label">.*?분류.*?</label>', '<label class="form-label">스케줄 분류</label>'),
    (r'<label class="form-label">.*?일자.*?</label>', '<label class="form-label">일자</label>'),
    (r'<label class="form-label">.*?진행 시간.*?</label>', '<label class="form-label">진행 시간</label>'),
    (r'<label class="form-label">.*?매니저 배정.*?</label>', '<label class="form-label">담당 매니저 배정</label>'),
    (r'<label class="form-label">.*?메인 행사장.*?</label>', '<label class="form-label">메인 행사장 / 촬영 위치</label>'),
    (r'<button type="submit" form="form-schedule" class="btn-primary">.*?</button>', '<button type="submit" form="form-schedule" class="btn-primary">스케줄 저장</button>'),
    (r'<h3[^>]*>.*?아티스트 추가.*?</h3>', '<h3>소속 아티스트 추가</h3>'),
    (r'<label class="form-label">.*?그룹명.*?</label>', '<label class="form-label">아티스트/그룹명</label>'),
    (r'<label class="form-label">.*?유형.*?</label>', '<label class="form-label">활동 유형</label>'),
    (r'<label class="form-label">.*?인원.*?</label>', '<label class="form-label">인원수</label>'),
    (r'<label class="form-label">.*?대표 컬러.*?</label>', '<label class="form-label">대표 컬러</label>'),
    (r'<label class="form-label">.*?URL.*?</label>', '<label class="form-label">프로필 사진 URL</label>'),
    (r'<button type="submit" form="form-artist-add" class="btn-primary">.*?</button>', '<button type="submit" form="form-artist-add" class="btn-primary">아티스트 등록</button>'),
    (r'<h3>.*?알림 발송.*?</h3>', '<h3>전체 공지 / 알림 발송</h3>'),
    (r'<label>.*?수신자.*?</label>', '<label>수신자</label>'),
    (r'<label>.*?메시지.*?</label>', '<label>알림 메시지</label>'),
    (r'<button type="button" id="btn-send-noti" class="btn-primary">.*?</button>', '<button type="button" id="btn-send-noti" class="btn-primary">발송하기</button>'),
    (r'<h3>.*?설정.*?</h3>', '<h3>관리자 환경 설정</h3>'),
    (r'<label class="form-label">.*?Project URL.*?</label>', '<label class="form-label">Project URL (API URL)</label>'),
    (r'<label class="form-label">.*?API Key.*?</label>', '<label class="form-label">Anon / Public API Key</label>'),
    (r'<button type="button" id="btn-save-settings" class="btn-primary">.*?</button>', '<button type="button" id="btn-save-settings" class="btn-primary">설정 저장</button>'),
]

for pat, repl in replacements:
    text = re.sub(pat, repl, text, flags=re.IGNORECASE|re.DOTALL)

with open('c:/Users/giga/Downloads/influ/매니저플래너/admin.html', 'w', encoding='utf-8') as f:
    f.write(text)
