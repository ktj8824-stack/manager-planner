# 로드플래너 아이폰 앱 (Xcode)

맥 바탕화면의 `RoadPlanner` Xcode 프로젝트에 적용합니다.

## 1. 코드
- `RoadPlannerWeb.swift` 로 기존 앱/웹뷰 코드를 교체 (`@main` 이 두 개면 기존 것을 지움)
- 기능: 웹앱 화면, 출발 15분 전 알림 예약(앱이 꺼져 있어도), 알림 누르면 바로 길안내,
  `roadplanner://next`, 티맵·카카오·전화 열기, 확인/입력 창, 확대 방지

## 2. Info.plist (Xcode > 프로젝트 > Info 탭)
- URL Types 추가: Identifier `com.roadplanner.manager`, URL Schemes `roadplanner`
- `Privacy - Location When In Use Usage Description`:
  `이동 중 도착 예상 시간을 계산하려고 현재 위치를 사용합니다.`
- (선택) `LSApplicationQueriesSchemes`: `tmap`, `kakaomap`, `kakaonavi-sdk`

## 3. 단축어 자동화 링크
- 아이폰 앱으로 바로 열기: `roadplanner://next`
