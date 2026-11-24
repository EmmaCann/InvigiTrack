begin;
create function public.set_client_disabled(p_client uuid, p_user uuid, p_workspace uuid, p_disabled boolean)
returns void language plpgsql set search_path = '' as $$
begin
  update public.clients set disabled_at = case when p_disabled then now() end
    where id = p_client and user_id = p_user and workspace_id = p_workspace;
  if not found then raise exception 'Cliente non disponibile'; end if;
  if p_disabled then delete from public.client_links where client_id = p_client; end if;
end;
$$;

create function public.associate_client_history(p_client uuid, p_user uuid, p_workspace uuid, p_sessions uuid[], p_events uuid[])
returns void language plpgsql set search_path = '' as $$
declare
  affected integer;
begin
  perform 1 from public.clients c join public.user_category_access w on w.id = c.workspace_id and w.user_id = c.user_id
    where c.id = p_client and c.user_id = p_user and c.workspace_id = p_workspace and c.disabled_at is null and w.clients_enabled
    for update of c;
  if not found then raise exception 'Cliente non disponibile'; end if;

  update public.calendar_events set client_id = p_client
    where id = any(p_events) and user_id = p_user and workspace_id = p_workspace and client_id is null
      and (not is_converted or converted_session_id = any(p_sessions));
  get diagnostics affected = row_count;
  if affected <> cardinality(p_events) then raise exception 'Appuntamenti non disponibili'; end if;

  update public.sessions set client_id = p_client
    where id = any(p_sessions) and user_id = p_user and workspace_id = p_workspace and client_id is null;
  get diagnostics affected = row_count;
  if affected <> cardinality(p_sessions) then raise exception 'Sessioni non disponibili'; end if;

  update public.calendar_events set client_id = p_client
    where converted_session_id = any(p_sessions) and is_converted
      and user_id = p_user and workspace_id = p_workspace and client_id is null;
end;
$$;

revoke all on function public.set_client_disabled(uuid, uuid, uuid, boolean),
  public.associate_client_history(uuid, uuid, uuid, uuid[], uuid[]) from public, anon, authenticated;
grant execute on function public.set_client_disabled(uuid, uuid, uuid, boolean),
  public.associate_client_history(uuid, uuid, uuid, uuid[], uuid[]) to service_role;
commit;
