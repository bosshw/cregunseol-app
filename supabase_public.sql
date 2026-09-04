-- ══════════════════════════════════════════
-- 공개 기록 표 (cg_public)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 한 번만 실행하세요.
-- 여러 번 실행해도 안전합니다.
--
-- 이 표에는 "새 주인에게 보여줄 한 장"만 들어갑니다.
-- 분양가·가계부·메모는 앱이 애초에 담지 않습니다(publicSnapshot 참고).
-- ══════════════════════════════════════════

create table if not exists public.cg_public (
  code        text primary key,
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.cg_public enable row level security;

-- 읽기: 링크(코드)를 아는 사람은 누구나. 로그인 없이도 열립니다.
drop policy if exists "cg_public read" on public.cg_public;
create policy "cg_public read"
  on public.cg_public for select
  using (true);

-- 쓰기·삭제: 자기 것만.
drop policy if exists "cg_public insert" on public.cg_public;
create policy "cg_public insert"
  on public.cg_public for insert
  with check (owner_id = auth.uid());

drop policy if exists "cg_public update" on public.cg_public;
create policy "cg_public update"
  on public.cg_public for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "cg_public delete" on public.cg_public;
create policy "cg_public delete"
  on public.cg_public for delete
  using (owner_id = auth.uid());

grant select on public.cg_public to anon, authenticated;
grant insert, update, delete on public.cg_public to authenticated;

create index if not exists cg_public_owner_idx on public.cg_public (owner_id);
