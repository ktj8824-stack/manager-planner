const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const APP_PORT = 5503;
const WEB_PORT = 5504;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

function createStaticServer(defaultPage, port, label) {
  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/' || reqUrl === '') {
      reqUrl = '/' + defaultPage;
    }

    let filePath = path.join(ROOT_DIR, decodeURIComponent(reqUrl));

    // 디렉토리 방지 및 안전 검사
    if (!filePath.startsWith(ROOT_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('403 Forbidden');
      return;
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end(`404 Not Found: ${reqUrl}`);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      });

      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ [${label}] 포트 ${port}는 이미 다른 프로그램(예: Live Server)에서 사용 중입니다.`);
    } else {
      console.error(`❌ [${label}] 서버 에러:`, err);
    }
  });

  server.listen(port, () => {
    console.log(`✅ [${label}] 서버 시작: http://127.0.0.1:${port} (기본 진입점: ${defaultPage})`);
  });

  return server;
}

console.log('====================================================');
console.log('🚀 HQ & 매니저 플래너 듀얼 포트 서버 실행 중...');
console.log('====================================================');

// 1. 앱 서버 (현장 매니저 플래너) -> 5503
createStaticServer('index.html', APP_PORT, '📱 현장 매니저 앱');

// 2. 웹 서버 (본사 관제 마스터 포털) -> 5504
createStaticServer('admin.html', WEB_PORT, '💻 본사 마스터 웹');

console.log('\n✨ 접속 주소:');
console.log(`- 📱 현장 매니저 플래너 앱:   http://127.0.0.1:${APP_PORT}`);
console.log(`- 💻 본사 마스터 관제 포털:   http://127.0.0.1:${WEB_PORT}/admin-login.html (또는 /admin.html)`);
console.log('====================================================\n');
