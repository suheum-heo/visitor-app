-- ============================================================
-- 013_phase6_projects_trips.sql
-- 프로젝트, 출장, 미팅 유형, 출입 차량 필드
-- ============================================================

create table public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  description text,
  tags        text[] not null default '{}',
  created_by  uuid not null references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table public.business_trips (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  employee_id  uuid not null references public.users(id),
  company      text,
  location     text,
  project_id   uuid references public.projects(id) on delete set null,
  purpose      text,
  scheduled_at timestamptz not null,
  end_at       timestamptz,
  status       text not null default 'scheduled'
                 check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes        text,
  tags         text[] not null default '{}',
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

alter table public.visitors
  add column if not exists project_id uuid references public.projects(id) on delete set null;

alter table public.meetings
  add column if not exists meeting_type text not null default 'internal'
    check (meeting_type in ('internal', 'external_inbound', 'external_outbound', 'virtual'));

alter table public.meetings
  add column if not exists project_id uuid references public.projects(id) on delete set null;

alter table public.access_records
  add column if not exists record_category text not null default 'person'
    check (record_category in ('person', 'vehicle', 'delivery'));

alter table public.access_records
  add column if not exists vehicle_number text;

alter table public.access_records
  add column if not exists project_id uuid references public.projects(id) on delete set null;

create index idx_projects_name on public.projects(name);
create index idx_projects_company on public.projects(company);
create index idx_projects_deleted_at on public.projects(deleted_at) where deleted_at is not null;

create index idx_business_trips_employee_id on public.business_trips(employee_id);
create index idx_business_trips_project_id on public.business_trips(project_id);
create index idx_business_trips_scheduled_at on public.business_trips(scheduled_at);
create index idx_business_trips_status on public.business_trips(status);
create index idx_business_trips_deleted_at on public.business_trips(deleted_at) where deleted_at is not null;

create index idx_visitors_project_id on public.visitors(project_id);
create index idx_meetings_project_id on public.meetings(project_id);
create index idx_meetings_meeting_type on public.meetings(meeting_type);
create index idx_access_records_category on public.access_records(record_category);
create index idx_access_records_vehicle_number on public.access_records(vehicle_number);

create trigger set_updated_at_projects
  before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_business_trips
  before update on public.business_trips
  for each row execute function public.handle_updated_at();
