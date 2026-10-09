// ★ 이 번호는 화면 버전과 따로 갑니다. 화면 버전은 1.7 → 1.0 으로 되돌렸지만
//    캐시 이름은 올라가기만 합니다(v17 → v18). 옛 이름을 다시 쓰면 폰에 남아 있던
//    헌 파일 묶음을 새것으로 착각해서 화면이 안 바뀝니다.
const CACHE = 'creg-v60';

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
  './assets/brand/khan-full.webp',
  './assets/brand/click-pixel.png',
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
  './welcome.min.js',
  './card.min.js',
  './extras.min.js',
  './crevalue.min.js',
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
// v1.9.2 deploy 2026-09-25 (이름 브리딩비서 · 처음 온 사람 예시 구경 · 인스타 안이면 밖으로 열기 안내 — welcome.min.js 는 필요할 때만)
// v1.9.3 deploy 2026-09-25 (게임식 튜토리얼 — 누를 곳만 밝히고 크한이가 한 단계씩 · 예시 아이 루나로 연습)
// v1.9.4 deploy 2026-09-25 (튜토리얼: 산란보다 아이 등록을 먼저 — 하늘이 등록·성별 고르기)
// v1.9.5 deploy 2026-09-27 (앱 먼저 받기 — 가운데 크한이 + 큰 [앱 받기], 아이폰은 단계별 안내)
// v1.9.6 deploy 2026-09-28 (사용자 제보 — 대화 날짜 연도 인식 · 프로필 연필로 기본 정보 수정 · 알마다 부화 · 두 번 못 알아들으면 직접 고치기)
// v1.9.7 deploy 2026-09-28 (아이폰 튜토리얼 캘린더 단계 멈춤 — 창 밀림 되돌리기 · 탭 단계에 [열기] 버튼)
// v1.9.8 deploy 2026-09-28 (아이폰 엑셀 가져오기 — 파일 종류 제한 풀기 · 위치 안내 · Numbers 안내)
// v1.9.9 deploy 2026-09-28 (대화 성별 알아듣기 — '크범이 암컷' · '암컷으로 바꿔줘' / 프로필 오늘 컨디션 카드 빼기 · 기록 공유하기 버튼)
// v1.9.10 deploy 2026-09-28 (대화로 입양처·입양가·점 적기 — '새벽피딩에서 데려왔어' 먹이 오인 막기)
// v1.9.11 deploy 2026-09-28 (프로필 — 활동 기록·몸무게 그래프를 [기록하기] 위로, 그래프 빈 자리 안내)
// v1.9.12 deploy 2026-09-28 (기록 공유 한 장 — 한눈에 요약·브리딩 이력·자식·미리 보기, 먹이 줄 묶기)
// v1.9.13 deploy 2026-10-01 (가계부 분양완료 카드 — 별·최근·먹이 빼고 분양가·입양자(연락처 가림) 카드 안에, 분양 창에 입양자 이름·연락처)
// v1.9.14 deploy 2026-10-02 (가계부 떠남 칸 → 🌈 무지개다리 — 최근·먹이·별 빼고 떠난 날 표시, 안내 문장 한 번만)
// v1.9.15 deploy 2026-10-03 (산란 탭 직접 입력 — 메이팅·산란 기록/수정, 알 대기↔부화, 따로 등록한 아이 잇기, 해칭 마릿수↔알별 기록 맞춤, 같은 이름 합치기, 대화로도 같은 일)
// v1.9.16 deploy 2026-10-03 (알 부화를 거두면 그때 자동 등록된 아기도 같이 지울지 여쭙기 — 별산1호 제보)
// v1.9.17 deploy 2026-10-03 (대화 ↔ 화면 기능 전수 연동 — 공유·즐겨찾기·KEEP·MY·시즌·삭제/합치기·기록 고치기/지우기·대표사진·알림·설정·엑셀/백업·화면 열기)
// v1.9.18 deploy 2026-10-04 (알 개수 빈칸 — 공유 기록에 '알 0개'로 안 보이게, 오늘의 제안에서 채우기, 남은 알 결과 묻기)
// v1.9.19 deploy 2026-10-04 (대화에서 산란하면 알 몇 개, 부화하면 몇 마리인지 묻기 — 칩 또는 글로 답)
// v1.9.20 deploy 2026-10-04 (동기화 경합 — 올리는 사이 고친 기록이 서버 옛 값으로 덮이던 것 고침)
// v1.9.21 deploy 2026-10-04 (처음 시작=내 아이 1마리 등록·첫 밥 · 시즌 노트 · 분양 카드/입양 보내기(실험, ?labs=1) · 입양 받기 · card.min.js/extras.min.js 는 필요할 때만)
// v1.9.22 deploy 2026-10-05 (축양 화면 검색란 옆 [개체 추가] — 직접 입력 등록)
// v1.9.23 deploy 2026-10-05 ([개체 추가] 버튼 — + 대신 크한이 전신(배경 없음) khan-full.webp)
// v1.9.24 deploy 2026-10-05 (사용법 배우기 — 화면 여는 단계가 멈추지 않게: 열기 버튼은 바로 다음으로, 6초 뒤 [다음], 단계 집계 onb_tutN)
// v1.9.25 deploy 2026-10-05 (사용법 배우기에서 캘린더·브리핑 단계 뺌 — 폴드5 프로필 화면에서 멈추던 것)
// v1.9.26 deploy 2026-10-05 (빈 홈 — '직접 입력해서 추가' 뺌, 첫 등록하기 위에 픽셀 '클릭!' 글씨 click-pixel.png)
