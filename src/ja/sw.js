var CACHE_NAME = "2022-09-11 08:49";
var urlsToCache = [
  "/photo-scanner/",
  "/photo-scanner/en/",
  "/photo-scanner/js/opencv.js",
  "/photo-scanner/js/index.js",
  "/photo-scanner/js/worker.js",
  "/photo-scanner/img/scanner.svg",
  "/photo-scanner/img/loading.gif",
  "/photo-scanner/denoise/model.json",
  "/photo-scanner/denoise/group1-shard1of1.bin",
  "/photo-scanner/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/dropbox@10.26.0/dist/Dropbox-sdk.min.js",
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.20.0/dist/tf.min.js",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }),
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
