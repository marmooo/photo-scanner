const CACHE_NAME = "2025-04-08 09:00";
const urlsToCache = [
  "/photo-scanner/",
  "/photo-scanner/en/",
  "/photo-scanner/coi-serviceworker.js",
  "/photo-scanner/index.js",
  "/photo-scanner/img/scanner.svg",
  "/photo-scanner/img/loading.gif",
  "/photo-scanner/camera.mp3",
  "/photo-scanner/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/wasm-feature-detect@1.8.0/dist/umd/index.min.js",
];

importScripts(
  "https://cdn.jsdelivr.net/npm/wasm-feature-detect@1.8.0/dist/umd/index.min.js",
);

async function getOpenCVPath() {
  const simdSupport = await wasmFeatureDetect.simd();
  const threadsSupport = self.crossOriginIsolated &&
    await wasmFeatureDetect.threads();
  if (simdSupport && threadsSupport) {
    return "/photo-scanner/opencv/threaded-simd/opencv_js.js";
  } else if (simdSupport) {
    return "/photo-scanner/opencv/simd/opencv_js.js";
  } else if (threadsSupport) {
    return "/photo-scanner/opencv/threads/opencv_js.js";
  } else {
    return "/photo-scanner/opencv/wasm/opencv_js.js";
  }
}

async function addOpenCVPaths() {
  const opencvPath = await getOpenCVPath();
  urlsToCache.push(opencvPath);
  urlsToCache.push(opencvPath.slice(0, -3) + ".wasm");
}

addOpenCVPaths();

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
