-- ══════════════════════════════════════════
-- v1.9.21 입양 보따리 (cg_adopt)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 한 번만 실행하세요. 여러 번 실행해도 안전합니다.
--
-- 원칙: 입양은 기록의 '복사본'을 건네는 것입니다.
--   · 보따리는 만든 뒤 바뀌지 않습니다(data 를 고치는 정책이 없습니다).
--   · 한 번만 받을 수 있고, 7일이 지나면 닫힙니다. 받기 전에는 보낸 사람이 취소할 수 있습니다.
--   · 받는 사람은 로그인 없이 받습니다 → 표를 직접 열지 않고, 아래 함수 두 개(미리보기·받기)로만 꺼냅니다.
--     '한 번만'은 서버가 판정합니다(받기 함수가 수령 표시와 건네기를 한 번에 처리).
--   · 같은 기기(device key)가 다시 받기를 누르면 같은 내용을 다시 돌려줍니다(받다가 끊겼을 때 재시도용).
--     앱은 링크 코드로 중복을 막아서 두 마리가 생기지 않습니다.
-- ══════════════════════════════════════════

create table if not exists public.cg_adopt (
  code        text primary key check (char_length(code) >= 20),
  owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  src_id      text not null default '',
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  claimed_at  timestamptz,
  claimed_key text,
  revoked     boolean not null default false
);

alter table public.cg_adopt enable row level security;

-- 보낸 사람만 자기 보따리를 봅니다(받아갔는지 확인용). 받는 사람은 표를 직접 못 엽니다.
drop policy if exists "cg_adopt read own" on public.cg_adopt;
create policy "cg_adopt read own" on public.cg_adopt for select using (owner_id = auth.uid());

-- 만들기: 자기 것만, 처음 상태로만(받음·취소 표시를 미리 넣을 수 없게), 기한은 7일 이내.
drop policy if exists "cg_adopt insert own" on public.cg_adopt;
create policy "cg_adopt insert own" on public.cg_adopt for insert
  with check (owner_id = auth.uid() and claimed_at is null and claimed_key is null and revoked = false
              and expires_at <= now() + interval '7 days 1 hour');

-- 고치기·지우기 정책은 두지 않습니다(보따리는 바뀌지 않음). 취소는 아래 함수로만.

-- 미리보기 — 누구나(로그인 없이). 받을 수 있는 상태일 때만 내용을 돌려줍니다.
create or replace function public.cg_adopt_peek(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.cg_adopt%rowtype;
begin
  select * into r from public.cg_adopt where code = p_code;
  if not found then return jsonb_build_object('status', 'none'); end if;
  if r.revoked then return jsonb_build_object('status', 'revoked'); end if;
  if r.claimed_at is not null then return jsonb_build_object('status', 'claimed'); end if;
  if r.expires_at < now() then return jsonb_build_object('status', 'expired'); end if;
  return jsonb_build_object('status', 'ok', 'data', r.data, 'expires_at', r.expires_at);
end $$;

-- 받기 — 누구나(로그인 없이). 수령 표시와 내용 건네기를 한 번에. 이미 받았으면 이유만 돌려줍니다.
create or replace function public.cg_adopt_claim(p_code text, p_key text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.cg_adopt%rowtype;
begin
  if coalesce(p_key, '') = '' then return jsonb_build_object('status', 'bad'); end if;
  update public.cg_adopt set claimed_at = now(), claimed_key = p_key
   where code = p_code and claimed_at is null and not revoked and expires_at > now()
   returning * into r;
  if found then return jsonb_build_object('status', 'ok', 'data', r.data); end if;
  select * into r from public.cg_adopt where code = p_code;
  if found and r.claimed_key = p_key and not r.revoked then
    return jsonb_build_object('status', 'ok', 'data', r.data, 'again', true);
  end if;
  return public.cg_adopt_peek(p_code);
end $$;

-- 취소 — 보낸 사람만, 받아가기 전까지만.
create or replace function public.cg_adopt_revoke(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.cg_adopt set revoked = true
   where code = p_code and owner_id = auth.uid() and claimed_at is null;
  get diagnostics n = row_count;
  return jsonb_build_object('status', case when n > 0 then 'ok' else 'no' end);
end $$;

revoke all on function public.cg_adopt_peek(text) from public;
revoke all on function public.cg_adopt_claim(text, text) from public;
revoke all on function public.cg_adopt_revoke(text) from public;
grant execute on function public.cg_adopt_peek(text) to anon, authenticated;
grant execute on function public.cg_adopt_claim(text, text) to anon, authenticated;
grant execute on function public.cg_adopt_revoke(text) to authenticated;
-- Supabase 는 새 함수를 anon 에게도 기본으로 열어 둡니다 — 취소는 로그인한 보낸 사람만
revoke execute on function public.cg_adopt_revoke(text) from anon;
