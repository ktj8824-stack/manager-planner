# 로드플래너 아이폰 앱 (Xcode)

맥 바탕화면 `RoadPlanner` Xcode 프로젝트 (2026-11-05 적용·설치 완료)
- `RoadPlannerApp.swift` (이 폴더와 같음): 앱 시작, 출발 알림 예약(Reminders), roadplanner://next(Router), 알림 누르면 길안내
- `WebView.swift` (맥 프로젝트에 있음): 웹 화면 + `window.webkit.messageHandlers.roadplanner` 연결, 당겨서 새로고침, 오프라인 화면
- Info.plist: URL Types `roadplanner` 추가됨, 위치·카메라·사진 권한 문구는 빌드 설정에 있음
- 바꾸기 전 원본: 바탕화면 `RoadPlanner_backup_1105`

도메인을 바꾸면 `RoadPlannerApp.swift` 의 `APP_URL` 한 줄만 바꾸고 Xcode ▶ 실행.
무료 Apple ID 설치는 7일마다 다시 ▶ 실행 필요.
