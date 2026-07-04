const CACHE_NAME = 'educore-v2';
const ASSETS = [
    './',
    './index.html',
    './login.html',
    './signup.html',
    './dashboard.html',
    './css/styles.css?v=2',
    './css/dashboard.css?v=2',
    './js/auth.js',
    './js/dashboard.js',
    './js/pwa.js',
    './manifest.json'
];

// Install Event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS).catch(err => {
                console.warn('Failed to cache some assets, continuing anyway', err);
            });
        })
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

// Activate Event (Cleanup old caches)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    // Tell the active service worker to take control of the page immediately.
    self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', event => {
    // Only intercept basic GET requests to the origin, ignore Supabase API calls
    if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(response => {
            // Cache hit - return response
            if (response) {
                return response;
            }
            return fetch(event.request);
        })
    );
});
