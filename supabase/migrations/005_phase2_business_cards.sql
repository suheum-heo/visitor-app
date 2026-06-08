-- ============================================================
-- 005_phase2_business_cards.sql
-- Business card OCR records (images stored in Cloudflare R2)
-- ============================================================

create table public.business_cards (
  id           uuid primary key default gen_random_uuid(),
  visitor_id   uuid references public.visitors(id) on delete set null,
  meeting_id   uuid references public.meetings(id) on delete set null,
  image_url    text not null,
  name         text,
  company      text,
  position     text,
  phone        text,
  email        text,
  ocr_raw      jsonb,
  is_confirmed boolean not null default false,
  created_by   uuid not null references public.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_business_cards_visitor_id on public.business_cards(visitor_id);
create index idx_business_cards_meeting_id on public.business_cards(meeting_id);
create index idx_business_cards_created_by on public.business_cards(created_by);
