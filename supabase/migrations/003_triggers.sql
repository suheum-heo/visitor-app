-- ============================================================
-- 003_triggers.sql
-- updated_at 자동 갱신 트리거 + auth.users 동기화
-- ============================================================

-- updated_at 갱신 함수
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 각 테이블에 트리거 적용
create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_visitors
  before update on public.visitors
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_meetings
  before update on public.meetings
  for each row execute function public.handle_updated_at();

-- ─────────────────────────────────────
-- Google OAuth 로그인 시 public.users 자동 생성
-- ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url',
    'staff'
  )
  on conflict (id) do update set
    email      = excluded.email,
    name       = coalesce(excluded.name, public.users.name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
