# 도메인 전환 체크리스트 (로드플래너)

추천 구성 (도메인 예: `roadplanner.kr`)
- 매니저 앱: `app.roadplanner.kr` → GitHub 저장소 `manager-planner-app`
- 본사 관리자: `hq.roadplanner.kr` → GitHub 저장소 `manager-planner-web`
- (나중에) `roadplanner.kr` / `www` → 소개 페이지

## 1. 대표님: 도메인 구입 + DNS
1. 가비아·후이즈·Cloudflare 등에서 도메인 구입
2. DNS 관리에서 레코드 2개 추가
   - `app` CNAME → `ktj8824-stack.github.io`
   - `hq`  CNAME → `ktj8824-stack.github.io`

## 2. Claude: 코드 (한 번에 배포)
- [ ] `deploy/app/CNAME` = `app.roadplanner.kr`, `deploy/web/CNAME` = `hq.roadplanner.kr`
- [ ] `js/site-config.js` 의 `APP`, `HQ` 두 줄
- [ ] 알림 주소: `update public.app_settings` (app_url, hq_url) — 서버 표만 고치면 됨
      `insert into public.app_settings(key,value) values ('app_url','https://app.roadplanner.kr/'),('hq_url','https://hq.roadplanner.kr/') on conflict (key) do update set value = excluded.value;`
- [ ] 경로 함수(manager-planner-route) 기본 허용 주소에 새 도메인 추가 후 재배포
- [ ] 패키징(`tools/package_split.cjs`) → 3개 저장소 push

## 3. 대표님: 대시보드 설정 (화면 안내 받으며)
- [ ] GitHub 두 저장소 Settings > Pages > Custom domain 입력 → "Enforce HTTPS" 체크
- [ ] Supabase(메인) > Edge Functions > Secrets: `MANAGE_USERS_ALLOWED_ORIGINS` 에 `https://app.roadplanner.kr,https://hq.roadplanner.kr` 추가 (기존 github.io 도 당분간 유지)
- [ ] Supabase(메인) > Authentication > URL Configuration: Site URL / Redirect URLs 에 새 주소 추가
- [ ] 카카오 개발자 콘솔 > 앱 > 플랫폼 > Web 사이트 도메인에 두 주소 추가 (카카오내비 바로 실행용 JS 키)

## 4. 전환 뒤 확인
- [ ] 새 주소에서 로그인 다시 하기 (주소가 바뀌면 브라우저 저장 정보가 따로라 한 번 다시 로그인)
- [ ] 알림 다시 켜기 (내 정보 > 알림 받기 / 본사 로드톡 알림 켜기)
- [ ] 아이폰·안드로이드 앱이 여는 주소 변경 (앱 설정 한 줄) 후 재설치
- [ ] 자동 길안내 단축어 링크를 새 주소로 바꾸기
- [ ] 공유 링크·장소 검색·길안내·로드톡 사진 확인
