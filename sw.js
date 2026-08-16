const CACHE = 'creg-v34';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // 서버 동기화(Supabase) 요청과 GET 이외 요청은 캐시를 건너뜁니다
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  // 새 버전 확인 파일은 절대 캐시하지 않습니다 (캐시되면 새 버전을 영영 못 봅니다)
  if (u.pathname.endsWith('/version.json')) return;
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
// v3.4 deploy 2026-08-16 (부화판정 단일화 · 이름 수정 · 급여 날짜)
