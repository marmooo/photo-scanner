const CACHE_NAME="2024-03-27 00:10",urlsToCache=["/photo-scanner/","/photo-scanner/en/","/photo-scanner/opencv.js","/photo-scanner/index.js","/photo-scanner/worker.js","/photo-scanner/img/scanner.svg","/photo-scanner/img/loading.gif","/photo-scanner/denoise/model.json","/photo-scanner/denoise/group1-shard1of1.bin","/photo-scanner/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/dropbox@10.26.0/dist/Dropbox-sdk.min.js","https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.16.0/dist/tf.min.js"];self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE_NAME).then(e=>e.addAll(urlsToCache)))}),self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(t=>t||fetch(e.request)))}),self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(e=>Promise.all(e.filter(e=>e!==CACHE_NAME).map(e=>caches.delete(e)))))})