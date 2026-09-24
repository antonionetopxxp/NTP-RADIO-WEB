const CACHE = "ntp-radio-os-v2";

const CORE = [
  "./",
  "./index.html",
  "./style.css",
  "./galaxy-theme.css",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./config/radio.json"
];

/* ================================
   INSTALAÇÃO
================================ */

self.addEventListener("install", event => {

  event.waitUntil(

    caches
      .open(CACHE)
      .then(cache => cache.addAll(CORE))
      .then(() => self.skipWaiting())

  );

});


/* ================================
   ATIVAÇÃO
================================ */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches
      .keys()
      .then(keys => {

        return Promise.all(

          keys
            .filter(key => key !== CACHE)
            .map(key => caches.delete(key))

        );

      })
      .then(() => self.clients.claim())

  );

});


/* ================================
   FETCH
================================ */

self.addEventListener("fetch", event => {

  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);


  /* ================================
     ZENO.FM
     NÃO INTERCEPTAR
  ================================= */

  if (
    url.hostname === "stream.zeno.fm" ||
    url.hostname === "api.zeno.fm"
  ) {
    return;
  }


  /* ================================
     REDE PRIMEIRO
     CACHE COMO FALLBACK
  ================================= */

  event.respondWith(

    fetch(request)
      .catch(() => caches.match(request))

  );

});
