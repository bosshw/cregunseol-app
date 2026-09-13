-- ══════════════════════════════════════════
--  브리딩비서 · 웹 푸시 알림 (v1.5)
--  Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 한 번 실행하시면 됩니다.
--  여러 번 실행해도 안전합니다 (이미 있으면 건너뜁니다).
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
  label      text,                    -- 어느 기기인지 (아이폰 / 갤럭시 …)
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

-- ── 3. 본인 것만 보이게 (행 수준 보안) ──
alter table public.cg_push_subs enable row level security;
alter table public.cg_push_plan enable row level security;

drop policy if exists cg_push_subs_own on public.cg_push_subs;
create policy cg_push_subs_own on public.cg_push_subs
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists cg_push_plan_own on public.cg_push_plan;
create policy cg_push_plan_own on public.cg_push_plan
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── 4. 고친 시각은 서버 시계로 (폰 시계가 틀려도 무관) ──
create or replace function public.cg_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists cg_push_subs_touch on public.cg_push_subs;
create trigger cg_push_subs_touch before insert or update on public.cg_push_subs
  for each row execute function public.cg_touch_updated_at();

drop trigger if exists cg_push_plan_touch on public.cg_push_plan;
create trigger cg_push_plan_touch before insert or update on public.cg_push_plan
  for each row execute function public.cg_touch_updated_at();


-- ══════════════════════════════════════════
--  5. 매일 아침 8시에 보내기
--  ⚠️ 아래를 실행하기 전에 Edge Function 'push' 를 먼저 배포해 주세요.
--  ⚠️ '여기에_아무_암호나_길게' 두 군데를 대표님이 정한 같은 문자열로 바꿔주세요.
--     (Edge Function Secrets 의 CRON_KEY 와 똑같아야 합니다)
--  ⚠️ 시각은 세계표준시 기준입니다. 23:00 UTC = 다음날 08:00 한국시간.
-- ══════════════════════════════════════════
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

select cron.unschedule('cg-push-daily') where exists (select 1 from cron.job where jobname = 'cg-push-daily');

select cron.schedule('cg-push-daily', '0 23 * * *', $job$
  select net.http_post(
    url     := 'https://yginjnqwwvsvhysboiqv.supabase.co/functions/v1/push/run',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-cron-key',  '여기에_아무_암호나_길게'),
    body    := '{}'::jsonb
  );
$job$);

-- 확인용: 등록된 일정 보기
-- select jobname, schedule, active from cron.job;
-- 최근 실행 결과 보기
-- select * from cron.job_run_details order by start_time desc limit 5;
