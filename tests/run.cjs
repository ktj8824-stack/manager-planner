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
  ['길안내 좌표 (이름+주소)', 'web/nav-fix-test.cjs', [], [/tmap:\/\/route\?rGoName=/, /kakaomap:\/\/route\?ep=/]],
  ['그날 교통 예측 동선', 'web/tm-test.cjs', [], [/도착 기준 교통 예측/, /현재 교통 기준/]],
  ['완료 단계 접기', 'web/fold-test.cjs', [], [/완료된 단계 2개/]],
  ['현장 메모', 'web/venue-test.cjs', [], [/현장 메모 2/, /지하 2층 B구역 주차/]],
  ['예약 알림 (출발·밤 요약)', 'server/rem-test.mts', [], [/13분 뒤 출발/, /매니저 확인 대기 1건/]],
  ['아침 재계산·출발 지연', 'server/rem2-test.mts', [], [/retimed: 1/, /late: 1/, /출발 지연 7분/]],
  ['결제 서버 확인·알림 안내 (화면)', 'web/billing-test.cjs', [], [/"amount":120000/, /"tampered":"blocked"/, /"ok":"success"/, /"shown":true,"afterOn":true,"nativeHidden":true/]],
  ['결제 서버 로직 (금액 조작·권한)', 'server/pay-test.mts', [], [/"mgrBlocked":"FORBIDDEN"/, /"tamper":"AMOUNT_MISMATCH"/, /"otherUser":"ORDER_NOT_FOUND"/, /"slots":2/, /"rejected":"REJECT_CARD_COMPANY"/]],
  ['자정 넘는 일정 (전날 픽업·순서)', 'web/midnight-test.cjs', [], [/"depart0030":"23:35"/, /"inferred":"-1,-1,0,0,0"/, /"order":"21:55 22:20 00:20 01:00 03:00"/, /"badge":3/]],
  ['자정 넘는 일정 (서버 알림 날짜)', 'server/midnight-rem-test.mts', [], [/"offs":\[-1,-1,0,0,0\]/, /"late":\[0,1\]/]],
  ['앱 스케줄 등록 (출발지·매니저·연타·겹침·결제 주소)', 'web/register-test.cjs', [], [/"mgrDefault":"me-uuid"/, /"shopDefault":""/, /"autoEnd":"12:30"/, /"savedCount":1/, /"departure":"출발지 미정"/, /"shop":false/, /겹치는 일정/, /"company":"100%엔터","qmarks":1,"phone":""/]],
  ['기상·준비는 하루 한 번', 'web/wake-multi-test.cjs', [], [/"wakeCount":1/, /"firstTitle":"\[기상/]],
  ['날짜별 버튼 (미래 잠금·지난 날 완료만)', 'web/dayguard-test.cjs', [], [/"F":\{"move":0,"done":0,"wait":true\}/, /"P":\{"move":0,"done":3/, /"T":\{"move":1/, /그날이 아니에요/, /완료\]만/]],
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
