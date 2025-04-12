const CACHE_NAME="2025-04-12 12:00",urlsToCache=["/photo-scanner/","/photo-scanner/en/","/photo-scanner/coi-serviceworker.js","/photo-scanner/index.js","/photo-scanner/img/scanner.svg","/photo-scanner/img/loading.gif","/photo-scanner/camera.mp3","/photo-scanner/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/wasm-feature-detect@1.8.0/dist/umd/index.min.js"];importScripts("https://cdn.jsdelivr.net/npm/wasm-feature-detect@1.8.0/dist/umd/index.min.js");async function getOpenCVPath(){const e=await wasmFeatureDetect.simd(),t=self.crossOriginIsolated&&await wasmFeatureDetect.threads();return e&&t?"/photo-scanner/opencv/threaded-simd/opencv_js.js":e?"/photo-scanner/opencv/simd/opencv_js.js":t?"/photo-scanner/opencv/threads/opencv_js.js":"/photo-scanner/opencv/wasm/opencv_js.js"}async function addOpenCVPaths(){const e=await getOpenCVPath();urlsToCache.push(e),urlsToCache.push(e.slice(0,-3)+".wasm")}addOpenCVPaths(),self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})