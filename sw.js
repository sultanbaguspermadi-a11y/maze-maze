// Offline app shell (KM-102). Precache list comes from precache.json (built by tools/build-precache.mjs).
// Strategy: cache-first for the shell; the cache name embeds a content hash so a new build replaces the old cache.
// Saves live in localStorage and are never touched here.
const META = fetch('./precache.json', { cache: 'no-store' }).then((r) => r.json());

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const m = await META, cache = await caches.open('km-' + m.version);
    await cache.addAll(m.files); await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const m = await META;
    for (const k of await caches.keys()) if (k.startsWith('km-') && k !== 'km-' + m.version) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const m = await META.catch(() => null);
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try { return await fetch(e.request); } catch { return (m && await caches.match('./index.html')) || Response.error(); }
  })());
});
