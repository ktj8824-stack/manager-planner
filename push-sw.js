/* 본사 관리자 화면 전용 알림 서비스워커: 화면 캐시는 하지 않고 푸시 알림만 처리합니다. */
const SCOPE_URL = new URL(self.registration.scope);
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', () => { /* 앱용 메시지(SET_OPEN_PATH 등)는 여기서 쓰지 않음 */ });

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
    requireInteraction: urgent,
    data: { room_id: data.room_id || '' }
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const roomId = (event.notification.data && event.notification.data.room_id) || '';
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (w.url.startsWith(SCOPE_URL.href) && 'focus' in w) {
        await w.focus();
        if (roomId) w.postMessage({ type: 'OPEN_CHAT', roomId });
        return;
      }
    }
    // 관리자 화면 주소: 배포본은 index.html, 개발본은 admin.html
    const path = self.location.pathname.includes('/manager-planner-web/') ? './' : 'admin.html';
    await self.clients.openWindow(new URL(path + (roomId ? '?chat=' + encodeURIComponent(roomId) : ''), SCOPE_URL).href);
  })());
});

self.addEventListener('pushsubscriptionchange', event => {
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
    wins.forEach(w => w.postMessage({ type: 'PUSH_RESUBSCRIBE' }));
  }));
});
