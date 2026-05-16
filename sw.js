/* ==========================================================================
   SAINTIFIKS: SERVICE WORKER
   Versi cache: v2
   PENTING: Naikkan versi CACHE_NAME setiap kali file CSS/JS berubah.
   PERBAIKAN: Bug #1 (skipWaiting race condition) + Bug #2 (offline fallback)
   ========================================================================== */

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
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting()) // FIXED #1: dipanggil hanya setelah cache selesai
    );
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

    // Strategi Network-First untuk navigasi HTML
    // FIXED #2: jika halaman spesifik tidak ada di cache saat offline,
    // fallback ke /index.html daripada mengembalikan undefined (yang menyebabkan error browser)
    if (request.mode === 'navigate' ||
        (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match(request).then((cached) =>
                    cached || caches.match('/index.html') // FIXED #2: fallback eksplisit
                )
            )
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
