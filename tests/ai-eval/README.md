# 로디(AI 비서) 시험지

매니저가 실제로 할 법한 말 23개(`cases.json`)로 AI 비서를 채점합니다.
음악방송·라디오·출국·화보 등록, 콜 시각, 샵 경유, 주변 밥집·주차장, 변경·취소, 중복, 넓은 장소(SBS), 지난 날짜, 아티스트 개인정보 거절, 범위 밖 질문.

## 두 가지 방법
1. **직접 Claude 호출** (API 키가 있을 때)
   `ANTHROPIC_API_KEY=sk-... node --experimental-strip-types --no-warnings tests/ai-eval/run.mjs`
   (번호 하나만: 맨 뒤에 `15`)
2. **배포된 서버 함수로** (키가 서버에만 있을 때)
   시험 계정 토큰으로 `roadplanner-ai`에 `{message, context}`를 보내고, 응답들을
   `[{n, status, reply, actions, places}]` 형태로 저장한 뒤
   `node tests/ai-eval/grade-live.mjs 응답.json`

## 기록
- 2026-11-07 1차(배포 v2): 20/23 — 콘서트 리허설을 '녹음·연습'으로 분류, 다시 받을 때 "앞의 답변에서 잘못…" 사과, "3시에 촬영 있어"에 엉뚱한 답
- 2026-11-07 2차(배포 v3, 분류 규칙·다시 받기 문구·거절된 제안 '카드 없음' 표시): **23/23**
- 2026-11-08: 서버가 오늘 날짜를 한국 시간으로 직접 계산하게 바뀜 → `grade-live.mjs`로 채점할 때 cases.json의 날짜(11/10 기준)는 맞지 않음. 실서버 채점은 그날 날짜에 맞춰 문장을 고쳐서 돌릴 것 (run.mjs는 그대로 사용 가능)
