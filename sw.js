// ★ 이 번호는 화면 버전과 따로 갑니다. 화면 버전은 1.7 → 1.0 으로 되돌렸지만
//    캐시 이름은 올라가기만 합니다(v17 → v18). 옛 이름을 다시 쓰면 폰에 남아 있던
//    헌 파일 묶음을 새것으로 착각해서 화면이 안 바뀝니다.
const CACHE = 'creg-v20';

// 화면을 그리는 데 꼭 필요한 파일 — 이것도 폰에 저장해둬야 인터넷 없이 열립니다
const ASSETS = [
  './index.html',
  './app.min.js',
  './vendor/preact-shim.min.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
];

self.addEventListener('install', e => {
  // 하나가 실패해도 나머지는 저장되도록 한 개씩 담습니다 (addAll은 전부 아니면 전무)
  e.waitUntil(caches.open(CACHE).then(c =>
    Promise.all(ASSETS.map(a => c.add(a).catch(() => {})))
  ));
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
  // 새 버전 확인 파일은 절대 캐시하지 않습니다 (캐시되면 새 버전을 영영 못 봅니다)
  if (u.pathname.endsWith('/version.json')) return;
  const mine = u.origin === self.location.origin;
  if (!mine) return;
  // 저장해둔 게 있으면 그것부터, 없으면 받아오고 다음을 위해 저장합니다
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      }
      return res;
    }))
  );
});
// v1.2 deploy 2026-09-11 (캘린더 석 달치 · 말로 부화 기록 · 이름 두 번 찍히던 것)
