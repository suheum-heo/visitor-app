-- ============================================================
-- 009_phase3_meeting_recordings.sql
-- 미팅 녹음/영상 업로드 및 전사 상태 관리
-- ============================================================

create table public.meeting_recordings (
  id                   uuid primary key default gen_random_uuid(),
  meeting_id           uuid not null references public.meetings(id) on delete cascade,
  file_name            text not null,
  file_path            text not null,
  file_size            int not null,
  mime_type            text not null,
  transcription_status text not null default 'pending'
                         check (transcription_status in ('pending', 'processing', 'done')),
  transcription_text   text,
  uploaded_by          uuid not null references public.users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index idx_meeting_recordings_meeting_id on public.meeting_recordings(meeting_id);
create index idx_meeting_recordings_uploaded_by on public.meeting_recordings(uploaded_by);

create trigger set_updated_at_meeting_recordings
  before update on public.meeting_recordings
  for each row execute function public.handle_updated_at();
