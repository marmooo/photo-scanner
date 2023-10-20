const CACHE_NAME = "2023-08-28 08:50";
const urlsToCache = [
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
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",
  "https://cdn.jsdelivr.net/npm/dropbox@10.26.0/dist/Dropbox-sdk.min.js",
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.12.0/dist/tf.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});
