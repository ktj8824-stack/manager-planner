/* App-shell cache only. HQ admin pages/scripts, APIs and third-party requests are never intercepted. Shared admin-data.js is an app dependency. */
const CACHE_PREFIX = 'managerplanner-app:' + encodeURIComponent(self.registration.scope) + ':';
const CACHE_NAME = CACHE_PREFIX + 'v256-css25-js256';
const LEGACY_CACHES = ["managerplanner-v103-cache", CACHE_PREFIX + 'v182-css24-js181', CACHE_PREFIX + 'v183-css24-js183', CACHE_PREFIX + 'v184-css24-js184', CACHE_PREFIX + 'v185-css24-js185', CACHE_PREFIX + 'v186-css24-js186', CACHE_PREFIX + 'v187-css24-js187', CACHE_PREFIX + 'v188-css24-js188', CACHE_PREFIX + 'v189-css24-js189', CACHE_PREFIX + 'v190-css24-js190', CACHE_PREFIX + 'v191-css24-js191', CACHE_PREFIX + 'v192-css24-js192', CACHE_PREFIX + 'v193-css24-js193', CACHE_PREFIX + 'v194-css24-js194', CACHE_PREFIX + 'v195-css24-js195', CACHE_PREFIX + 'v196-css24-js196', CACHE_PREFIX + 'v197-css24-js197', CACHE_PREFIX + 'v198-css24-js198', CACHE_PREFIX + 'v199-css24-js199', CACHE_PREFIX + 'v200-css24-js200', CACHE_PREFIX + 'v201-css24-js201', CACHE_PREFIX + 'v202-css24-js202', CACHE_PREFIX + 'v203-css24-js203', CACHE_PREFIX + 'v204-css24-js204', CACHE_PREFIX + 'v205-css24-js205', CACHE_PREFIX + 'v206-css24-js206', CACHE_PREFIX + 'v207-css25-js207', CACHE_PREFIX + 'v208-css25-js208', CACHE_PREFIX + 'v209-css25-js209', CACHE_PREFIX + 'v210-css25-js210', CACHE_PREFIX + 'v211-css25-js211', CACHE_PREFIX + 'v212-css25-js212', CACHE_PREFIX + 'v213-css25-js213', CACHE_PREFIX + 'v214-css25-js214', CACHE_PREFIX + 'v215-css25-js215', CACHE_PREFIX + 'v216-css25-js216', CACHE_PREFIX + 'v217-css25-js217', CACHE_PREFIX + 'v218-css25-js218', CACHE_PREFIX + 'v219-css25-js219', CACHE_PREFIX + 'v220-css25-js220', CACHE_PREFIX + 'v221-css25-js221', CACHE_PREFIX + 'v222-css25-js222', CACHE_PREFIX + 'v223-css25-js223', CACHE_PREFIX + 'v224-css25-js224', CACHE_PREFIX + 'v225-css25-js225', CACHE_PREFIX + 'v226-css25-js226', CACHE_PREFIX + 'v227-css25-js227', CACHE_PREFIX + 'v228-css25-js228', CACHE_PREFIX + 'v229-css25-js229', CACHE_PREFIX + 'v230-css25-js230', CACHE_PREFIX + 'v231-css25-js231', CACHE_PREFIX + 'v232-css25-js232', CACHE_PREFIX + 'v233-css25-js233', CACHE_PREFIX + 'v234-css25-js234', CACHE_PREFIX + 'v235-css25-js235', CACHE_PREFIX + 'v236-css25-js236', CACHE_PREFIX + 'v237-css25-js237', CACHE_PREFIX + 'v238-css25-js238', CACHE_PREFIX + 'v239-css25-js239', CACHE_PREFIX + 'v240-css25-js240', CACHE_PREFIX + 'v241-css25-js241', CACHE_PREFIX + 'v242-css25-js242', CACHE_PREFIX + 'v243-css25-js243', CACHE_PREFIX + 'v244-css25-js244', CACHE_PREFIX + 'v245-css25-js245', CACHE_PREFIX + 'v246-css25-js246', CACHE_PREFIX + 'v247-css25-js247', CACHE_PREFIX + 'v248-css25-js248', CACHE_PREFIX + 'v249-css25-js249', CACHE_PREFIX + 'v250-css25-js250', CACHE_PREFIX + 'v251-css25-js251', CACHE_PREFIX + 'v252-css25-js252', CACHE_PREFIX + 'v253-css25-js253', CACHE_PREFIX + 'v254-css25-js254', CACHE_PREFIX + 'v255-css25-js255'];
const SCOPE_URL = new URL(self.registration.scope);
// Versioned and unversioned URLs share an explicit, current-version key.
// Unknown versions bypass this worker instead of receiving a stale asset.
const ASSET_ENTRIES = [
  [
    "index.html",
    ""
  ],
  [
    "privacy.html",
    ""
  ],
  [
    "manifest.json",
    ""
  ],
  [
    "icon.svg",
    ""
  ],
  [
    "icon-192.png",
    ""
  ],
  [
    "icon-512.png",
    ""
  ],
  [
    "img/logo.jpg",
    ""
  ],
  [
    "css/variables.css",
    "25"
  ],
  [
    "css/base.css",
    "26"
  ],
  [
    "css/components.css",
    "25"
  ],
  [
    "css/calendar.css",
    "25"
  ],
  [
    "css/home.css",
    "25"
  ],
  [
    "css/timeline.css",
    "25"
  ],
  [
    "css/register.css",
    "25"
  ],
  [
    "css/login.css",
    "25"
  ],
  [
    "css/profile.css",
    "25"
  ],
  [
    "css/chat.css",
    "7"
  ],
  [
    "js/chat.js",
    "256"
  ],
  [
    "css/upgrade.css",
    "25"
  ],
  [
    "js/icons.js",
    "256"
  ],
  [
    "js/splash.js",
    "256"
  ],
  [
    "js/admin-data.js",
    "256"
  ],
  [
    "js/data.js",
    "256"
  ],
  [
    "js/api.js",
    "256"
  ],
  [
    "js/utils.js",
    "256"
  ],
  [
    "js/autonav.js",
    "256"
  ],
  [
    "js/home.js",
    "256"
  ],
  [
    "js/timeline.js",
    "256"
  ],
  [
    "js/register.js",
    "256"
  ],
  [
    "js/login.js",
    "256"
  ],
  [
    "js/onboarding.js",
    "256"
  ],
  [
    "js/profile.js",
    "256"
  ],
  [
    "js/upgrade.js",
    "256"
  ],
  [
    "js/supabase-client.js",
    "256"
  ],
  [
    "js/app.js",
    "256"
  ]
];
const ASSET_KEYS = new Map();
for (const [relative, version] of ASSET_ENTRIES) {
  const plain = new URL(relative, SCOPE_URL).href;
  const versioned = version ? plain + '?v=' + version : plain;
  ASSET_KEYS.set(plain, versioned);
  ASSET_KEYS.set(versioned, versioned);
}
ASSET_KEYS.set(SCOPE_URL.href, new URL('index.html', SCOPE_URL).href);
const INDEX_KEY = new URL('index.html', SCOPE_URL).href;

async function readCache(key) {
  try {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(key);
  } catch (_) { return undefined; }
}
function canStore(response) {
  return response.ok && !response.redirected &&
    (response.type === 'basic' || response.type === 'default') &&
    !/no-store|private/i.test(response.headers.get('Cache-Control') || '') &&
    !/(?:^|,)\s*\*\s*(?:,|$)/.test(response.headers.get('Vary') || '');
}
async function writeCache(key, response) {
  if (!canStore(response)) return;
  try {
    const copy = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, copy);
  } catch (_) { /* Storage/quota failures must not break a network response. */ }
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    await Promise.all([...new Set(ASSET_KEYS.values())].map(async key => {
      try {
        const response = await fetch(new Request(key, { credentials: 'omit', cache: 'reload' }));
        await writeCache(key, response);
      } catch (_) { /* One unavailable optional asset must not reject installation. */ }
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter(key =>
        (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) || LEGACY_CACHES.includes(key)
      ).map(key => caches.delete(key).catch(() => false)));
    } catch (_) { /* Cache storage can be disabled. */ }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('Authorization') || request.cache === 'no-store') return;
  const url = new URL(request.url);
  if (url.origin !== SCOPE_URL.origin || !url.href.startsWith(SCOPE_URL.href)) return;
  const key = ASSET_KEYS.get(url.href);
  if (!key) return; // Strict allowlist excludes HQ/admin, APIs and unknown query parameters.
  const navigation = request.mode === 'navigate';
  const navigationKeys = [SCOPE_URL.href, INDEX_KEY, new URL('privacy.html', SCOPE_URL).href];
  if (navigation && !navigationKeys.includes(url.href)) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      // Never replace a cached resource with an error or redirected login page.
      if (canStore(response)) event.waitUntil(writeCache(key, response));
      if (navigation && response.status >= 500) {
        const fallback = await readCache(key) || await readCache(INDEX_KEY);
        if (fallback) return fallback;
      }
      return response;
    } catch (_) {
      const cached = await readCache(key);
      if (cached) return cached;
      if (navigation) {
        const shell = await readCache(INDEX_KEY);
        if (shell) return shell;
        return new Response('Offline. Please reconnect and reload.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' }
        });
      }
      return Response.error();
    }
  })());
});

const META_CACHE = 'rodi-meta';
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // 알림을 눌렀을 때 열 화면 기억 (본사=admin.html, 매니저=앱)
  if (event.data && event.data.type === 'SET_OPEN_PATH') {
    const path = event.data.path === 'admin.html' ? 'admin.html' : './';
    event.waitUntil(caches.open(META_CACHE).then(c => c.put('open-path', new Response(path))).catch(() => {}));
  }
});
async function openPath() {
  try { const r = await (await caches.open(META_CACHE)).match('open-path'); if (r) return (await r.text()) === 'admin.html' ? 'admin.html' : './'; } catch (_) { }
  return './';
}

// ── 푸시 알림 (앱을 닫았거나 내비게이션 앱을 쓰는 중에도 도착) ──
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { title: '로드톡', body: event.data ? event.data.text() : '' }; }
  const urgent = !!data.urgent;
  event.waitUntil(self.registration.showNotification(data.title || '로드톡', {
    body: data.body || '',
    icon: new URL('icon-192.png', SCOPE_URL).href,
    badge: new URL('icon-192.png', SCOPE_URL).href,
    tag: data.tag || 'chat',
    renotify: true,
    requireInteraction: urgent,                       // 긴급은 확인할 때까지 남아 있음
    vibrate: urgent ? [300, 120, 300, 120, 600] : [200, 100, 200],
    data: { room_id: data.room_id || '' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const roomId = (event.notification.data && event.notification.data.room_id) || '';
  event.waitUntil((async () => {
    const path = await openPath();
    const wins = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(w => w.url.startsWith(SCOPE_URL.href) && 'focus' in w);
    const isAdmin = (w) => /\/admin\.html/.test(new URL(w.url).pathname);
    const pick = wins.find(w => path === 'admin.html' ? isAdmin(w) : !isAdmin(w)) || wins[0];
    if (pick) {
      await pick.focus();
      pick.postMessage({ type: 'OPEN_CHAT', roomId });
      return;
    }
    await self.clients.openWindow(new URL(path + '?chat=' + encodeURIComponent(roomId), SCOPE_URL).href);
  })());
});

// 기기 알림 주소가 바뀌었을 때(브라우저가 갱신) 앱이 다시 등록하도록 알림
self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
    wins.forEach(w => w.postMessage({ type: 'PUSH_RESUBSCRIBE' }));
  }));
});
