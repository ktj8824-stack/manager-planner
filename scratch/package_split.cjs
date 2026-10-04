const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST_WEB = path.join(ROOT, 'dist_web');
const DIST_APP = path.join(ROOT, 'dist_app');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFile(src, dest) {
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. 디렉토리 정리 (.git 폴더 보존)
function cleanDirExceptGit(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  const entries = fs.readdirSync(dir);
  for (let file of entries) {
    if (file === '.git') continue;
    fs.rmSync(path.join(dir, file), { recursive: true, force: true });
  }
}
cleanDirExceptGit(DIST_WEB);
cleanDirExceptGit(DIST_APP);

console.log('📦 1. dist_web (웹 관리자 관제 포털) 패키징 시작...');
// dist_web 파일 복사
copyFile(path.join(ROOT, 'admin.html'), path.join(DIST_WEB, 'index.html')); // admin.html -> index.html
copyFile(path.join(ROOT, 'admin-login.html'), path.join(DIST_WEB, 'admin-login.html'));
copyFile(path.join(ROOT, 'admin-register.html'), path.join(DIST_WEB, 'admin-register.html'));

copyDir(path.join(ROOT, 'css'), path.join(DIST_WEB, 'css'));
copyDir(path.join(ROOT, 'img'), path.join(DIST_WEB, 'img'));
copyDir(path.join(ROOT, 'js'), path.join(DIST_WEB, 'js'));

// dist_web 내의 index.html, admin-login.html 링크 정리 (admin.html -> index.html 치환)
let adminIndexHtml = fs.readFileSync(path.join(DIST_WEB, 'index.html'), 'utf8');
adminIndexHtml = adminIndexHtml.replace(/admin\.html/g, 'index.html');
fs.writeFileSync(path.join(DIST_WEB, 'index.html'), adminIndexHtml, 'utf8');

let adminLoginHtml = fs.readFileSync(path.join(DIST_WEB, 'admin-login.html'), 'utf8');
adminLoginHtml = adminLoginHtml.replace(/admin\.html/g, 'index.html');
fs.writeFileSync(path.join(DIST_WEB, 'admin-login.html'), adminLoginHtml, 'utf8');

let adminRegisterHtml = fs.readFileSync(path.join(DIST_WEB, 'admin-register.html'), 'utf8');
adminRegisterHtml = adminRegisterHtml.replace(/admin\.html/g, 'index.html');
fs.writeFileSync(path.join(DIST_WEB, 'admin-register.html'), adminRegisterHtml, 'utf8');

// dist_web README 생성
fs.writeFileSync(path.join(DIST_WEB, 'README.md'), `# HQ 마스터 관제 포털 (Web)

HQ Enterprise Scheduler - 엔터테인먼트 마스터 스케줄 관제 웹 포털

## 배포 및 도메인
- GitHub Pages 또는 Vercel / Cloudflare Pages를 통해 정적 웹 호스팅으로 배포할 수 있습니다.
- 메인 진입점: \`index.html\`
`, 'utf8');

console.log('✅ dist_web 패키징 완료!');

console.log('📱 2. dist_app (현장 매니저 모바일 플래너) 패키징 시작...');
// dist_app 파일 복사
copyFile(path.join(ROOT, 'index.html'), path.join(DIST_APP, 'index.html'));
copyFile(path.join(ROOT, 'login.html'), path.join(DIST_APP, 'login.html'));
copyFile(path.join(ROOT, 'manifest.json'), path.join(DIST_APP, 'manifest.json'));
copyFile(path.join(ROOT, 'sw.js'), path.join(DIST_APP, 'sw.js'));

copyDir(path.join(ROOT, 'css'), path.join(DIST_APP, 'css'));
copyDir(path.join(ROOT, 'img'), path.join(DIST_APP, 'img'));
copyDir(path.join(ROOT, 'icons'), path.join(DIST_APP, 'icons'));
copyDir(path.join(ROOT, 'js'), path.join(DIST_APP, 'js'));

// dist_app README 생성
fs.writeFileSync(path.join(DIST_APP, 'README.md'), `# 매니저 플래너 (Manager App)

현장 매니저 전용 스마트 역산 동선 플래너 & 스케줄러 (PWA)

## 배포 및 도메인
- 모바일 PWA 지원 (홈 화면에 바로가기 추가 시 앱처럼 동작)
- GitHub Pages 또는 Vercel / Cloudflare Pages를 통해 정적 웹 호스팅으로 배포할 수 있습니다.
- 메인 진입점: \`index.html\`
`, 'utf8');

console.log('✅ dist_app 패키징 완료!');
