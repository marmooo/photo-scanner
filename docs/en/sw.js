var CACHE_NAME="2022-10-16 10:30",urlsToCache=["/photo-scanner/","/photo-scanner/en/","/photo-scanner/js/opencv.js","/photo-scanner/js/index.js","/photo-scanner/js/worker.js","/photo-scanner/img/scanner.svg","/photo-scanner/img/loading.gif","/photo-scanner/denoise/model.json","/photo-scanner/denoise/group1-shard1of1.bin","/photo-scanner/favicon/favicon.svg","https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css","https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js","https://cdn.jsdelivr.net/npm/dropbox@10.26.0/dist/Dropbox-sdk.min.js","https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.0.0/dist/tf.min.js"];self.addEventListener("install",function(a){a.waitUntil(caches.open(CACHE_NAME).then(function(a){return a.addAll(urlsToCache)}))}),self.addEventListener("fetch",function(a){a.respondWith(caches.match(a.request).then(function(b){return b||fetch(a.request)}))}),self.addEventListener("activate",function(a){var b=[CACHE_NAME];a.waitUntil(caches.keys().then(function(a){return Promise.all(a.map(function(a){if(b.indexOf(a)===-1)return caches.delete(a)}))}))})