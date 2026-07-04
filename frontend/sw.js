const CACHE_NAME = 'educore-v1';
const ASSETS = [
    './',
    './index.html',
    './login.html',
    './signup.html',
    './dashboard.html',
    './css/styles.css',
    './css/dashboard.css',
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
