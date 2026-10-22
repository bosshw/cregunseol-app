-- ══════════════════════════════════════════
--  브리딩비서 · 의견 한 줄 (v1.9.33, 2026-10-22)
--  SQL Editor 에 붙여넣고 Run 한 번이면 끝입니다. 여러 번 해도 안전합니다.
--
--  ★ 이름·이메일·연락처·아이피는 받지 않습니다.
--    받는 것: 고른 버튼(picks) · 적은 글(msg, 500자까지) · 기기 종류 · 홈 화면 여부 · 몇 번째 방문 · 아이 수 · 앱 버전
--  ★ 넣기는 누구나(로그인 안 해도) 됩니다. 읽기는 **대표님 계정만** 됩니다.
--    앱 설정 화면의 '📮 받은 의견'이 이 표를 읽습니다(대표님 로그인일 때만 보입니다).
--  ★ [안 보낼게요]를 누른 분은 아무것도 이 표에 들어오지 않습니다.
-- ══════════════════════════════════════════

create table if not exists public.cg_feedback (
  id         bigserial primary key,
  at         timestamptz not null default now(),
  day        date not null default ((now() at time zone 'Asia/Seoul')::date),
  picks      text[] not null default '{}'
             check (cardinality(picks) <= 6 and picks <@ array['easy','alarm','hard','missing','bug','unsure']::text[]),
  msg        text not null default '' check (char_length(msg) <= 500),
  device     text check (device in ('ios', 'android', 'pc')),
  standalone boolean,
  visit_no   int check (visit_no >= 0 and visit_no < 100000),
  animals    int check (animals >= 0 and animals < 100000),
  app        text check (char_length(app) <= 20),
  constraint cg_feedback_not_empty check (cardinality(picks) > 0 or char_length(msg) > 0)
);
create index if not exists cg_feedback_at on public.cg_feedback(at desc);

alter table public.cg_feedback enable row level security;

-- 넣기만 허용 (로그인 안 한 사람도)
drop policy if exists cg_feedback_insert on public.cg_feedback;
create policy cg_feedback_insert on public.cg_feedback
  for insert to anon, authenticated with check (true);

-- 읽기는 대표님 계정만
drop policy if exists cg_feedback_owner_read on public.cg_feedback;
create policy cg_feedback_owner_read on public.cg_feedback
  for select to authenticated using (auth.uid() = 'fa66ca69-3637-47b9-9cd3-58eac56c91d1'::uuid);

-- ⚠️ update·delete 정책은 일부러 만들지 않았습니다. 지울 때는 대시보드(주인 권한)에서 합니다.

-- 확인용
-- select at, picks, msg, device, standalone, visit_no, animals, app from cg_feedback order by at desc;
