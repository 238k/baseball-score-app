const CACHE_NAME = 'baseball-score-v1';

const APP_SHELL = [
  '/',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Next.js 内部リクエスト・API は常にネットワーク優先（キャッシュしない）
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // ナビゲーション（HTML ページ）: ネットワーク → オフラインフォールバック
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/offline').then((res) => res ?? Response.error())
      )
    );
    return;
  }

  // その他の静的アセット: キャッシュ優先
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
