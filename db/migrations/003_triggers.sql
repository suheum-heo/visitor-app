-- ============================================================
-- 003_triggers.sql
-- updated_at 자동 갱신 트리거
-- (Supabase auth.users 동기화 트리거 제거 — NextAuth가 처리)
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_visitors
  before update on public.visitors
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_meetings
  before update on public.meetings
  for each row execute function public.handle_updated_at();
