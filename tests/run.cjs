#!/usr/bin/env node
/*
 * 로드플래너 자동 점검 — 한 번에 실행
 *   node tests/run.cjs            전체
 *   node tests/run.cjs sync ack   이름에 해당 글자가 들어간 것만
 *
 * - 화면 테스트(tests/web): 내장 브라우저(Playwright)로 실제 화면 코드를 실행 (서버는 가짜로 대신함)
 * - 서버 테스트(tests/server): 서버 함수 로직(예약 알림·경로 함수)을 가짜 DB로 실행
 * - 마지막에 패키징 검사(비밀키·문법·링크)
 * 127.0.0.1 주소 = 개발 모드(예시 자료 허용), 0.0.0.0 주소 = 운영과 같은 모드
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };

const TESTS = [
  // [이름, 파일, 실행 인자, 반드시 나와야 하는 결과들]
  ['매니저 앱 화면·XSS', 'web/app-xss-test.cjs', ['$DEMO', 'src'], [/page errors: 0/]],
  ['본사 화면·XSS', 'web/admin-xss-test.cjs', ['$DEMO', 'src'], [/"xss":0/, /"pageErrors":0/]],
  ['로그인 (매니저)', 'web/login-test.cjs', [], [/"role":"manager","screen":"screen-home"/]],
  ['서버 기준 동기화 (sync)', 'web/sot-test.cjs', [], [/"addFailThrew": true/, /"afterFail": "art_kjm_1"/, /"remoteDelete": 0/, /"eventsWhenUnchanged": \[\]/, /"backup": "거절될 일정,옛 자료"/]],
  ['확인했습니다 (ack)', 'web/ack-test.cjs', [], [/"before":1/, /"after":0/]],
  ['자동 길안내 (?go=next)', 'web/autonav-test.cjs', [], [/navs \["서울 강남구 압구정로79길 19"\]/, /profileRow true/]],
  ['출발 15분 전 화면 알림', 'web/dep-alert-test.cjs', [], [/13분 뒤 출발/, /"fireAt"/]],
  ['이동 중 지연 예상', 'web/delay-test.cjs', [], [/지연 예상 약 15분/, /"log": "\[지연 예상\]/]],
  ['길안내 좌표 (이름+주소)', 'web/nav-fix-test.cjs', [], [/tmap:\/\/route\?goalname=/, /kakaomap:\/\/route\?ep=/, /goalname=%EA%B0%95%EB%82%A8%EC%95%84%EB%A5%B4%EB%88%84%EB%B3%B4%EC%94%A8%ED%8B%B0&goalx=127.0281&goaly=37.4934/]],
  ['그날 교통 예측 동선', 'web/tm-test.cjs', [], [/도착 기준 교통 예측/, /현재 교통 기준/]],
  ['완료 단계 접기', 'web/fold-test.cjs', [], [/완료된 단계 2개/]],
  ['현장 메모', 'web/venue-test.cjs', [], [/현장 메모 2/, /지하 2층 B구역 주차/]],
  ['예약 알림 (출발·밤 요약·본사 알림 끄기)', 'server/rem-test.mts', [], [/13분 뒤 출발/, /매니저 확인 대기 1건/, /개인유료일정/, /개인무료일정/, /prefOff hq: 0 mgr: [1-9]/]],
  ['아침 재계산·출발 지연', 'server/rem2-test.mts', [], [/retimed: 1/, /late: 1/, /출발 지연 7분/]],
  ['결제 서버 확인·알림 안내 (화면)', 'web/billing-test.cjs', [], [/"amount":120000/, /"tampered":"blocked"/, /"ok":"success"/, /"shown":true,"afterOn":true,"nativeHidden":true/]],
  ['결제 서버 로직 (금액 조작·권한)', 'server/pay-test.mts', [], [/"mgrBlocked":"FORBIDDEN"/, /"tamper":"AMOUNT_MISMATCH"/, /"otherUser":"ORDER_NOT_FOUND"/, /"slots":2/, /"rejected":"REJECT_CARD_COMPANY"/, /"companyMgrPro":"FORBIDDEN"/, /"indieAmount":20000/, /"indieRowCompany":null/, /"indieStatus":true/, /"indieStd":"FORBIDDEN"/]],
  ['자정 넘는 일정 (전날 픽업·순서)', 'web/midnight-test.cjs', [], [/"depart0030":"23:35"/, /"inferred":"-1,-1,0,0,0"/, /"order":"21:55 22:20 00:20 01:00 03:00"/, /"badge":3/]],
  ['자정 넘는 일정 (서버 알림 날짜)', 'server/midnight-rem-test.mts', [], [/"offs":\[-1,-1,0,0,0\]/, /"late":\[0,1\]/]],
  ['앱 스케줄 등록 (출발지·매니저·연타·겹침·결제 주소)', 'web/register-test.cjs', [], [/"mgrDefault":"me-uuid"/, /"shopDefault":""/, /"autoEnd":"12:30"/, /"savedCount":1/, /"departure":"출발지 미정"/, /"shop":false/, /겹치는 일정/, /"company":"100%엔터","qmarks":1,"phone":""/]],
  ['기상·준비는 하루 한 번', 'web/wake-multi-test.cjs', [], [/"wakeCount":1/, /"firstTitle":"\[기상/]],
  ['날짜별 버튼·지난 일정 회색 (미래 잠금·지난 날 완료만)', 'web/dayguard-test.cjs', [], [/"F":\{"move":0,"wait":true,"now":true,"pastBanner":false,"gray":0,"staleDone":false\}/, /"P":\{"move":0,"wait":false,"now":false,"pastBanner":true,"gray":2/, /"T":\{"move":1,"wait":false,"now":true,"pastBanner":false,"gray":0/, /그날이 아니에요/, /완료\]만/]],
  ['로드톡 공지|대화 화면 → 대화방 열기·나가기 (아래 메뉴·닫기)', 'web/chat-exit-test.cjs', ['$DEMO'], [/"talkScreen":"공지대화","rooms":2/, /"backClose":true\} errs \[\]/, /"open":true,"navVisible":true,"chatAboveNav":true,"noSideScroll":true,"closeBtn":"[^"]*","closedByHome":true,"toggleClose":true,"direct":".*?all.*?","backToTalk":true/]],
  ['위 막대 이름·회사 줄 (겹침 없음) · 로그아웃은 내 정보에서', 'web/header-user-test.cjs', ['$DEMO'], [/"i14":\{"name":"박진우 팀장님 · KJM 엔터테인먼트 · 본사 연결됨","noLogoutInHeader":true,"fits":true,"noHScroll":true\}/, /"loggedOut":true/, /"se":\{"name":"박진우 팀장님 · KJM 엔터테인먼트 · 본사 연결됨","noLogoutInHeader":true,"fits":true,"noHScroll":true\}/, /errs \[\]/]],
  ['본사 창이 떠 있을 때 뒤 화면 안 움직임', 'web/modal-scroll-test.cjs', ['$DEMO'], [/"open":true,"bgStill":true,"modalScrolls":true,"unlockedAfterClose":true\} errs \[\]/]],
  ['등록 창 장소 검색 (행사장·출발지)', 'web/place-suggest-test.cjs', ['$DEMO'], [/"listShown":true,"filled":"SBS프리즘타워\|서울 마포구 상암산로 82","closed":true,"dep":"SBS프리즘타워 \(서울 마포구 상암산로 82\)","empty":true,"calls":true,"enterSearch":true,"enterPick":true,"enterOther":true\} errs \[\]/]],
  ['차량관리 (개인: 아래 메뉴 · 차량 등록 무료 · 경비 기록 유료 · 회사는 정비 항목 숨김)', 'web/vehicle-test.cjs', ['$DEMO'], [/"navOrder":"home,artists,ai,vehicle,profile","free":\{"screen":"vehicle","active":true,"empty":true,"locked":true\}/, /"title":"카니발 · 12가 3456","call":"tel:15885114","fuel":true/, /"formCat":"fuel\|8","cost":\{"screen":"vehicle","total":"70,000원","items":1,"tools":true,"month":true\},"expOpen":"vehicle","companyCats":true\} errs \[\]/]],
  ['본사 웹 시안 (오늘 현황·월간 3줄·보기 탭·오른쪽 패널·동선 미리보기·공지 미리보기·지연 기준)', 'web/hq-v2-test.cjs', ['$DEMO'], [/"kpi":\{"n":6,"first":"지연 · 미확인","hot":true,"sub":true\},"month":\{"rows":3,"more":"\+2개 더","legend":true\},"sideStatus":true/, /"views":\{"week":true,"gantt":true,"kanban":true,"map":true,"analytics":true\}/, /"newPanel":\{"right":true,"tall":true,"preview":true\},"notice":\{"card":true,"urgent":true,"noXss":true,"btn":"\d+명에게 긴급 발송"\}/, /"artists":\{"rows":\d+,"search":true,"title":"소속 아티스트 관리"\},"artistSearch":1,"artistDel":true,"vehicles":\{"sum":3,"rows":\d+\},"expenses":\{"pend":1,"done":1,"noXss":true\},"chips":\{"n":\d+,"synced":true\},"talk":\{"panel":true,"notice":true,"late":true\},"mgrChips":true/, /"push":true\},"saved":"30"\} errs \[\]/]],
  ['경비 기록 (앱 등록·합계·복사·삭제·개인 잠금 / 본사 정산)', 'web/expenses-test.cjs', ['$DEMO'], [/"screen":"0원","enterKeepsOpen":true,"total":"55,000원"/, /"noXss":true,"copy":true,"afterDelete":"3,000원","fromSchedule":true,"indieLocked":true/, /"hq":\{"open":true,"total":true,"rows":3,"noXss":true\},"hqFilter":"2 true","hqClosed":true\} errs \[\]/]],
  ['긴급 지원 전체 화면 (상황 고르고 두 번 눌러 보내기·위치·시각 첨부)', 'web/sos-test.cjs', ['$DEMO'], [/"screen":true,"idle":"보낼 내용을 골라 주세요","noSendWithoutType":true,"confirm":"한 번 더 누르면 보내져요\|0"/, /"urgent":true,"hasTime":true,"hasGps":true,"hasMemo":true/, /"links":"tel:119,tel:112","noHScroll":true\} errs \[\]/]],
  ['로드톡 공지 탭 (긴급 맨 위·확인했어요·N명 중 M명 확인)', 'web/talk-test.cjs', ['$DEMO'], [/"first":\{"urgent":true,"title":"해외 투어 의전 동선 지침","tag":"긴급 · 확인 필요","count":"본사 총괄 · 3명 중 1명 확인"\},"noXss":true,"badge":"2"/, /"after":\{"need":0,"acked":"확인함","count":"본사 총괄 · 3명 중 2명 확인/, /errs \[\]/]],
  ['개인 매니저 (메뉴 4개·무료 제한·유료 2만원·직접 수정)', 'web/indie-test.cjs', ['$DEMO'], [/"nav":"홈,아티스트,AI로드비서,차량관리,내정보"/, /"noHQ":true/, /"free":true,"active":true/, /"upsell":true/, /"noSos":true,"locks":1/, /"upgrade":true/, /\\"free\\":\{\\"autonav\\":false,\\"alerts\\":true,\\"traffic\\":false\}/, /\\"paid\\":\{\\"autonav\\":true,\\"alerts\\":true,\\"traffic\\":true\}/, /\\"company\\":true/, /"aiEdit":true,"aiRole":"indie"/, /errs \[\]/]],
  ['AI 비서 화면 (메뉴 위치·확인 카드·등록 창 채움)', 'web/ai-test.cjs', ['$DEMO'], [/"navOrder":"홈,로드톡,AI로드비서,긴급,내정보"/, /"lockShown":true/, /"fit":true/, /"sent":true,"card":true/, /"place":true/, /"title":"뮤직뱅크 사전녹화","date":"2026-11-08","start":"14:00"/, /"shop":"정샘물 청담"/, /"homeBack":true\} errs \[\]/]],
  ['AI 비서 서버 (로그인·한도·지난 날짜·실제 장소만·변경·중복·넓은 장소·크레딧 알림·안전장치·캐시)', 'server/ai-test.mts', [], [/"noLogin":401/, /"pastRejected":true/, /"addr":"서울 영등포구 여의공원로 13"/, /"cache":true/, /"update":true/, /"dupBlocked":true,"dupThenUpdate":"update"/, /"ambSchedule":true,"ambOkWithHall":null,"ambNearby":true/, /"updBadIdx":true,"updSame":true,"updCancelMix":true,"updCancelOk":null/, /"places":"상암 국밥 230"/, /"hanjaRetry":true,"cardRetry":true,"cleanFallback":true,"cleanStrip":"좋아요 끝","replyOk":null/, /"visionModel":"claude-sonnet-5-5"/, /"credit":"502 AI가 잠시 대답하 ops=1 ai_credit key=yes"/, /"errKind":"ai_credit,ai_key,"/, /"serverDate":true,"noDupCard":true/, /"limit":"429/, /"indie":"true\/false 429 true"/, /"indiePaid":true/, /"noUndefined":true/, /"rulesStable":true/]],
  ['AI 비서 변경 카드 (본사 수정 창·매니저 로드톡 요청)', 'web/ai-update-test.cjs', ['$DEMO'], [/"secretHidden":true/, /"ctxIdx":true,"card":true/, /"start":"18:30","submit":"수정 저장"/, /"done":"✓ 수정 창을 열었어요","noNewSchedule":1,"mgrBtn":true,"mgrOpened":1\} errs \[\]/]],
  ['경로 함수 (타임머신)', 'server/route-at-test.mts', [], [/predictionType/, /예측할 수 없는 시간/]],
];

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent((req.url || '/').split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(0, '0.0.0.0', () => resolve(srv));
  });
}

(async () => {
  const filter = process.argv.slice(2).map(s => s.toLowerCase());
  const srv = await serve();
  const port = srv.address().port;
  const env = { ...process.env, BASE_DEMO: `http://127.0.0.1:${port}`, BASE_PROD: `http://0.0.0.0:${port}` };
  const results = [];
  for (const [name, file, args, expects] of TESTS) {
    if (filter.length && !filter.some(f => (name + file).toLowerCase().includes(f))) continue;
    const full = path.join(__dirname, file);
    const cmd = file.endsWith('.mts') ? ['--experimental-strip-types', '--no-warnings', full] : [full];
    const argv = args.map(a => a === '$DEMO' ? env.BASE_DEMO : a);
    const t0 = Date.now();
    const r = await new Promise((res) => {
      const { spawn } = require('child_process');
      const ch = spawn(process.execPath, [...cmd, ...argv], { cwd: __dirname, env });
      let out = '';
      ch.stdout.on('data', d => out += d); ch.stderr.on('data', d => out += d);
      const timer = setTimeout(() => ch.kill('SIGKILL'), 120000);
      ch.on('close', (code) => { clearTimeout(timer); res({ code, out }); });
    });
    const missing = expects.filter(re => !re.test(r.out));
    const crashed = /TypeError|ReferenceError|SyntaxError|Unhandled|ERR_CONNECTION/.test(r.out);
    const ok = r.code === 0 && !missing.length && !crashed;
    results.push({ name, ok, ms: Date.now() - t0 });
    console.log(`${ok ? '✅' : '❌'} ${name} (${((Date.now() - t0) / 1000).toFixed(1)}초)`);
    if (!ok) {
      if (missing.length) console.log('   빠진 결과: ' + missing.map(String).join(', '));
      console.log('   ' + r.out.trim().split('\n').slice(-12).join('\n   '));
    }
  }
  srv.close();

  if (!filter.length) {
    const chk = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'package_split.cjs'), '--check-only'], { encoding: 'utf8' });
    const ok = chk.status === 0;
    results.push({ name: '패키징 검사 (비밀키·문법·링크)', ok });
    console.log(`${ok ? '✅' : '❌'} 패키징 검사 (비밀키·문법·링크)`);
    if (!ok) console.log(chk.stdout.split('\n').slice(-15).join('\n'));
  }
  const fail = results.filter(r => !r.ok).length;
  console.log(`\n${fail ? '❌' : '🎉'} ${results.length - fail}/${results.length} 통과`);
  process.exit(fail ? 1 : 0);
})();
