const CACHE_NAME = 'Ledger v14.4 12';
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
  './icons/home/backtest.png',
  './icons/home/budget.png',
  './icons/home/calculator.png',
  './icons/home/compound-interest.png',
  './icons/home/data.png',
  './icons/home/debt.png',
  './icons/home/expenses.png',
  './icons/home/fire.png',
  './icons/home/home-value.png',
  './icons/home/income.png',
  './icons/home/investments.png',
  './icons/home/log.png',
  './icons/home/net-worth.png',
  './icons/home/retirement.png',
  './icons/home/settings.png',
  './icons/home/summary.png',
  './icons/home/ret-plan.png'
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
