var CACHE_NAME = '2020-05-11 16:50';
var urlsToCache = [
  '/photo-scanner/js/opencv.js',
  '/photo-scanner/js/index.js',
  '/photo-scanner/js/worker.js',
  '/photo-scanner/img/scanner.svg',
  '/photo-scanner/img/loading.gif',
  '/photo-scanner/denoise/model.json',
  '/photo-scanner/denoise/group1-shard1of1.bin',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.slim.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.16.1/umd/popper.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.4.1/js/bootstrap.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/dropbox.js/4.0.30/Dropbox-sdk.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.4.1/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs/dist/tf.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches
    .open(CACHE_NAME)
    .then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', function(event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
