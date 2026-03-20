// Portfolio v16 — Service Worker
// Cache-first strategy: serves from cache, updates in background

const CACHE_NAME = 'portfolio-v17-v2';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon.png',
    './icon-192.png',
    // Chart.js and other CDN dependencies cached on first load
];

// Install: cache all core assets immediately
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// Activate: delete old caches
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: cache-first, fallback to network, cache new resources
self.addEventListener('fetch', e => {
    // Only handle GET requests
    if (e.request.method !== 'GET') return;

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) {
                // Serve from cache immediately
                // Also fetch updated version in background for next time
                const fetchUpdate = fetch(e.request).then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                    }
                    return response;
                }).catch(() => {});
                return cached;
            }

            // Not in cache — fetch from network and cache it
            return fetch(e.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                return response;
            }).catch(() => {
                // Network failed and nothing in cache — return offline fallback
                return caches.match('./index.html');
            });
        })
    );
});
