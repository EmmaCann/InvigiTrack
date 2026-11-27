begin;

alter table public.location_portal_links
  add column issuance_id uuid unique,
  add column created_at timestamptz,
  add column revoked_at timestamptz;

alter table public.location_portal_links alter column created_at set default now();

create index location_portal_links_workspace_idx
  on public.location_portal_links (owner_id, workspace_id, created_at desc nulls last, token_hash);

grant update (revoked_at) on public.location_portal_links to service_role;

commit;
