begin;

create table public.location_lessons (
  session_id uuid primary key references public.sessions(id) on delete restrict,
  owner_id uuid not null,
  workspace_id uuid not null,
  location text not null,
  title text not null default '' check (length(title) <= 160),
  topics text not null default '' check (length(topics) <= 6000),
  published boolean not null default false
);

create index on public.location_lessons(owner_id, workspace_id, location) where published;

create function public.workspace_has_lesson_content(p_workspace uuid, p_year integer)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.location_lessons l join public.sessions s on s.id = l.session_id
    where l.owner_id = auth.uid() and l.workspace_id = p_workspace
      and (p_year is null or extract(year from s.session_date) = p_year)
  );
$$;
revoke all on function public.workspace_has_lesson_content(uuid, integer) from public, anon;
grant execute on function public.workspace_has_lesson_content(uuid, integer) to authenticated;

create table public.location_lesson_tasks (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.location_lessons(session_id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  instructions text not null default '' check (length(instructions) <= 6000),
  due_date date,
  published boolean not null default false,
  unique (id, session_id)
);
create index on public.location_lesson_tasks(session_id);

create table public.location_lesson_uploads (
  id uuid primary key,
  session_id uuid not null references public.location_lessons(session_id) on delete restrict,
  task_id uuid,
  kind text not null check (kind in ('material', 'assignment', 'submission')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  foreign key (task_id, session_id) references public.location_lesson_tasks(id, session_id) on delete restrict,
  check ((kind = 'material') = (task_id is null))
);
create index on public.location_lesson_uploads(session_id, created_at);

create table public.location_lesson_files (
  id uuid primary key,
  upload_id uuid not null references public.location_lesson_uploads(id) on delete cascade,
  name text not null,
  mime text not null,
  size_bytes integer not null check (size_bytes between 1 and 20971520)
);
create index on public.location_lesson_files(upload_id);

alter table public.notifications add column location_lesson_session_id uuid;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('location-lesson-files', 'location-lesson-files', false, 20971520,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'image/jpeg', 'image/png']);

create policy location_lesson_storage_private on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'location-lesson-files') with check (bucket_id <> 'location-lesson-files');

alter table public.location_lessons enable row level security;
alter table public.location_lesson_tasks enable row level security;
alter table public.location_lesson_uploads enable row level security;
alter table public.location_lesson_files enable row level security;

revoke all on public.location_lessons, public.location_lesson_tasks, public.location_lesson_uploads,
  public.location_lesson_files from public, anon, authenticated;
grant select, insert, update, delete on public.location_lessons, public.location_lesson_tasks,
  public.location_lesson_uploads, public.location_lesson_files to service_role;

create function public.reserve_location_lesson_upload(
  p_id uuid, p_session uuid, p_task uuid, p_kind text, p_files jsonb
) returns boolean language plpgsql set search_path = '' as $$
declare
  lesson public.location_lessons%rowtype;
  reserved bigint;
begin
  select * into strict lesson from public.location_lessons where session_id = p_session;
  perform 1 from public.user_category_access
    where id = lesson.workspace_id and user_id = lesson.owner_id for update;
  if not found or jsonb_array_length(p_files) not between 1 and 5 then return false; end if;

  select coalesce(sum(case when u.confirmed_at is null then 20971520 else f.size_bytes end), 0) into reserved
    from public.location_lesson_uploads u
    join public.location_lessons l on l.session_id = u.session_id
    join public.location_lesson_files f on f.upload_id = u.id
    where l.workspace_id = lesson.workspace_id and l.owner_id = lesson.owner_id and l.location = lesson.location
      and u.created_at >= now() - interval '1 day' and (u.kind = 'submission') = (p_kind = 'submission');
  if reserved + jsonb_array_length(p_files)::bigint * 20971520 > 524288000 then return false; end if;

  insert into public.location_lesson_uploads (id, session_id, task_id, kind) values (p_id, p_session, p_task, p_kind);
  insert into public.location_lesson_files (id, upload_id, name, mime, size_bytes)
    select f.id, p_id, f.name, f.mime, f.size_bytes
    from jsonb_to_recordset(p_files) as f(id uuid, name text, mime text, size_bytes integer);
  return true;
end;
$$;

create function public.confirm_location_lesson_upload(p_id uuid, p_session uuid, p_kind text)
returns boolean language plpgsql set search_path = '' as $$
declare
  upload public.location_lesson_uploads%rowtype;
  lesson public.location_lessons%rowtype;
begin
  select * into strict upload from public.location_lesson_uploads
    where id = p_id and session_id = p_session and kind = p_kind for update;
  if upload.confirmed_at is not null then return true; end if;
  if upload.created_at < now() - interval '2 hours' then return false; end if;

  select * into strict lesson from public.location_lessons where session_id = p_session for share;
  perform 1 from public.sessions s join public.user_category_access w on w.id = s.workspace_id and w.user_id = s.user_id
    where s.id = p_session and s.user_id = lesson.owner_id
      and s.workspace_id = lesson.workspace_id and s.location = lesson.location
    for share of s;
  if not found then return false; end if;

  if p_kind = 'submission' then
    if not lesson.published then return false; end if;
    perform 1 from public.location_lesson_tasks
      where id = upload.task_id and session_id = p_session and published for share;
    if not found then return false; end if;
    insert into public.notifications (target_type, target_user_id, title, message, type, created_by, location_lesson_session_id)
      values ('user', lesson.owner_id, 'Compito consegnato', left(lesson.location, 120) || ' ha inviato una consegna.',
        'system', lesson.owner_id, lesson.session_id);
  end if;

  update public.location_lesson_uploads set confirmed_at = now() where id = upload.id;
  return true;
end;
$$;

revoke all on function public.reserve_location_lesson_upload(uuid, uuid, uuid, text, jsonb),
  public.confirm_location_lesson_upload(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.reserve_location_lesson_upload(uuid, uuid, uuid, text, jsonb),
  public.confirm_location_lesson_upload(uuid, uuid, text) to service_role;

commit;
