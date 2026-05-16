// PERBAIKAN Bug #11: Versi cache dinaikkan dari v1 ke v2
// PENTING: Setiap kali Anda mengubah file CSS atau JS apapun,
// naikkan versi ini (v2 → v3 → v4, dst.) agar pengguna mendapat
// versi terbaru dan tidak terjebak di cache lama.

const CACHE_NAME = 'saintifiks-cache-v2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/tentang.html',
    '/css/saintifiks.css',
    '/js/api.js',
    '/js/auth.js',
    '/js/saintifiks-charts.js'
];

// Instalasi & Pra-penyimpanan (Pre-caching)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Pembersihan Cache Usang
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME)
                          .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Strategi Intersepsi Jaringan
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Abaikan request POST (seperti pengiriman API ke GAS)
    if (request.method !== 'GET') return;

    // Larangan Keras: Jangan pernah menyimpan data dinamis API Google Apps Script ke dalam cache
    if (request.url.includes('script.google.com')) {
        event.respondWith(fetch(request));
        return;
    }

    // Strategi Network-First untuk navigasi HTML (memastikan artikel selalu terbaru)
    if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(request).catch(() => caches.match(request))
        );
        return;
    }

    // Strategi Cache-First untuk Aset Statis (CSS, JS, Gambar)
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            return cachedResponse || fetch(request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});
