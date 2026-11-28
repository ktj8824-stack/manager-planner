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

## 2026-11-28 App Store 준비
- 이 폴더에 새로 추가: `PrivacyInfo.xcprivacy`(개인정보 매니페스트), `Assets.xcassets`(AppIcon 1024 한 장 · LaunchBackground `#14123D` · AccentColor). 맥 프로젝트의 `RoadPlanner/RoadPlanner/` 폴더(swift 파일들 옆)에 그대로 복사
- `RoadPlanner.entitlements`: 시간 민감 알림(time-sensitive) 권한 추가 — 출발 알림이 `.timeSensitive` 를 씀
- `WebView.swift`: Safari 디버깅(isInspectable)은 Debug 빌드에서만
- 웹(앱 화면) 쪽: 아이폰 앱 안에서는 결제·요금·업그레이드 버튼/가격과 Google 로그인이 숨겨지고 "요금제는 회사 관리자에게 문의해 주세요"만 보임 (안드로이드 앱·웹은 그대로)

### 출시 전 확인 (맥에서)
1. **Team**: Xcode → Signing & Capabilities 에서 유료 개발자 계정 Team 으로 바꾸기 (Bundle ID `kr.roadplanner.app`)
2. **Capabilities**: Sign in with Apple, Time Sensitive Notifications 가 켜져 있는지 확인 (entitlements 와 같게)
3. **파일 넣기**: `PrivacyInfo.xcprivacy`, `Assets.xcassets` 를 프로젝트에 복사 → Target Membership(RoadPlanner) 체크, Build Phases → Copy Bundle Resources 에 둘 다 있는지 확인. AppIcon 이 보이는지 확인
4. **Supabase Apple 로그인**: Authentication → Providers → Apple 켜기, Client IDs 에 `kr.roadplanner.app` 넣기 (네이티브 Apple 로그인용)
5. **App Store Connect**: 앱 만들기, 개인정보 라벨을 `PrivacyInfo.xcprivacy` 와 같게 입력 (위치·이름·이메일·전화·사용자 ID·일정/메시지·사진·음성, 추적 없음), 개인정보처리방침 주소 `https://app.roadplanner.kr/privacy.html`, 계정 삭제 주소 `delete-account.html`
6. **Archive → TestFlight**: Product → Archive → Distribute App → App Store Connect 업로드 → TestFlight 에서 실제 아이폰으로 확인 (결제·Google 버튼이 안 보이는지, Apple 로그인·출발 알림)
7. **심사 메모(Review Notes)**: 심사용 데모 계정(이메일·비밀번호), "연예 매니저용 업무(일정·동선) 앱이며 앱 안에는 결제·구매 기능이 없음", 위치·마이크·카메라를 어디에 쓰는지 한 줄씩
