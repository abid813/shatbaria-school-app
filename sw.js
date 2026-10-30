/* সার্ভিস ওয়ার্কার — অফলাইনে অ্যাপ খোলা রাখে + নতুন ভার্সন আসলে আপডেট হয় */
const CACHE = 'satbaria-v3';
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
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
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

  // পাতা (navigation): সরাসরি নেট থেকে আনো, সাথে cache আপডেট করো
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // app.js / styles.css / firebase-config.js / manifest — নেট থেকে আনো, পাশাপাশি cache আপডেট
  const isCoreAsset = [
    '/js/app.js',
    '/css/styles.css',
    '/js/firebase-config.js',
    '/manifest.webmanifest',
    '/sw.js'
  ].some(p => url.pathname.endsWith(p));

  if (isCoreAsset) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // অন্যান্য স্ট্যাটিক + CDN (Firebase SDK, ফন্ট): আগে ক্যাশ, না থাকলে নেট থেকে এনে ক্যাশে রাখো
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
