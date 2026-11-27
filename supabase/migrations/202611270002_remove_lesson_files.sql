begin;

alter table public.location_lesson_files add column removed_at timestamptz;

create index location_lesson_files_removed_idx on public.location_lesson_files (removed_at)
  where removed_at is not null;

commit;
