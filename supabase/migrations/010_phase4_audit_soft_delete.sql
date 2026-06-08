-- ============================================================
-- 010_phase4_audit_soft_delete.sql
-- 감사 로그 필드 확장 + visitors/meetings soft delete
-- ============================================================

alter table public.audit_logs
  rename column table_name to resource_type;

alter table public.audit_logs
  rename column record_id to resource_id;

alter table public.audit_logs
  add column ip_address text,
  add column user_agent text;

drop index if exists idx_audit_logs_table;
create index idx_audit_logs_resource on public.audit_logs(resource_type, resource_id);

alter table public.visitors
  add column deleted_at timestamptz;

alter table public.meetings
  add column deleted_at timestamptz;

create index idx_visitors_deleted_at on public.visitors(deleted_at)
  where deleted_at is not null;

create index idx_meetings_deleted_at on public.meetings(deleted_at)
  where deleted_at is not null;
