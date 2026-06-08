-- ============================================================
-- 007_phase2_search_fts.sql
-- Full-text search indexes for unified search
-- ============================================================

create index idx_visitors_fts on public.visitors using gin(
  to_tsvector('simple',
    coalesce(name, '') || ' ' ||
    coalesce(company, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(notes, '')
  )
);

create index idx_meetings_fts on public.meetings using gin(
  to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(location, '') || ' ' ||
    coalesce(notes, '')
  )
);
