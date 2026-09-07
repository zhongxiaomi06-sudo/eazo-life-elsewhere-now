/* Elsewhere, Now — production offline service worker (plain JS)
 *
 * 策略：
 *  - 导航请求（index.html）：网络优先，失败回退缓存（stale-while-revalidate）。
 *    保证预览永远拿到最新构建，同时离线时可打开应用外壳。
 *  - hashed JS/CSS：缓存优先（文件名带内容哈希，天然不可变）。
 *  - 明信片 / 地球夜景 / 轨道影片：运行时缓存优先 + 后台填充，明信片数量受限（LRU）。
 *  - 每次激活清理旧版本缓存，避免磁盘膨胀与旧内容锁死。
 *
 * 版本号对应 apps/life-elsewhere-now/content/data-manifest.json 的 buildVersion。
 * 发布新构建时必须递增该值。
 */
const VERSION = '1.0.0-rc.2';
const SHELL_CACHE = `life-elsewhere-shell-${VERSION}`;
const MEDIA_CACHE = `life-elsewhere-media-${VERSION}`;
const POSTCARD_CACHE = `life-elsewhere-postcards-${VERSION}`;
const MAX_POSTCARDS = 8;

const base = () => new URL('./', self.registration.scope);

/** 从已发布的 index.html 中解析出带内容哈希的 JS/CSS 资源。 */
const shellAssets = async () => {
  const root = base();
  const htmlUrl = new URL('./index.html', root).href;
  const assets = [
    root.href,
    htmlUrl,
    new URL('./manifest.webmanifest', root).href,
    new URL('./icons/icon-192.png', root).href,
    new URL('./icons/icon-512.png', root).href,
    new URL('./earth-at-night.webp', root).href,
  ];
  try {
    const response = await fetch(htmlUrl, { cache: 'reload' });
    if (!response.ok) return assets;
    const html = await response.text();
    const pattern = /(?:src|href)="([^"]+\.(?:js|css))"/g;
    let match = null;
    while ((match = pattern.exec(html)) !== null) {
      const value = match[1];
      if (!value || /^https?:/.test(value)) continue;
      assets.push(new URL(value, htmlUrl).href);
    }
  } catch {
    /* 离线安装：仅缓存已知外壳资源。 */
  }
  return assets;
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled((await shellAssets()).map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, MEDIA_CACHE, POSTCARD_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

/** 缓存优先；未命中则网络获取并缓存；超出上限时按最久未用淘汰。 */
const cacheFirst = async (request, cacheName, maxEntries = Infinity) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) {
    if (maxEntries !== Infinity) {
      await cache.put(request, hit.clone()); // 刷新为最新，保持 LRU 顺序
      await trimCache(cache, maxEntries);
    }
    return hit;
  }
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    if (maxEntries !== Infinity) await trimCache(cache, maxEntries);
  }
  return response;
};

/** 超出上限时删除最旧条目（cache.keys() 按插入/更新顺序返回）。 */
const trimCache = async (cache, maxEntries) => {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    const stale = keys.slice(0, keys.length - maxEntries);
    await Promise.all(stale.map((key) => cache.delete(key)));
  }
};

/** 网络优先；失败回退缓存。用于导航请求与经常变化的外壳入口。 */
const networkFirst = async (request) => {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    const hit = await cache.match(request, { ignoreSearch: true });
    if (hit) return hit;
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 跨域一律不拦截

  const path = url.pathname;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (/\.(?:js|css)$/.test(path)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  if (path.includes('/postcards/') && path.endsWith('.png')) {
    event.respondWith(cacheFirst(request, POSTCARD_CACHE, MAX_POSTCARDS));
    return;
  }

  if (/\.(?:webp|mp4)$/.test(path) && (path.includes('earth-at-night') || path.includes('iss-night-pulse'))) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE));
    return;
  }

  if (path.endsWith('/manifest.webmanifest') || path.includes('/icons/')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
  }
});
