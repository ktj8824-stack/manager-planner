/* App-shell cache only. HQ admin pages/scripts, APIs and third-party requests are never intercepted. Shared admin-data.js is an app dependency. */
const CACHE_PREFIX = 'managerplanner-app:' + encodeURIComponent(self.registration.scope) + ':';
const CACHE_NAME = CACHE_PREFIX + 'v206-css24-js206';
const LEGACY_CACHES = ["managerplanner-v103-cache", CACHE_PREFIX + 'v182-css24-js181', CACHE_PREFIX + 'v183-css24-js183', CACHE_PREFIX + 'v184-css24-js184', CACHE_PREFIX + 'v185-css24-js185', CACHE_PREFIX + 'v186-css24-js186', CACHE_PREFIX + 'v187-css24-js187', CACHE_PREFIX + 'v188-css24-js188', CACHE_PREFIX + 'v189-css24-js189', CACHE_PREFIX + 'v190-css24-js190', CACHE_PREFIX + 'v191-css24-js191', CACHE_PREFIX + 'v192-css24-js192', CACHE_PREFIX + 'v193-css24-js193', CACHE_PREFIX + 'v194-css24-js194', CACHE_PREFIX + 'v195-css24-js195', CACHE_PREFIX + 'v196-css24-js196', CACHE_PREFIX + 'v197-css24-js197', CACHE_PREFIX + 'v198-css24-js198', CACHE_PREFIX + 'v199-css24-js199', CACHE_PREFIX + 'v200-css24-js200', CACHE_PREFIX + 'v201-css24-js201', CACHE_PREFIX + 'v202-css24-js202', CACHE_PREFIX + 'v203-css24-js203', CACHE_PREFIX + 'v204-css24-js204', CACHE_PREFIX + 'v205-css24-js205'];
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
    "24"
  ],
  [
    "css/base.css",
    "24"
  ],
  [
    "css/components.css",
    "24"
  ],
  [
    "css/calendar.css",
    "24"
  ],
  [
    "css/home.css",
    "24"
  ],
  [
    "css/timeline.css",
    "24"
  ],
  [
    "css/register.css",
    "24"
  ],
  [
    "css/login.css",
    "24"
  ],
  [
    "css/profile.css",
    "24"
  ],
  [
    "css/upgrade.css",
    "24"
  ],
  [
    "js/icons.js",
    "206"
  ],
  [
    "js/admin-data.js",
    "206"
  ],
  [
    "js/data.js",
    "206"
  ],
  [
    "js/api.js",
    "206"
  ],
  [
    "js/utils.js",
    "206"
  ],
  [
    "js/home.js",
    "206"
  ],
  [
    "js/timeline.js",
    "206"
  ],
  [
    "js/register.js",
    "206"
  ],
  [
    "js/login.js",
    "206"
  ],
  [
    "js/onboarding.js",
    "206"
  ],
  [
    "js/profile.js",
    "206"
  ],
  [
    "js/upgrade.js",
    "206"
  ],
  [
    "js/supabase-client.js",
    "206"
  ],
  [
    "js/app.js",
    "206"
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

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
