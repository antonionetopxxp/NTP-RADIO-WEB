const CACHE = 'ntp-radio-v2';

const PRECACHE = [
  './',
  './index.html',
  './style.css',
  './galaxy-theme.css',
  './script.js',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './whatsapp.svg',
  './instagram.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  /*
   * Não interferir no streaming da rádio
   * nem na API de metadados do Zeno.
   */
  if (
    url.hostname === 'stream.zeno.fm' ||
    url.hostname === 'api.zeno.fm' ||
    url.hostname.endsWith('.surfernetwork.com')
  ) {
    return;
  }

  /*
   * Arquivos do próprio site.
   */
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => {
          if (cached) {
            return cached;
          }

          return fetch(event.request).then(response => {
            if (response && response.ok) {
              const copy = response.clone();

              caches.open(CACHE).then(cache => {
                cache.put(event.request, copy);
              });
            }

            return response;
          });
        })
    );

    return;
  }

  /*
   * Recursos externos.
   */
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
