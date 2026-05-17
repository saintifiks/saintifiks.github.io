/* ==========================================================================
   SAINTIFIKS: SERVICE WORKER
   Versi cache: v3
   PENTING: Naikkan CACHE_NAME setiap kali file CSS/JS/HTML berubah.
   VERSI REMEDIASI: F3 (clients.claim dalam Promise chain) + F4 (pre-cache artikel & font)
   ========================================================================== */

const CACHE_NAME = 'saintifiks-cache-v4';

// DIPERBAIKI F4: Tambahkan halaman artikel dan file JS baru (article.js) ke pre-cache.
// Font dari Google Fonts tidak dapat dipre-cache via addAll karena CORS,
// namun akan dicache secara dinamis pada kunjungan pertama via fetch handler di bawah.
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/tentang.html',
    '/css/saintifiks.css',
    '/js/api.js',
    '/js/auth.js',
    '/js/saintifiks-charts.js',
    '/js/article.js',          // DIPERBAIKI F4: file JS baru
    '/artikel/template.html',  // DIPERBAIKI F4: halaman artikel utama
    '/manifest.json'
];

// Instalasi & Pra-penyimpanan (Pre-caching)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Pembersihan Cache Usang
self.addEventListener('activate', (event) => {
    // DIPERBAIKI F3: self.clients.claim() sekarang berada DI DALAM Promise chain
    // event.waitUntil() — memastikan klaim hanya terjadi SETELAH cache lama selesai dibersihkan.
    // Sebelumnya, claim() dipanggil di luar Promise chain, memungkinkan klien diklaim
    // sebelum cache baru siap.
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim()) // DIPERBAIKI F3: di dalam .then()
    );
});

// Strategi Intersepsi Jaringan
self.addEventListener('fetch', (event) => {
    const request = event.request;

    // Abaikan request POST
    if (request.method !== 'GET') return;

    // Larangan Keras: Jangan pernah cache data dinamis API
    if (request.url.includes('script.google.com') || request.url.includes('oauth2.googleapis.com')) {
        event.respondWith(fetch(request));
        return;
    }

    // DIPERBAIKI F4: Strategi Cache-First untuk font Google (fonts.gstatic.com)
    // Font di-cache secara dinamis pada kunjungan pertama, tersedia offline setelahnya.
    if (request.url.includes('fonts.gstatic.com') || request.url.includes('fonts.googleapis.com')) {
        event.respondWith(
            caches.match(request).then((cached) => {
                return cached || fetch(request).then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return;
    }

    // Strategi Network-First untuk navigasi HTML
    if (request.mode === 'navigate' ||
        (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(request).catch(() =>
                caches.match(request).then((cached) =>
                    cached || caches.match('/index.html')
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
