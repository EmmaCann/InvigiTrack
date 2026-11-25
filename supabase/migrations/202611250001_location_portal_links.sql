begin;

create table public.location_portal_links (
  token_hash text primary key check (length(token_hash) = 64),
  owner_id uuid not null,
  workspace_id uuid not null,
  location text not null check (length(location) between 1 and 500)
);

alter table public.location_portal_links enable row level security;
revoke all on public.location_portal_links from public, anon, authenticated;
grant select, insert on public.location_portal_links to service_role;

commit;
