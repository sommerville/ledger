const CACHE_NAME = 'Ledger v14.31';
const ASSETS = [
  './',
  './index.html',
  './ledger-desktop.html',
  './shared.js',
  './manifest.json',
  './favicon.ico',
  './icons/app/icon.png',
  './icons/app/icon-192.png',
  './icons/app/icon-512-maskable.png',
  './icons/app/icon-192-maskable.png',
  './images/banner.webp',
  './images/banner-large.webp',
  './icons/data.png',
  './icons/log.png',
  './icons/settings.png',
  './icons/income.png',
  './icons/investments.png',
  './icons/expenses.png',
  './icons/net-worth.png',
  './icons/fire.png',
  './icons/summary.png',
  './icons/calculator.png',
  './icons/compound-interest.png',
  './icons/budget.png',
  './icons/backtest.png',
  './icons/retirement.png',
  './icons/debt.png',
  './icons/home-value.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
