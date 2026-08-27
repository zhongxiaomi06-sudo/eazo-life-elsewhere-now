const CACHE = 'elsewhere-now-v3';
const SHELL = './';
const CORE = ['./earth-at-night.webp', './iss-night-pulse.mp4'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(SHELL, { cache: 'reload' });
    const html = await response.clone().text();
    const assets = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
      .map(match => new URL(match[1], self.location.href).href)
      .filter(url => url.startsWith(self.location.origin));
    await cache.put(SHELL, response);
    await cache.addAll([...assets, ...CORE]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => event.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) (await caches.open(CACHE)).put(SHELL, response.clone());
        return response;
      } catch {
        return (await caches.match(SHELL)) || Response.error();
      }
    })());
    return;
  }
  const refresh = fetch(event.request).then(async response => {
    if (response.ok) await (await caches.open(CACHE)).put(event.request, response.clone());
    return response;
  });
  event.waitUntil(refresh.then(() => undefined).catch(() => undefined));
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true, ignoreVary: true });
    if (cached) return cached;
    try { return await refresh; }
    catch { return Response.error(); }
  })());
});
