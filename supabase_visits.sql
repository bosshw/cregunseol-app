-- ══════════════════════════════════════════
--  브리딩비서 · 익명 방문 집계
--  SQL Editor 에 붙여넣고 Run 한 번이면 끝입니다. 여러 번 해도 안전합니다.
--
--  ★ 개인을 알아볼 수 있는 것은 하나도 담기지 않습니다.
--    이름·이메일·아이피·브라우저 문자열·기기 고유번호 — 아무것도 안 받습니다.
--  ★ 넣기만 되고 **아무도 못 읽습니다** (읽기 정책을 만들지 않았습니다).
--    숫자를 볼 때는 대시보드(주인 권한)에서 아래 확인용 쿼리를 씁니다.
-- ══════════════════════════════════════════

create table if not exists public.cg_visits (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  day       date not null default ((now() at time zone 'Asia/Seoul')::date),
  step      text not null check (step in ('open', 'record', 'signup', 'push')),
  device    text check (device in ('ios', 'android', 'pc')),
  standalone boolean,          -- 홈 화면에 추가해서 열었는가
  visit_no  int check (visit_no >= 0 and visit_no < 100000),  -- 이 기기의 몇 번째 방문인지
  app       text
);
create index if not exists cg_visits_day on public.cg_visits(day);

alter table public.cg_visits enable row level security;

-- 넣기만 허용합니다. 로그인 안 한 사람도 넣을 수 있어야 세어집니다.
drop policy if exists cg_visits_insert on public.cg_visits;
create policy cg_visits_insert on public.cg_visits
  for insert to anon, authenticated with check (true);

-- ⚠️ select·update·delete 정책은 일부러 만들지 않았습니다.
--    = 누구도 이 표를 읽거나 고칠 수 없습니다. 주인(대시보드)만 봅니다.


-- ══════════════════════════════════════════
--  확인용 — 숫자 볼 때 이걸 실행합니다
-- ══════════════════════════════════════════

-- ① 날짜별 깔때기 (최근 30일)
-- select day,
--        count(*) filter (where step = 'open')               as 연횟수,
--        count(*) filter (where step = 'open' and visit_no = 1) as 처음온기기,
--        count(*) filter (where step = 'record')             as 기록까지,
--        count(*) filter (where step = 'signup')             as 가입,
--        count(*) filter (where step = 'push')               as 알림켬
-- from cg_visits where day >= current_date - 29 group by day order by day desc;

-- ② 전체 깔때기 — 여기서 어디가 새는지 보입니다
-- select count(*) filter (where step = 'open' and visit_no = 1) as 처음온기기,
--        count(*) filter (where step = 'record')                as 기록까지,
--        count(*) filter (where step = 'signup')                as 가입,
--        count(*) filter (where step = 'push')                  as 알림켬
-- from cg_visits;

-- ③ 기기별 · 홈 화면 여부 (아이폰은 홈 화면에 추가해야 알림이 옵니다)
-- select device, standalone, count(*) filter (where step = 'open') as 연횟수,
--        count(*) filter (where step = 'open' and visit_no = 1) as 처음온기기
-- from cg_visits group by device, standalone order by 3 desc;

-- ④ 다시 온 기기 — visit_no 가 2 이상인 게 재방문입니다
-- select case when visit_no = 1 then '처음' when visit_no <= 3 then '2~3번째'
--             when visit_no <= 10 then '4~10번째' else '10번 넘게' end as 방문차수,
--        count(*) as 건수
-- from cg_visits where step = 'open' group by 1 order by 2 desc;
