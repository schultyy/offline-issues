'use strict';

var CACHE_NAME = 'my-site-cache-v1';

var urlsToCache = [
  '/',
  'css/bootstrap.css',
  'css/app.css',
  'js/lodash.js',
  'js/jquery-2.2.4.js',
  'js/bootstrap.js',
  'js/github.bundle.min.js',
  'js/pouchdb-5.4.0.js',
  'js/pouchdb.all-dbs.js',
  'js/markdown.js',
  'js/app.js'
];

self.addEventListener('install', function(event) {
  // pre cache a load of stuff:
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  )
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});