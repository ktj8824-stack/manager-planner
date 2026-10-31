/*
 * 배포용 패키징 스크립트
 *   node tools/package_split.cjs              -> dist_web(본사 관제 포털), dist_app(모바일 앱) 생성
 *   node tools/package_split.cjs --check-only -> 파일을 만들지 않고 소스만 검사
 *
 * 출력 폴더는 환경변수 DIST_WEB, DIST_APP 으로 바꿀 수 있습니다. (기본: 프로젝트의 dist_web, dist_app)
 * 출력 폴더 안의 .git 은 보존됩니다.
 *
 * 패키징 후에는 반드시 아래 검사를 통과해야 합니다. 실패하면 종료 코드 1로 끝납니다.
 *   1) 비밀키 검사: service_role 키, sb_secret_ 키, 개인 키(PEM)가 소스나 결과물에 있으면 실패
 *   2) 자바스크립트 문법 검사
 *   3) 깨진 로컬 링크 검사 (html 의 src/href, sw.js 의 캐시 목록)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST_WEB = path.resolve(process.env.DIST_WEB || path.join(ROOT, 'dist_web'));
const DIST_APP = path.resolve(process.env.DIST_APP || path.join(ROOT, 'dist_app'));
const CHECK_ONLY = process.argv.includes('--check-only');

// ───────────────────────── 검사 ─────────────────────────
const TEXT_EXT = new Set(['.html', '.js', '.cjs', '.mjs', '.json', '.css', '.md', '.sql', '.ts', '.txt', '.svg', '.bat', '.webmanifest']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scratch', 'dist_web', 'dist_app', '.vscode']);
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;

function walk(dir, skip, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (skip.has(e.name)) continue;
      walk(path.join(dir, e.name), skip, out);
    } else out.push(path.join(dir, e.name));
  }
  return out;
}

function jwtRole(payload) {
  try {
    const p = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')).role || null;
  } catch { return null; }
}

// 비밀값 자체는 출력하지 않고 "파일:줄 — 종류"만 알려줍니다.
function scanSecrets(dir, label, skip = SKIP_DIRS) {
  const problems = [];
  for (const file of walk(dir, skip)) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const where = `${label}/${path.relative(dir, file).replace(/\\/g, '/')}:${i + 1}`;
      for (const m of line.matchAll(JWT_RE)) {
        if (jwtRole(m[1]) === 'service_role') problems.push(`${where} — service_role 키 (마스터키)`);
      }
      if (/sb_secret_[A-Za-z0-9_-]{8,}/.test(line)) problems.push(`${where} — sb_secret_ 키`);
      if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(line)) problems.push(`${where} — 개인 키(PEM)`);
    });
  }
  return problems;
}

function checkSyntax(dir, label) {
  const problems = [];
  for (const file of walk(dir, SKIP_DIRS)) {
    if (!/\.(js|cjs|mjs)$/.test(file)) continue;
    const r = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (r.status !== 0) problems.push(`${label}/${path.relative(dir, file).replace(/\\/g, '/')} — 문법 오류`);
  }
  return problems;
}

function checkLinks(dir, label) {
  const problems = [];
  if (!fs.existsSync(dir)) return problems;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.html')) continue;
    const html = fs.readFileSync(path.join(dir, name), 'utf8');
    for (const m of html.matchAll(/(?:src|href)="(?!https?:|#|mailto:|tel:|data:|javascript:|\$\{)([^"?#]+)/g)) {
      const rel = m[1].replace(/^\.\//, '');
      if (rel && !fs.existsSync(path.join(dir, rel))) problems.push(`${label}/${name} — 없는 파일 링크: ${rel}`);
    }
  }
  const sw = path.join(dir, 'sw.js');
  if (fs.existsSync(sw)) {
    const src = fs.readFileSync(sw, 'utf8');
    for (const m of src.matchAll(/"([A-Za-z0-9_./-]+\.(?:html|js|css|png|svg|json))"/g)) {
      if (!fs.existsSync(path.join(dir, m[1]))) problems.push(`${label}/sw.js — 캐시 목록에 있지만 없는 파일: ${m[1]}`);
    }
  }
  return problems;
}

function runChecks(targets) {
  let failed = false;
  const report = (title, list) => {
    if (list.length) {
      failed = true;
      console.log(`❌ ${title}`);
      list.slice(0, 30).forEach((p) => console.log('   - ' + p));
      if (list.length > 30) console.log(`   ... 외 ${list.length - 30}건`);
    } else console.log(`✅ ${title}`);
  };
  report('비밀키 검사 (소스)', scanSecrets(ROOT, 'source'));
  for (const [label, dir] of targets) {
    report(`비밀키 검사 (${label})`, scanSecrets(dir, label, new Set(['.git', 'node_modules'])));
    report(`자바스크립트 문법 (${label})`, checkSyntax(dir, label));
    report(`로컬 링크 (${label})`, checkLinks(dir, label));
  }
  return !failed;
}

if (CHECK_ONLY) {
  console.log('🔎 소스 검사만 실행합니다.');
  process.exit(runChecks([]) ? 0 : 1);
}

// ───────────────────────── 패키징 ─────────────────────────
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function cleanDirExceptGit(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  for (const file of fs.readdirSync(dir)) {
    if (file === '.git') continue;
    fs.rmSync(path.join(dir, file), { recursive: true, force: true });
  }
}

// 소스에 비밀키가 있으면 아무것도 건드리지 않고 중단합니다.
console.log('🔎 0. 소스 사전 검사...');
const pre = scanSecrets(ROOT, 'source');
if (pre.length) {
  console.log('❌ 소스에 비밀키가 있어 패키징을 중단합니다.');
  pre.forEach((p) => console.log('   - ' + p));
  process.exit(1);
}

cleanDirExceptGit(DIST_WEB);
cleanDirExceptGit(DIST_APP);

console.log('📦 1. dist_web (웹 관리자 관제 포털) 패키징 시작...');
copyFile(path.join(ROOT, 'admin.html'), path.join(DIST_WEB, 'index.html')); // admin.html -> index.html
copyFile(path.join(ROOT, 'admin-login.html'), path.join(DIST_WEB, 'admin-login.html'));
// 테스트 결제 페이지 (배포본에도 포함)
for (const f of ['payment.html', 'payment-result.html']) copyFile(path.join(ROOT, f), path.join(DIST_WEB, f));

copyDir(path.join(ROOT, 'css'), path.join(DIST_WEB, 'css'));
copyDir(path.join(ROOT, 'img'), path.join(DIST_WEB, 'img'));
copyDir(path.join(ROOT, 'js'), path.join(DIST_WEB, 'js'));

// admin.html -> index.html 링크 치환
for (const name of ['index.html', 'admin-login.html', 'payment.html', 'payment-result.html']) {
  const p = path.join(DIST_WEB, name);
  if (!fs.existsSync(p)) continue;
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/admin\.html/g, 'index.html'), 'utf8');
}

fs.writeFileSync(path.join(DIST_WEB, 'README.md'), `# HQ 마스터 관제 포털 (Web)

HQ Enterprise Scheduler - 엔터테인먼트 마스터 스케줄 관제 웹 포털

## 배포 및 도메인
- GitHub Pages 또는 Vercel / Cloudflare Pages를 통해 정적 웹 호스팅으로 배포할 수 있습니다.
- 메인 진입점: \`index.html\`
`, 'utf8');
console.log('✅ dist_web 패키징 완료!');

console.log('📱 2. dist_app (현장 매니저 모바일 플래너) 패키징 시작...');
copyFile(path.join(ROOT, 'index.html'), path.join(DIST_APP, 'index.html'));
copyFile(path.join(ROOT, 'login.html'), path.join(DIST_APP, 'login.html'));
copyFile(path.join(ROOT, 'manifest.json'), path.join(DIST_APP, 'manifest.json'));
copyFile(path.join(ROOT, 'sw.js'), path.join(DIST_APP, 'sw.js'));
for (const f of ['payment.html', 'payment-result.html']) copyFile(path.join(ROOT, f), path.join(DIST_APP, f));

copyDir(path.join(ROOT, 'css'), path.join(DIST_APP, 'css'));
copyDir(path.join(ROOT, 'img'), path.join(DIST_APP, 'img'));
copyDir(path.join(ROOT, 'icons'), path.join(DIST_APP, 'icons'));
copyDir(path.join(ROOT, 'js'), path.join(DIST_APP, 'js'));

for (const f of ['icon.svg', 'icon-192.png', 'icon-512.png', 'privacy.html', 'terms.html']) {
  copyFile(path.join(ROOT, f), path.join(DIST_APP, f));
  copyFile(path.join(ROOT, f), path.join(DIST_WEB, f));
}

fs.writeFileSync(path.join(DIST_APP, 'README.md'), `# 매니저 플래너 (Manager App)

현장 매니저 전용 스마트 역산 동선 플래너 & 스케줄러 (PWA)

## 배포 및 도메인
- 모바일 PWA 지원 (홈 화면에 바로가기 추가 시 앱처럼 동작)
- GitHub Pages 또는 Vercel / Cloudflare Pages를 통해 정적 웹 호스팅으로 배포할 수 있습니다.
- 메인 진입점: \`index.html\`
`, 'utf8');
console.log('✅ dist_app 패키징 완료!');

console.log('🔎 3. 결과물 검사...');
const ok = runChecks([['dist_web', DIST_WEB], ['dist_app', DIST_APP]]);
if (!ok) {
  console.log('\n⛔ 검사에 실패했습니다. 위 항목을 고친 뒤 다시 실행하세요. 결과물을 배포(push)하지 마세요.');
  process.exit(1);
}
console.log('\n🎉 패키징과 검사를 모두 통과했습니다.');
