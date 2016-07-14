'use strict';

var CACHE_NAME = 'offline-issues-cache-v2';

var PLACEHOLDER_SVG = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 {{w}} {{h}}'><defs><symbol id='a' viewBox='0 0 90 66' opacity='0.3'><path d='M85 5v56H5V5h80m5-5H0v66h90V0z'/><circle cx='18' cy='20' r='6'/><path d='M56 14L3739l-8-6-17 23h67z'/></symbol></defs><use xlink:href='#a' width='20%' x='40%'/></svg>";

var urlsToCache = [
  './',
  'css/bootstrap.css',
  'css/app.css',
  'js/lodash.js',
  'js/jquery-2.2.4.js',
  'js/bootstrap.js',
  'js/github.bundle.min.js',
  'js/pouchdb-5.4.5.js',
  'js/pouchdb.all-dbs.js',
  'js/moment.min.js',
  'js/marked.js',
  'js/commentWorker.js',
  'js/app.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return fetch(event.request)
              .then(function(response) {
                cache.put(event.request, response.clone());
                return response;
              })
              .catch(function(err) {
                if (event.request.headers.get('Accept').indexOf('image') !== -1) {
                  return new Response(PLACEHOLDER_SVG, { headers: { 'Content-Type': 'image/svg+xml' }});
                }
              });
    })
  );
});