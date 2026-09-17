const CACHE = "ntp-radio-v2";

const PRECACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./galaxy-theme.css",
  "./script.js",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./whatsapp.svg",
  "./instagram.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE)
            .map((key) => caches.delete(key))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") {
    return;
  }

  /*
   * Nunca colocar o stream da rádio no cache.
   */
  if (
    url.hostname === "stream.zeno.fm" ||
    url.hostname === "api.zeno.fm" ||
    url.hostname.endsWith(".surfernetwork.com")
  ) {
    return;
  }

  /*
   * Arquivos do próprio site:
   * primeiro tenta rede;
   * se estiver offline, usa cache.
   */
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();

          caches
            .open(CACHE)
            .then((cache) => {
              cache.put(event.request, copy);
            });

          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );

    return;
  }

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
