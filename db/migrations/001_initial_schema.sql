-- ============================================================
-- 001_initial_schema.sql
-- Neon (PostgreSQL) 용 — Supabase auth.users 의존성 제거
-- users.id는 자체 UUID, google_id로 Google OAuth 연결
-- ============================================================

-- users
create table public.users (
  id          uuid primary key default gen_random_uuid(),
  google_id   text unique,
  email       text not null unique,
  name        text,
  avatar_url  text,
  role        text not null default 'staff'
                check (role in ('admin','manager','staff','security','guest')),
  department  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- visitors
create table public.visitors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  company      text,
  phone        text,
  email        text,
  purpose      text not null default 'meeting'
                 check (purpose in ('meeting','delivery','interview','tour','other')),
  host_id      uuid not null references public.users(id),
  status       text not null default 'scheduled'
                 check (status in ('scheduled','arrived','departed','cancelled')),
  scheduled_at timestamptz,
  arrived_at   timestamptz,
  departed_at  timestamptz,
  notes        text,
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- meetings
create table public.meetings (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  host_id          uuid not null references public.users(id),
  visitor_id       uuid references public.visitors(id) on delete set null,
  location         text,
  scheduled_at     timestamptz not null,
  duration_minutes int not null default 60,
  status           text not null default 'scheduled'
                     check (status in ('scheduled','in_progress','completed','cancelled')),
  notes            text,
  created_by       uuid not null references public.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- audit_logs
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.users(id) on delete set null,
  action     text not null,
  table_name text not null,
  record_id  uuid,
  old_data   jsonb,
  new_data   jsonb,
  created_at timestamptz not null default now()
);

-- 인덱스
create index idx_visitors_host_id    on public.visitors(host_id);
create index idx_visitors_status     on public.visitors(status);
create index idx_visitors_scheduled  on public.visitors(scheduled_at);
create index idx_meetings_host_id    on public.meetings(host_id);
create index idx_meetings_visitor_id on public.meetings(visitor_id);
create index idx_meetings_scheduled  on public.meetings(scheduled_at);
create index idx_meetings_status     on public.meetings(status);
create index idx_audit_logs_user_id  on public.audit_logs(user_id);
create index idx_audit_logs_table    on public.audit_logs(table_name, record_id);
