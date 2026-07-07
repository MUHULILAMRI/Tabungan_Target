// ===================================================
//  Tabungin Service Worker - PWA Offline Support
//  Cache semua aset agar bisa digunakan offline
// ===================================================

const CACHE_NAME = 'tabungin-v1.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// Install: cache semua aset penting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Beberapa aset gagal di-cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first dengan fallback cache (agar data selalu fresh dari cloud)
self.addEventListener('fetch', (event) => {
  // Jangan cache request ke Google Apps Script API
  if (event.request.url.includes('script.google.com')) {
    return; // Biarkan request API langsung ke network
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Simpan ke cache jika sukses
        if (response && response.status === 200 && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Jika offline, ambil dari cache
        return caches.match(event.request).then((cached) => {
          return cached || new Response(
            '<h1>Tidak ada koneksi internet</h1><p>Data terakhir ditampilkan dari cache lokal.</p>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
  );
});
