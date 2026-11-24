begin;

alter table public.user_category_access
  add column clients_enabled boolean not null default false,
  add column retain_session_history boolean not null default false,
  add constraint client_workspace_owner unique (id, user_id),
  add constraint client_workspace_history check (not clients_enabled or retain_session_history);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  workspace_id uuid not null,
  name text not null check (length(btrim(name)) between 1 and 120),
  disabled_at timestamptz,
  foreign key (workspace_id, user_id) references public.user_category_access (id, user_id) on delete restrict,
  unique (id, user_id, workspace_id)
);

create table public.client_links (
  client_id uuid primary key references public.clients on delete cascade,
  secret_hash text not null check (length(secret_hash) = 64)
);

create table public.client_lessons (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients on delete restrict,
  title text not null default '',
  topics text not null default '',
  description text not null default '',
  published boolean not null default false,
  unique (id, client_id)
);

alter table public.sessions
  add column archived_at timestamptz,
  add column client_id uuid,
  add column client_lesson_id uuid unique,
  add constraint session_client_scope foreign key (client_id, user_id, workspace_id)
    references public.clients (id, user_id, workspace_id),
  add constraint session_lesson_scope foreign key (client_lesson_id, client_id)
    references public.client_lessons (id, client_id),
  add constraint session_client_workspace check (client_id is null or (workspace_id is not null and user_id is not null)),
  add constraint session_lesson_client check (client_lesson_id is null or client_id is not null);

alter table public.calendar_events
  add column client_id uuid,
  add column client_lesson_id uuid unique,
  add constraint event_client_scope foreign key (client_id, user_id, workspace_id)
    references public.clients (id, user_id, workspace_id),
  add constraint event_lesson_scope foreign key (client_lesson_id, client_id)
    references public.client_lessons (id, client_id),
  add constraint event_client_workspace check (client_id is null or (workspace_id is not null and user_id is not null)),
  add constraint event_lesson_client check (client_lesson_id is null or client_id is not null);

create index on public.clients (user_id, workspace_id);
create index on public.sessions (client_id, session_date);
create index on public.calendar_events (client_id, event_date);

create table public.client_rate_limits (
  scope text primary key,
  window_start timestamptz not null,
  attempts integer not null
);

create function public.client_rate_limit(p_scope text, p_limit integer)
returns boolean language sql set search_path = '' as $$
  insert into public.client_rate_limits as limits values (p_scope, now(), 1)
  on conflict (scope) do update
    set attempts = case when limits.window_start <= now() - interval '1 minute'
                        then 1 else least(limits.attempts + 1, p_limit + 1) end,
        window_start = case when limits.window_start <= now() - interval '1 minute'
                            then now() else limits.window_start end
  returning attempts <= p_limit;
$$;

alter table public.clients enable row level security;
alter table public.client_links enable row level security;
alter table public.client_lessons enable row level security;
alter table public.client_rate_limits enable row level security;
revoke all on public.clients, public.client_links, public.client_lessons, public.client_rate_limits from anon, authenticated;
revoke all on function public.client_rate_limit(text, integer) from public, anon, authenticated;
grant execute on function public.client_rate_limit(text, integer) to service_role;
grant all on public.clients, public.client_links, public.client_lessons, public.client_rate_limits to service_role;

commit;
