# 로드플래너 아이폰 앱 (Xcode)

맥 바탕화면 `RoadPlanner` Xcode 프로젝트 (2026-11-05 적용·설치 완료)
- `RoadPlannerApp.swift` (이 폴더와 같음): 앱 시작, 출발 알림 예약(Reminders), roadplanner://next(Router), 알림 누르면 길안내
- `WebView.swift` (맥 프로젝트에 있음): 웹 화면 + `window.webkit.messageHandlers.roadplanner` 연결, 당겨서 새로고침, 오프라인 화면
- Info.plist: URL Types `roadplanner` 추가됨, 위치·카메라·사진 권한 문구는 빌드 설정에 있음
- 바꾸기 전 원본: 바탕화면 `RoadPlanner_backup_1105`

도메인을 바꾸면 `RoadPlannerApp.swift` 의 `APP_URL` 한 줄만 바꾸고 Xcode ▶ 실행.
무료 Apple ID 설치는 7일마다 다시 ▶ 실행 필요.

## 2026-11-16
- 맥 프로젝트의 `APP_URL` 을 `https://app.roadplanner.kr/` 로 바꿈 (그전엔 옛 github.io 주소였음). 원본은 맥 `RoadPlanner/_백업_20261116`
- 맥 프로젝트 전체(WebView.swift, Info.plist, project.pbxproj)를 이 폴더에도 보관
- 스토어 제출 전 남은 것: 유료 Apple 개발자 계정(연 $99)으로 Team 바꾸기, Apple 로그인(4.8) 결정, 심사용 계정
