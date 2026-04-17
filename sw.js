const CACHE = 'fuel-tracker-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(
        ASSETS.map(url => c.add(url).catch(() => {}))
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => k !== CACHE ? caches.delete(k) : null)
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {

      // Siempre intenta traer index actualizado
      if (e.request.url.includes('index.html') || e.request.url === location.origin + '/') {
        return fetch(e.request)
          .then(res => {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
            return res;
          })
          .catch(() => cached);
      }

      // resto: cache first
      if (cached) return cached;

      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});