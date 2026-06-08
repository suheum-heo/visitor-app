-- ============================================================
-- 004_phase2_documents.sql
-- Meeting document attachments (stored in Cloudflare R2)
-- ============================================================

create table public.documents (
  id          uuid primary key default gen_random_uuid(),
  meeting_id  uuid not null references public.meetings(id) on delete cascade,
  file_name   text not null,
  file_path   text not null,
  file_size   int not null,
  mime_type   text not null,
  uploaded_by uuid not null references public.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_documents_meeting_id on public.documents(meeting_id);
create index idx_documents_uploaded_by on public.documents(uploaded_by);
