begin;

create table public.client_tasks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.client_lessons on delete restrict,
  title text not null check (length(btrim(title)) between 1 and 160),
  instructions text not null default '' check (length(instructions) <= 6000),
  due_date date,
  published boolean not null default false
);
create index on public.client_tasks (lesson_id);

create table public.client_uploads (
  id uuid primary key,
  client_id uuid not null references public.clients on delete restrict,
  lesson_id uuid references public.client_lessons on delete restrict,
  task_id uuid references public.client_tasks on delete restrict,
  kind text not null check (kind in ('material', 'attachment', 'submission')),
  access_hash text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  check ((kind = 'material' and lesson_id is not null and task_id is null)
    or (kind <> 'material' and task_id is not null and lesson_id is null)),
  check ((kind = 'submission') = (access_hash is not null))
);
create index on public.client_uploads (client_id, created_at);
create index on public.client_uploads (lesson_id);
create index on public.client_uploads (task_id);

create table public.client_files (
  id uuid primary key,
  upload_id uuid not null references public.client_uploads on delete cascade,
  filename text not null,
  mime text not null,
  size_bytes integer not null check (size_bytes between 1 and 20971520)
);
create index on public.client_files (upload_id);

alter table public.notifications add column client_submission_id uuid unique
  references public.client_uploads on delete restrict;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-files', 'client-files', false, 20971520,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'image/jpeg', 'image/png']);

create policy client_files_private on storage.objects as restrictive
  for all to anon, authenticated
  using (bucket_id <> 'client-files') with check (bucket_id <> 'client-files');

create function public.client_upload_allowed(
  p_client uuid, p_kind text, p_target uuid, p_owner uuid, p_workspace uuid, p_hash text
) returns boolean language sql set search_path = '' as $$
  select exists (
    select 1 from public.clients c
    join public.user_category_access w on w.id = c.workspace_id and w.user_id = c.user_id
    join public.client_lessons l on l.client_id = c.id
    left join public.client_tasks t on t.lesson_id = l.id and t.id = p_target
    where c.id = p_client and c.disabled_at is null and w.clients_enabled
      and ((p_kind = 'material' and l.id = p_target) or (p_kind in ('attachment', 'submission') and t.id is not null))
      and (
        exists (select 1 from public.sessions s where s.client_lesson_id = l.id
          and s.user_id = c.user_id and s.workspace_id = c.workspace_id and s.client_id = c.id)
        or exists (select 1 from public.calendar_events e where e.client_lesson_id = l.id and not e.is_converted
          and e.user_id = c.user_id and e.workspace_id = c.workspace_id and e.client_id = c.id)
      )
      and case when p_kind = 'submission' then l.published and t.published and exists (
        select 1 from public.client_links a where a.client_id = c.id and a.secret_hash = p_hash
      ) else c.user_id = p_owner and c.workspace_id = p_workspace end
  );
$$;

create function public.client_file_allowed(
  p_client uuid, p_lesson uuid, p_task uuid, p_owner uuid, p_workspace uuid, p_hash text
) returns boolean language sql set search_path = '' as $$
  select case when p_hash is null then
    public.client_upload_allowed(p_client, 'material', p_lesson, p_owner, p_workspace, null)
  when p_task is not null then
    public.client_upload_allowed(p_client, 'submission', p_task, null, null, p_hash)
  else exists (
    select 1 from public.clients c join public.client_lessons l on c.id = l.client_id
    join public.client_links a on a.client_id = c.id
    where c.id = p_client and l.id = p_lesson and l.published and a.secret_hash = p_hash
      and public.client_upload_allowed(p_client, 'material', l.id, c.user_id, c.workspace_id, null)
  ) end;
$$;
revoke all on function public.client_file_allowed(uuid,uuid,uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.client_file_allowed(uuid,uuid,uuid,uuid,uuid,text) to service_role;

create function public.reserve_client_upload(
  p_id uuid, p_client uuid, p_kind text, p_target uuid, p_owner uuid, p_workspace uuid, p_hash text, p_files jsonb
) returns void language plpgsql set search_path = '' as $$
declare
  requested_size bigint;
  used_size bigint;
  batch_count integer;
begin
  perform 1 from public.clients where id = p_client for update;
  if not public.client_upload_allowed(p_client, p_kind, p_target, p_owner, p_workspace, p_hash) then
    raise exception 'Accesso non valido';
  end if;
  if jsonb_array_length(p_files) not between 1 and 5 then raise exception 'Numero di file non valido'; end if;

  -- Pending signed paths can accept any object up to the bucket limit.
  requested_size := jsonb_array_length(p_files)::bigint * 20971520;
  select count(distinct u.id),
    coalesce(sum(case when u.confirmed_at is null then 20971520 else f.size_bytes end), 0)
    into batch_count, used_size
    from public.client_uploads u join public.client_files f on f.upload_id = u.id
    where u.client_id = p_client and u.created_at >= now() - interval '1 day'
      and (u.kind = 'submission') = (p_kind = 'submission');
  if batch_count >= 30 or used_size + requested_size > 524288000 then raise exception 'Quota giornaliera raggiunta'; end if;

  insert into public.client_uploads (id, client_id, kind, lesson_id, task_id, access_hash)
    values (p_id, p_client, p_kind, case when p_kind = 'material' then p_target end,
      case when p_kind <> 'material' then p_target end, p_hash);
  insert into public.client_files (id, upload_id, filename, mime, size_bytes)
    select f.id, p_id, f.filename, f.mime, f.size_bytes
    from jsonb_to_recordset(p_files) as f(id uuid, filename text, mime text, size_bytes integer);
end;
$$;

create function public.confirm_client_upload(
  p_id uuid, p_client uuid, p_owner uuid, p_workspace uuid, p_hash text
) returns void language plpgsql set search_path = '' as $$
declare
  batch public.client_uploads%rowtype;
  owner_id uuid;
begin
  perform 1 from public.clients where id = p_client for update;
  select * into strict batch from public.client_uploads where id = p_id and client_id = p_client for update;
  if batch.access_hash is distinct from p_hash or not public.client_upload_allowed(
    p_client, batch.kind, coalesce(batch.lesson_id, batch.task_id), p_owner, p_workspace, p_hash
  ) then raise exception 'Accesso non valido'; end if;
  if batch.confirmed_at is not null then return; end if;
  if batch.created_at < now() - interval '2 hours' then raise exception 'Caricamento scaduto'; end if;

  update public.client_uploads set confirmed_at = now() where id = p_id;
  if batch.kind = 'submission' then
    select user_id into strict owner_id from public.clients where id = p_client;
    insert into public.notifications (target_type, target_user_id, title, message, type, created_by, client_submission_id)
      values ('user', owner_id, 'Compito consegnato', 'È disponibile una nuova consegna nell’area clienti.',
        'system', owner_id, p_id);
  end if;
end;
$$;

alter table public.client_tasks enable row level security;
alter table public.client_uploads enable row level security;
alter table public.client_files enable row level security;
revoke all on public.client_tasks, public.client_uploads, public.client_files from anon, authenticated;
grant all on public.client_tasks, public.client_uploads, public.client_files to service_role;
revoke all on function public.client_upload_allowed(uuid,text,uuid,uuid,uuid,text),
  public.reserve_client_upload(uuid,uuid,text,uuid,uuid,uuid,text,jsonb),
  public.confirm_client_upload(uuid,uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.client_upload_allowed(uuid,text,uuid,uuid,uuid,text),
  public.reserve_client_upload(uuid,uuid,text,uuid,uuid,uuid,text,jsonb),
  public.confirm_client_upload(uuid,uuid,uuid,uuid,text) to service_role;

commit;
