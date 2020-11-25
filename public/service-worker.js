console.log("Hello! This is service worker!");

const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "manifest.webmanifest",
    "/index.js",
    "/db.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png"
];

const STATIC = "static-cache-v2";
const DATA = "data-cache-v1";

//install
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
        .open(STATIC)
        .then(cache => {
            console.log("Your files were pre-cached successfully");
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== STATIC && key !== DATA) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// fetch
self.addEventListener("fetch", function(event) {
    // cache successful request to the API
    if (event.request.url.includes("/api")) {
        event.respondWith(
            caches.open(DATA).then(cache => {
                return fetch(event.request)
                .then(response => {
                    // IF the response was good, clone it and store it in the cache.
                    if (response.status === 200) {
                        cache.put(event.request.url, response.clone());
                    }

                    return response;
                })
                .catch(err => {
                    //network request failed, try to get it from the cache.
                    return cache.match(event.request);
                });
            }).catch(err => console.log(err))
        );

        return;
    }

    // if the request is not for the API, serve static assets using "offline-first" approach.
    event.respondWith(
        caches.open(STATIC).then(cache => {
            return cache.match(event.request).then(response => {
                return response || fetch(event.request);
            });
        })
    );
});