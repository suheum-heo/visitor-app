-- ============================================================
-- 006_phase2_access_records.sql
-- Access records + sync logs for security system integration
-- ============================================================

create table public.access_records (
  id           uuid primary key default gen_random_uuid(),
  visitor_id   uuid references public.visitors(id) on delete set null,
  name         text not null,
  company      text,
  direction    text not null check (direction in ('in', 'out')),
  access_point text,
  recorded_at  timestamptz not null default now(),
  source       text not null default 'manual'
                 check (source in ('manual', 'sync', 'api')),
  external_id  text,
  notes        text,
  created_by   uuid references public.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.sync_logs (
  id              uuid primary key default gen_random_uuid(),
  sync_type       text not null default 'access_records',
  status          text not null check (status in ('success', 'failed', 'partial')),
  records_fetched int not null default 0,
  records_created int not null default 0,
  records_updated int not null default 0,
  error_message   text,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_access_records_visitor_id  on public.access_records(visitor_id);
create index idx_access_records_recorded_at on public.access_records(recorded_at);
create index idx_access_records_direction   on public.access_records(direction);
create index idx_access_records_source      on public.access_records(source);
create index idx_sync_logs_sync_type        on public.sync_logs(sync_type);
create index idx_sync_logs_started_at       on public.sync_logs(started_at);
