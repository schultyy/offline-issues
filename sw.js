'use strict';

var CACHE_NAME = 'offline-issues-cache-v1';

var urlsToCache = [
  '/',
  'css/bootstrap.css',
  'css/app.css',
  'js/lodash.js',
  'js/jquery-2.2.4.js',
  'js/bootstrap.js',
  'js/github.bundle.min.js',
  'js/pouchdb-5.4.5.js',
  'js/pouchdb.all-dbs.js',
  'js/markdown.js',
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
      return fetch(event.request).then(function(response) {
        cache.put(event.request, response.clone());
        return response;
      });
    })
  );
});