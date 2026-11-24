begin;

create function public.set_client_workspace_enabled(p_workspace uuid, p_user uuid, p_enabled boolean)
returns void language plpgsql set search_path = '' as $$
begin
  update public.user_category_access set clients_enabled = p_enabled,
    retain_session_history = retain_session_history or p_enabled
    where id = p_workspace and user_id = p_user;
  if not found then raise exception 'Workspace non disponibile'; end if;
  if not p_enabled then
    delete from public.client_links a using public.clients c
      where a.client_id = c.id and c.workspace_id = p_workspace and c.user_id = p_user;
  end if;
end;
$$;

create function public.generate_client_link(p_client uuid, p_user uuid, p_workspace uuid, p_hash text)
returns void language plpgsql set search_path = '' as $$
begin
  perform 1 from public.user_category_access
    where id = p_workspace and user_id = p_user and clients_enabled for update;
  if not found then raise exception 'Workspace non disponibile'; end if;
  perform 1 from public.clients
    where id = p_client and user_id = p_user and workspace_id = p_workspace and disabled_at is null for update;
  if not found then raise exception 'Cliente non disponibile'; end if;
  insert into public.client_links (client_id, secret_hash) values (p_client, p_hash)
    on conflict (client_id) do update set secret_hash = excluded.secret_hash;
end;
$$;

create function public.guard_client_workspace_flags()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if old.retain_session_history and not new.retain_session_history then
      raise exception 'La conservazione dello storico resta attiva';
    end if;
    if (old.clients_enabled, old.retain_session_history) is not distinct from
       (new.clients_enabled, new.retain_session_history) then return new; end if;
  elsif not new.clients_enabled and not new.retain_session_history then
    return new;
  end if;
  if current_user in ('anon', 'authenticated') then raise exception 'Modifica non autorizzata'; end if;
  return new;
end;
$$;

create trigger guard_client_workspace_flags before insert or update on public.user_category_access
for each row execute function public.guard_client_workspace_flags();

create function public.guard_lesson_removal()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.client_lesson_id is not null then raise exception 'La voce contiene materiale didattico'; end if;
  return old;
end;
$$;
create trigger guard_session_lesson_removal before delete on public.sessions
for each row execute function public.guard_lesson_removal();
create trigger guard_event_lesson_removal before delete on public.calendar_events
for each row execute function public.guard_lesson_removal();

create function public.delete_workspace_data(p_user uuid, p_workspace uuid)
returns void language plpgsql set search_path = '' as $$
declare
  retain_history boolean;
begin
  if p_user is distinct from auth.uid() then raise exception 'Operazione non autorizzata'; end if;
  select retain_session_history into strict retain_history from public.user_category_access
    where id = p_workspace and user_id = p_user for update;
  if retain_history then raise exception 'Il workspace conserva i dati dell’area clienti'; end if;

  delete from public.payment_sessions j using public.sessions s
    where j.session_id = s.id and s.user_id = p_user and s.workspace_id = p_workspace;
  delete from public.sessions where user_id = p_user and workspace_id = p_workspace;
  delete from public.calendar_events where user_id = p_user and workspace_id = p_workspace;
  delete from public.user_category_access where user_id = p_user and id = p_workspace;
end;
$$;
revoke all on function public.delete_workspace_data(uuid,uuid) from public, anon;
grant execute on function public.delete_workspace_data(uuid,uuid) to authenticated;

revoke all on function public.set_client_workspace_enabled(uuid,uuid,boolean),
  public.generate_client_link(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.set_client_workspace_enabled(uuid,uuid,boolean),
  public.generate_client_link(uuid,uuid,uuid,text) to service_role;
revoke all on public.sessions, public.calendar_events, public.payment_sessions, public.payments from anon;

commit;
