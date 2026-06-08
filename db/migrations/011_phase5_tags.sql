-- 011_phase5_tags.sql — visitors/meetings 태그 컬럼

alter table public.visitors
  add column if not exists tags text[] not null default '{}';

alter table public.meetings
  add column if not exists tags text[] not null default '{}';

create index idx_visitors_tags on public.visitors using gin (tags);
create index idx_meetings_tags on public.meetings using gin (tags);
