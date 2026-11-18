/*
 * Service worker: precaches the app and all photographs so teaching works offline.
 * When you change ANY file, bump CACHE_VERSION so iPads pick up the new version.
 */
var CACHE_VERSION = "v1.45.0";
var CACHE_NAME = "locations-ei-" + CACHE_VERSION;

importScripts("js/data.js");

var APP_SHELL = [
  "./",
  "index.html",
  "css/styles.css",
  "js/data.js",
  "js/engine.js",
  "js/app.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png"
];

function photoUrls() {
  var urls = [];
  self.LOC_DATA.LOCATIONS.forEach(function (loc) {
    self.LOC_DATA.PHOTOS[loc.id].forEach(function (p) { urls.push(p.file); });
  });
  return urls;
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      // The app shell must cache completely; photos are cached one by one so a
      // single missing file doesn't block installation.
      return cache.addAll(APP_SHELL.map(function (u) { return new Request(u, { cache: "reload" }); }))
        .then(function () {
          return Promise.all(photoUrls().map(function (u) {
            return fetch(new Request(u, { cache: "reload" })).then(function (res) {
              if (res.ok) return cache.put(u, res);
            }).catch(function () {});
          }));
        });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k.indexOf("locations-ei-") === 0 && k !== CACHE_NAME) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Cache first (fast, offline), fall back to network and keep a copy.
  event.respondWith(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res.ok && res.type === "basic") cache.put(req, res.clone());
          return res;
        }).catch(function () {
          if (req.mode === "navigate") return cache.match("index.html");
          return Response.error();
        });
      });
    })
  );
});
