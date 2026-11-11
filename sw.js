/* App-shell cache only. HQ admin pages/scripts, APIs and third-party requests are never intercepted. Shared admin-data.js is an app dependency. */
const CACHE_PREFIX = 'managerplanner-app:' + encodeURIComponent(self.registration.scope) + ':';
const CACHE_NAME = CACHE_PREFIX + 'v326-css326-js326';
const LEGACY_CACHES = ["managerplanner-v103-cache", CACHE_PREFIX + 'v182-css24-js181', CACHE_PREFIX + 'v183-css24-js183', CACHE_PREFIX + 'v184-css24-js184', CACHE_PREFIX + 'v185-css24-js185', CACHE_PREFIX + 'v186-css24-js186', CACHE_PREFIX + 'v187-css24-js187', CACHE_PREFIX + 'v188-css24-js188', CACHE_PREFIX + 'v189-css24-js189', CACHE_PREFIX + 'v190-css24-js190', CACHE_PREFIX + 'v191-css24-js191', CACHE_PREFIX + 'v192-css24-js192', CACHE_PREFIX + 'v193-css24-js193', CACHE_PREFIX + 'v194-css24-js194', CACHE_PREFIX + 'v195-css24-js195', CACHE_PREFIX + 'v196-css24-js196', CACHE_PREFIX + 'v197-css24-js197', CACHE_PREFIX + 'v198-css24-js198', CACHE_PREFIX + 'v199-css24-js199', CACHE_PREFIX + 'v200-css24-js200', CACHE_PREFIX + 'v201-css24-js201', CACHE_PREFIX + 'v202-css24-js202', CACHE_PREFIX + 'v203-css24-js203', CACHE_PREFIX + 'v204-css24-js204', CACHE_PREFIX + 'v205-css24-js205', CACHE_PREFIX + 'v206-css24-js206', CACHE_PREFIX + 'v207-css25-js207', CACHE_PREFIX + 'v208-css25-js208', CACHE_PREFIX + 'v209-css25-js209', CACHE_PREFIX + 'v210-css25-js210', CACHE_PREFIX + 'v211-css25-js211', CACHE_PREFIX + 'v212-css25-js212', CACHE_PREFIX + 'v213-css25-js213', CACHE_PREFIX + 'v214-css25-js214', CACHE_PREFIX + 'v215-css25-js215', CACHE_PREFIX + 'v216-css25-js216', CACHE_PREFIX + 'v217-css25-js217', CACHE_PREFIX + 'v218-css25-js218', CACHE_PREFIX + 'v219-css25-js219', CACHE_PREFIX + 'v220-css25-js220', CACHE_PREFIX + 'v221-css25-js221', CACHE_PREFIX + 'v222-css25-js222', CACHE_PREFIX + 'v223-css25-js223', CACHE_PREFIX + 'v224-css25-js224', CACHE_PREFIX + 'v225-css25-js225', CACHE_PREFIX + 'v226-css25-js226', CACHE_PREFIX + 'v227-css25-js227', CACHE_PREFIX + 'v228-css25-js228', CACHE_PREFIX + 'v229-css25-js229', CACHE_PREFIX + 'v230-css25-js230', CACHE_PREFIX + 'v231-css25-js231', CACHE_PREFIX + 'v232-css25-js232', CACHE_PREFIX + 'v233-css25-js233', CACHE_PREFIX + 'v234-css25-js234', CACHE_PREFIX + 'v235-css25-js235', CACHE_PREFIX + 'v236-css25-js236', CACHE_PREFIX + 'v237-css25-js237', CACHE_PREFIX + 'v238-css25-js238', CACHE_PREFIX + 'v239-css25-js239', CACHE_PREFIX + 'v240-css25-js240', CACHE_PREFIX + 'v241-css25-js241', CACHE_PREFIX + 'v242-css25-js242', CACHE_PREFIX + 'v243-css25-js243', CACHE_PREFIX + 'v244-css25-js244', CACHE_PREFIX + 'v245-css25-js245', CACHE_PREFIX + 'v246-css25-js246', CACHE_PREFIX + 'v247-css25-js247', CACHE_PREFIX + 'v248-css25-js248', CACHE_PREFIX + 'v249-css25-js249', CACHE_PREFIX + 'v250-css25-js250', CACHE_PREFIX + 'v251-css25-js251', CACHE_PREFIX + 'v252-css25-js252', CACHE_PREFIX + 'v253-css25-js253', CACHE_PREFIX + 'v254-css25-js254', CACHE_PREFIX + 'v255-css25-js255', CACHE_PREFIX + 'v256-css25-js256', CACHE_PREFIX + 'v257-css25-js257', CACHE_PREFIX + 'v258-css25-js258', CACHE_PREFIX + 'v259-css25-js259', CACHE_PREFIX + 'v260-css25-js260', CACHE_PREFIX + 'v261-css25-js261', CACHE_PREFIX + 'v262-css25-js262', CACHE_PREFIX + 'v263-css25-js263', CACHE_PREFIX + 'v264-css25-js264', CACHE_PREFIX + 'v265-css25-js265', CACHE_PREFIX + 'v266-css25-js266', CACHE_PREFIX + 'v267-css25-js267', CACHE_PREFIX + 'v268-css25-js268', CACHE_PREFIX + 'v269-css25-js269', CACHE_PREFIX + 'v270-css25-js270', CACHE_PREFIX + 'v271-css25-js271', CACHE_PREFIX + 'v272-css25-js272', CACHE_PREFIX + 'v273-css25-js273', CACHE_PREFIX + 'v274-css25-js274', CACHE_PREFIX + 'v275-css25-js275', CACHE_PREFIX + 'v276-css25-js276', CACHE_PREFIX + 'v277-css25-js277', CACHE_PREFIX + 'v278-css25-js278', CACHE_PREFIX + 'v279-css25-js279', CACHE_PREFIX + 'v280-css25-js280', CACHE_PREFIX + 'v281-css25-js281', CACHE_PREFIX + 'v282-css25-js282', CACHE_PREFIX + 'v283-css25-js283', CACHE_PREFIX + 'v284-css25-js284', CACHE_PREFIX + 'v285-css25-js285', CACHE_PREFIX + 'v286-css25-js286', CACHE_PREFIX + 'v287-css25-js287', CACHE_PREFIX + 'v288-css25-js288', CACHE_PREFIX + 'v289-css25-js289', CACHE_PREFIX + 'v290-css25-js290', CACHE_PREFIX + 'v291-css25-js291', CACHE_PREFIX + 'v292-css25-js292', CACHE_PREFIX + 'v293-css25-js293', CACHE_PREFIX + 'v294-css25-js294', CACHE_PREFIX + 'v295-css25-js295', CACHE_PREFIX + 'v296-css25-js296', CACHE_PREFIX + 'v297-css25-js297', CACHE_PREFIX + 'v298-css25-js298', CACHE_PREFIX + 'v299-css25-js299', CACHE_PREFIX + 'v300-css25-js300', CACHE_PREFIX + 'v301-css25-js301', CACHE_PREFIX + 'v302-css25-js302', CACHE_PREFIX + 'v303-css25-js303', CACHE_PREFIX + 'v304-css25-js304', CACHE_PREFIX + 'v305-css25-js305', CACHE_PREFIX + 'v306-css25-js306', CACHE_PREFIX + 'v307-css25-js307', CACHE_PREFIX + 'v308-css25-js308', CACHE_PREFIX + 'v309-css309-js309', CACHE_PREFIX + 'v310-css310-js310', CACHE_PREFIX + 'v311-css311-js311', CACHE_PREFIX + 'v312-css312-js312', CACHE_PREFIX + 'v313-css313-js313', CACHE_PREFIX + 'v314-css314-js314', CACHE_PREFIX + 'v315-css315-js315', CACHE_PREFIX + 'v316-css316-js316', CACHE_PREFIX + 'v317-css317-js317', CACHE_PREFIX + 'v318-css318-js318', CACHE_PREFIX + 'v319-css319-js319', CACHE_PREFIX + 'v320-css320-js320', CACHE_PREFIX + 'v321-css321-js321', CACHE_PREFIX + 'v322-css322-js322', CACHE_PREFIX + 'v323-css323-js323', CACHE_PREFIX + 'v324-css324-js324', CACHE_PREFIX + 'v325-css325-js325'];
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
    "apple-touch-icon.png",
    ""
  ],
  [
    "css/variables.css",
    "326"
  ],
  [
    "css/base.css",
    "326"
  ],
  [
    "css/components.css",
    "326"
  ],
  [
    "css/calendar.css",
    "326"
  ],
  [
    "css/home.css",
    "326"
  ],
  [
    "css/timeline.css",
    "326"
  ],
  [
    "css/register.css",
    "326"
  ],
  [
    "css/login.css",
    "326"
  ],
  [
    "css/profile.css",
    "326"
  ],
  [
    "css/chat.css",
    "326"
  ],
  [
    "css/ai.css",
    "326"
  ],
  [
    "js/chat.js",
    "326"
  ],
  [
    "css/upgrade.css",
    "326"
  ],
  [
    "js/icons.js",
    "326"
  ],
  [
    "js/splash.js",
    "326"
  ],
  [
    "js/admin-data.js",
    "326"
  ],
  [
    "js/data.js",
    "326"
  ],
  [
    "js/api.js",
    "326"
  ],
  [
    "js/utils.js",
    "326"
  ],
  [
    "js/autonav.js",
    "326"
  ],
  [
    "js/venue.js",
    "326"
  ],
  [
    "js/site-config.js",
    "326"
  ],
  [
    "js/home.js",
    "326"
  ],
  [
    "js/timeline.js",
    "326"
  ],
  [
    "js/register.js",
    "326"
  ],
  [
    "js/login.js",
    "326"
  ],
  [
    "js/onboarding.js",
    "326"
  ],
  [
    "js/profile.js",
    "326"
  ],
  [
    "js/upgrade.js",
    "326"
  ],
  [
    "js/ai.js",
    "326"
  ],
  [
    "js/plan.js",
    "326"
  ],
  [
    "js/artists.js",
    "326"
  ],
  [
    "js/expenses.js",
    "326"
  ],
  [
    "js/vehicle.js",
    "326"
  ],
  [
    "js/location.js",
    "326"
  ],
  [
    "js/calview.js",
    "326"
  ],
  [
    "js/ads.js",
    "326"
  ],

  [
    "js/sos.js",
    "326"
  ],
  [
    "js/talk.js",
    "326"
  ],
  [
    "js/supabase-client.js",
    "326"
  ],
  [
    "js/app.js",
    "326"
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
      // 첫 화면(index)은 브라우저 저장본(최대 10분)을 쓰지 말고 서버에 새 버전이 있는지 꼭 확인 → 업데이트가 바로 보이게
      const response = navigation ? await fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }) : await fetch(request);
      if (navigation && response.redirected) return Response.redirect(response.url, 302);   // 주소를 옮겨도 설치한 앱이 막히지 않게
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
    data: { room_id: data.room_id || '', url: data.url || '' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const roomId = (event.notification.data && event.notification.data.room_id) || '';
  const target = (event.notification.data && event.notification.data.url) || '';
  // 예약 알림(출발 15분 전·내일 일정): 알림에 담긴 주소로 연다 (출발 알림은 ?go=next → 바로 길안내)
  if (target && target.startsWith(SCOPE_URL.origin)) {
    event.waitUntil((async () => {
      const wins = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter(w => w.url.startsWith(SCOPE_URL.href) && !/\/admin\.html/.test(new URL(w.url).pathname));
      if (wins[0] && 'navigate' in wins[0]) { try { await wins[0].focus(); await wins[0].navigate(target); return; } catch (e) { } }
      await self.clients.openWindow(target);
    })());
    return;
  }
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
