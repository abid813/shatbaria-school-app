/* সার্ভিস ওয়ার্কার — অফলাইনে অ্যাপ খোলা রাখে */
const CACHE = 'satbaria-v2';
const APP_SHELL = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/firebase-config.js',
  './manifest.webmanifest',
  './assets/logo.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firestore/Google API কল ক্যাশ করা হবে না — সরাসরি নেটওয়ার্ক
  if (url.hostname.includes('googleapis.com') && !url.hostname.includes('gstatic') && !url.hostname.includes('fonts')) {
    return;
  }

  // পাতা (navigation): আগে নেট, না পেলে ক্যাশ — নতুন তথ্য যেন আসে
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // স্ট্যাটিক + CDN (Firebase SDK, ফন্ট): আগে ক্যাশ, না থাকলে নেট থেকে এনে ক্যাশে রাখো
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && (url.origin === location.origin || url.hostname.includes('gstatic.com') || url.hostname.includes('fonts.g'))) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
