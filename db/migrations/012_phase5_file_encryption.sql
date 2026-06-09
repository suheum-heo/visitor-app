-- 012_phase5_file_encryption.sql — AES-256-GCM metadata for R2 files

alter table public.documents
  add column if not exists iv text,
  add column if not exists auth_tag text;

alter table public.meeting_recordings
  add column if not exists iv text,
  add column if not exists auth_tag text;
