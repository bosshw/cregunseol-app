-- ══════════════════════════════════════════
--  브리딩비서 · 폰 알림(웹 푸시) 준비
--
--  대시보드 → SQL Editor 에 통째로 붙여넣고 Run 한 번이면 끝입니다.
--  여러 번 실행해도 안전합니다(이미 있으면 건너뜁니다).
--  ★ 옮겨적을 비밀번호나 열쇠가 없습니다 — 열쇠는 함수가 스스로 만들어 넣습니다.
-- ══════════════════════════════════════════

-- ── 1. 알림 받을 기기 목록 ──
-- 폰 하나가 한 줄입니다. 폰이 주는 주소(endpoint)가 곧 이름표입니다.
create table if not exists public.cg_push_subs (
  endpoint   text primary key,
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh     text not null,           -- 이 폰만 열어볼 수 있게 하는 공개키
  auth       text not null,           -- 같은 용도의 비밀값
  hatch      boolean not null default true,   -- 부화 예정 알림 받기
  feed       boolean not null default true,   -- 밥 주는 날 알림 받기
  label      text,                    -- 어느 기기인지 (아이폰 / 안드로이드 …)
  updated_at timestamptz not null default now()
);
create index if not exists cg_push_subs_user on public.cg_push_subs(user_id);

-- ── 2. 알림 일정표 ──
-- 무엇을 언제 보낼지는 앱이 계산해서 여기 올려둡니다. 서버는 오늘 날짜 줄만 꺼내 씁니다.
-- plan 예) [{"d":"2026-09-20","k":"hatch","t":"크동이 3차 알이 곧 나와요","b":"7월 7일 산란"}]
create table if not exists public.cg_push_plan (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  plan       jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── 3. 열쇠 보관함 ──
-- ★ 사람이 채우지 않습니다. 함수가 처음 불릴 때 스스로 만들어 한 줄 넣습니다.
--   id 를 1로 못박아 두어 한 벌만 남습니다.
create table if not exists public.cg_push_keys (
  id            int primary key default 1 check (id = 1),
  vapid_public  text not null,
  vapid_private text not null,
  cron_key      text not null,
  created_at    timestamptz not null default now()
);

-- ── 4. 본인 것만 보이게 (행 수준 보안) ──
alter table public.cg_push_subs enable row level security;
alter table public.cg_push_plan enable row level security;
alter table public.cg_push_keys enable row level security;

drop policy if exists cg_push_subs_own on public.cg_push_subs;
create policy cg_push_subs_own on public.cg_push_subs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists cg_push_plan_own on public.cg_push_plan;
create policy cg_push_plan_own on public.cg_push_plan
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ⚠️ cg_push_keys 에는 정책을 하나도 만들지 않습니다.
--    = 로그인한 사람도, 로그인 안 한 사람도 절대 못 봅니다. 서버로 도는 함수만 읽습니다.

-- ── 5. 고친 시각은 서버 시계로 (폰 시계가 틀려도 무관) ──
create or replace function public.cg_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists cg_push_subs_touch on public.cg_push_subs;
create trigger cg_push_subs_touch before insert or update on public.cg_push_subs
  for each row execute function public.cg_touch_updated_at();

drop trigger if exists cg_push_plan_touch on public.cg_push_plan;
create trigger cg_push_plan_touch before insert or update on public.cg_push_plan
  for each row execute function public.cg_touch_updated_at();

-- ── 6. 매일 아침 8시에 보내기 ──
-- 23:00 UTC = 다음날 08:00 한국시간.
-- 암호는 열쇠 보관함에서 그때그때 꺼내 씁니다 — 여기에 적어둘 것이 없습니다.
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

select cron.unschedule('cg-push-daily') where exists (select 1 from cron.job where jobname = 'cg-push-daily');

select cron.schedule('cg-push-daily', '0 23 * * *', $job$
  select net.http_post(
    url     := 'https://yginjnqwwvsvhysboiqv.supabase.co/functions/v1/push/run',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-key',   coalesce((select cron_key from public.cg_push_keys where id = 1), '')),
    body    := '{}'::jsonb
  );
$job$);

-- 확인용
-- select jobname, schedule, active from cron.job;
-- select * from cron.job_run_details order by start_time desc limit 5;
