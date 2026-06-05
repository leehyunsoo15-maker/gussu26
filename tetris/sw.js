// 네트워크 우선 전략: 항상 최신 파일을 가져오고, 오프라인일 때만 캐시 사용
const CACHE_NAME = 'blockgame-v3';
const ASSETS = [
    './',
    './index.html',
    './battle.html',
    './manifest.json',
  ];

self.addEventListener('install', e => {
    e.waitUntil(
          caches.open(CACHE_NAME).then(cache => {
                  cache.add('https://fonts.googleapis.com/css2?family=Jua&family=Black+Han+Sans&display=swap').catch(()=>{});
                  return cache.addAll(ASSETS);
          })
        );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
          caches.keys().then(keys =>
                  Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
                                 )
        );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    // HTML 파일은 항상 네트워크 우선 (최신 버전 보장)
                        if (e.request.mode === 'navigate' || e.request.destination === 'document') {
                              e.respondWith(
                                      fetch(e.request).then(res => {
                                                if (res && res.status === 200) {
                                                            const clone = res.clone();
                                                            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                                                }
                                                return res;
                                      }).catch(() => caches.match(e.request))
                                    );
                              return;
                        }
    // JS/CSS 등 기타 파일도 네트워크 우선
                        e.respondWith(
                              fetch(e.request).then(res => {
                                      if (!res || res.status !== 200 || res.type === 'opaque') return res;
                                      const clone = res.clone();
                                      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
                                      return res;
                              }).catch(() => caches.match(e.request))
                            );
});
