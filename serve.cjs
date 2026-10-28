const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const APP_PORT = 5503;
const WEB_PORT = 5504;

// 토스페이먼츠 시크릿 키 (상용화 시 환경변수 TOSS_SECRET_KEY로 주입)
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || 'test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6';

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

// 💳 토스페이먼츠 최종 결제 승인 API 핸들러
function handlePaymentConfirm(req, res) {
  let bodyStr = '';
  req.on('data', chunk => bodyStr += chunk);
  req.on('end', () => {
    try {
      const { paymentKey, orderId, amount } = JSON.parse(bodyStr || '{}');
      if (!paymentKey || !orderId || !amount) {
        res.writeHead(400, {
          'Content-Type': 'application/json; charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        res.end(JSON.stringify({ error: 'paymentKey, orderId, amount가 모두 필요합니다.' }));
        return;
      }

      console.log(`💳 [결제 승인 요청] 주문번호: ${orderId}, 금액: ${amount}원, 키: ${paymentKey}`);

      const basicAuth = Buffer.from(TOSS_SECRET_KEY + ':').toString('base64');
      const postData = JSON.stringify({ paymentKey, orderId, amount });

      const tossReq = https.request('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (tossRes) => {
        let tossData = '';
        tossRes.on('data', chunk => tossData += chunk);
        tossRes.on('end', () => {
          console.log(`✅ [토스 승인 응답] 상태코드: ${tossRes.statusCode}`);
          res.writeHead(tossRes.statusCode, {
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          });
          res.end(tossData);
        });
      });

      tossReq.on('error', (err) => {
        console.error('❌ 토스 승인 서버 통신 오류:', err);
        res.writeHead(500, {
          'Content-Type': 'application/json; charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: '토스페이먼츠 승인 통신 실패', message: err.message }));
      });

      tossReq.write(postData);
      tossReq.end();
    } catch (e) {
      res.writeHead(400, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: '잘못된 JSON 요청 본문입니다.' }));
    }
  });
}

function createStaticServer(defaultPage, port, label) {
  const server = http.createServer((req, res) => {
    // CORS Preflight 처리
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end();
      return;
    }

    let reqUrl = req.url.split('?')[0];

    // 💳 토스 결제 승인 API 라우팅
    if (reqUrl === '/api/payments/confirm' && req.method === 'POST') {
      handlePaymentConfirm(req, res);
      return;
    }

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
