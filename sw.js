// ★ 이 번호는 화면 버전과 따로 갑니다. 화면 버전은 1.7 → 1.0 으로 되돌렸지만
//    캐시 이름은 올라가기만 합니다(v17 → v18). 옛 이름을 다시 쓰면 폰에 남아 있던
//    헌 파일 묶음을 새것으로 착각해서 화면이 안 바뀝니다.
const CACHE = 'creg-v31';

// 화면을 그리는 데 꼭 필요한 파일 — 이것도 폰에 저장해둬야 인터넷 없이 열립니다
const ASSETS = [
  './index.html',
  './brand-art.js',
  './brand-art.css',
  './assets/brand/applause.svg',
  './assets/brand/archive.svg',
  './assets/brand/back.svg',
  './assets/brand/backup.svg',
  './assets/brand/bell.svg',
  './assets/brand/birthday.svg',
  './assets/brand/blocked.svg',
  './assets/brand/book.svg',
  './assets/brand/bowl.svg',
  './assets/brand/briefing.svg',
  './assets/brand/calendar.svg',
  './assets/brand/chart.svg',
  './assets/brand/chat.svg',
  './assets/brand/clean.svg',
  './assets/brand/close.svg',
  './assets/brand/cloud.svg',
  './assets/brand/condition.svg',
  './assets/brand/delete.svg',
  './assets/brand/distribution.svg',
  './assets/brand/dna.svg',
  './assets/brand/done.svg',
  './assets/brand/down.webp',
  './assets/brand/download.svg',
  './assets/brand/edit.svg',
  './assets/brand/egg.svg',
  './assets/brand/email.svg',
  './assets/brand/environment.svg',
  './assets/brand/expense.svg',
  './assets/brand/fasting.svg',
  './assets/brand/favorite.svg',
  './assets/brand/feeding.svg',
  './assets/brand/feedingPlan.svg',
  './assets/brand/female.svg',
  './assets/brand/gecko-transparent.webp',
  './assets/brand/gift.svg',
  './assets/brand/good.webp',
  './assets/brand/growth.svg',
  './assets/brand/hatch.webp',
  './assets/brand/home.svg',
  './assets/brand/import.svg',
  './assets/brand/income.svg',
  './assets/brand/insect.svg',
  './assets/brand/ledger.svg',
  './assets/brand/lineage.svg',
  './assets/brand/link.svg',
  './assets/brand/lock.svg',
  './assets/brand/male.svg',
  './assets/brand/mating.svg',
  './assets/brand/memo.svg',
  './assets/brand/memorial.svg',
  './assets/brand/merge.svg',
  './assets/brand/mobile.svg',
  './assets/brand/next.svg',
  './assets/brand/normal.webp',
  './assets/brand/photo.svg',
  './assets/brand/pin.svg',
  './assets/brand/plus.svg',
  './assets/brand/price.svg',
  './assets/brand/sad.webp',
  './assets/brand/save.svg',
  './assets/brand/search.svg',
  './assets/brand/season.svg',
  './assets/brand/settings.svg',
  './assets/brand/shed.svg',
  './assets/brand/skip.svg',
  './assets/brand/sort.svg',
  './assets/brand/sparkle.svg',
  './assets/brand/starOutline.svg',
  './assets/brand/sun.svg',
  './assets/brand/sync.svg',
  './assets/brand/target.svg',
  './assets/brand/thanks.svg',
  './assets/brand/theme.svg',
  './assets/brand/trend.svg',
  './assets/brand/unknown.svg',
  './assets/brand/urgent.svg',
  './assets/brand/voice.svg',
  './assets/brand/warning.svg',
  './app.min.js',
  './importer.min.js',
  './vendor/preact-shim.min.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
];

self.addEventListener('install', e => {
  // 하나가 실패해도 나머지는 저장되도록 한 개씩 담습니다 (addAll은 전부 아니면 전무)
  e.waitUntil(caches.open(CACHE).then(c =>
    // Revalidate the HTTP cache too, so a fresh worker never installs old artwork.
    Promise.all(ASSETS.map(a => c.add(new Request(a, { cache: 'reload' })).catch(() => {})))
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

/* ══════════════════════════════════════════
   폰 밖으로 나가는 알림 (웹 푸시)

   앱이 꺼져 있어도 이 서비스워커는 깨어나 알림을 띄웁니다.
   보낼 내용은 서버가 정해서 실어 보냅니다 — 여기서는 받아서 보여주기만 합니다.
     t = 제목 / b = 내용 / u = 누르면 갈 화면 / g = 묶음 이름(같으면 덮어씁니다)
   ══════════════════════════════════════════ */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) {
    try { d = { t: e.data.text() }; } catch (_e) { d = {}; }
  }
  const title = d.t || '브리딩비서';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.b || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag: d.g || 'creg',
    renotify: true,
    data: { url: d.u || 'reminders' },
  }));
});

// 알림을 누르면 이미 열린 앱으로 가고, 없으면 새로 엽니다
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const go = (e.notification.data && e.notification.data.url) || 'reminders';
  const target = new URL('./?go=' + encodeURIComponent(go), self.location.href).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        c.postMessage({ type: 'go', screen: go });
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  }));
});
// v1.5 deploy 2026-09-13 (웹 푸시 — 부화 예정 · 밥 주는 날)
// v1.6 deploy 2026-09-23 (한 클러치에서 알이 며칠 걸쳐 나올 때 연계)
// v1.8 deploy 2026-09-24 (쓰던 엑셀·메모 가져오기 — importer.min.js 는 누를 때만 불러옴)
// v1.9 deploy 2026-09-25 (부화 예정일을 우리 집 실제 부화 기록으로 학습)
// v1.9.1 deploy 2026-09-25 (대표님 계정 ID 오타 수정 · 새 버전 안내 한 줄로)
