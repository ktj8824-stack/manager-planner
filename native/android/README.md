# 로드플래너 안드로이드 앱

- 매니저 웹앱을 그대로 보여 주는 앱 (주소: `app/build.gradle` 의 `APP_URL`)
- 티맵·카카오맵·카카오내비·전화 열기, 사진 첨부, 위치(지연 예상), 출발 15분 전 알림(앱이 꺼져 있어도)
- `roadplanner://next` → 다음 일정 길안내 (갤럭시 '모드 및 루틴' > 차량 블루투스 연결 시 실행)

## 설치 파일 만들기
`native/android` 를 고쳐서 GitHub에 올리면 GitHub Actions가 자동으로 만들고
Releases > `android-latest` 에 `RoadPlanner.apk` 를 올립니다.

## 서명
`app/test-signing.keystore` 는 **테스트 설치용** 고정 키입니다 (업데이트 때 덮어 설치 가능).
플레이스토어에 올릴 때는 새 키를 만들어 비밀로 보관하고 이 파일은 쓰지 않습니다.
