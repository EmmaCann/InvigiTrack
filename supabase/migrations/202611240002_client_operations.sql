begin;

create function public.convert_calendar_event(
  p_user uuid, p_workspace uuid, p_event uuid, p_start time, p_end time,
  p_rate numeric, p_notes text, p_role text
) returns uuid language plpgsql set search_path = '' as $$
declare
  event_row public.calendar_events%rowtype;
  workspace_category uuid;
  new_session uuid;
begin
  if p_user is distinct from auth.uid() or p_end <= p_start or p_rate < 0 then
    raise exception 'Conversione non valida';
  end if;
  select category_id into strict workspace_category from public.user_category_access
    where id = p_workspace and user_id = p_user;
  select * into strict event_row from public.calendar_events
    where id = p_event and user_id = p_user and workspace_id = p_workspace for update;
  if event_row.is_converted then return event_row.converted_session_id; end if;

  insert into public.sessions (
    user_id, workspace_id, category_id, session_date, start_time, end_time,
    hourly_rate, earned, location, notes, metadata, client_id, client_lesson_id
  ) values (
    p_user, p_workspace, workspace_category, event_row.event_date, p_start, p_end,
    p_rate, round(extract(epoch from (p_end - p_start)) / 3600 * p_rate, 2),
    event_row.location, p_notes,
    jsonb_strip_nulls(jsonb_build_object('exam_name', event_row.title, 'role_type', p_role)),
    event_row.client_id, event_row.client_lesson_id
  ) returning id into new_session;

  update public.calendar_events set is_converted = true, converted_session_id = new_session
    where id = event_row.id;
  if not found then raise exception 'Aggiornamento dell’appuntamento non riuscito'; end if;
  return new_session;
end;
$$;
revoke all on function public.convert_calendar_event(uuid, uuid, uuid, time, time, numeric, text, text) from public, anon;
grant execute on function public.convert_calendar_event(uuid, uuid, uuid, time, time, numeric, text, text) to authenticated;

create function public.prevent_client_workspace_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.retain_session_history or exists (
    select 1 from public.clients where workspace_id = old.id and user_id = old.user_id
  ) then raise exception 'Il workspace contiene dati dell’area clienti'; end if;
  return old;
end;
$$;
create trigger protect_client_workspace before delete on public.user_category_access
for each row execute function public.prevent_client_workspace_delete();

create function public.protect_archived_session()
returns trigger language plpgsql set search_path = '' as $$
begin
  if old.archived_at is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  if tg_op = 'DELETE' then raise exception 'La sessione è archiviata'; end if;
  if (new.archived_at, new.user_id, new.workspace_id, new.category_id, new.session_date,
      new.start_time, new.end_time, new.hourly_rate, new.earned)
    is distinct from
     (old.archived_at, old.user_id, old.workspace_id, old.category_id, old.session_date,
      old.start_time, old.end_time, old.hourly_rate, old.earned) then
    raise exception 'I dati economici della sessione archiviata sono congelati';
  end if;
  return new;
end;
$$;
create trigger protect_archived_session before update or delete on public.sessions
for each row execute function public.protect_archived_session();

create unique index client_year_archive_scope on public.yearly_archives (user_id, workspace_id, year);

create function public.archive_workspace_sessions(p_user uuid, p_workspace uuid, p_year integer)
returns jsonb language plpgsql set search_path = '' as $$
declare
  snapshot public.sessions[];
  retain_history boolean;
  affected integer;
begin
  if p_user is distinct from auth.uid() or p_year >= extract(year from now() at time zone 'Europe/Rome') then
    raise exception 'Anno non archiviabile';
  end if;
  select retain_session_history into strict retain_history from public.user_category_access
    where id = p_workspace and user_id = p_user for update;

  select array_agg(candidate.session_row) into snapshot from (
    select s as session_row from public.sessions s
    where s.user_id = p_user and s.workspace_id = p_workspace and s.archived_at is null
      and s.session_date >= make_date(p_year, 1, 1) and s.session_date < make_date(p_year + 1, 1, 1)
    for update
  ) candidate;
  if snapshot is null then raise exception 'Nessuna sessione da archiviare'; end if;

  insert into public.yearly_archives (
    user_id, workspace_id, year, total_sessions, total_hours, total_earned, total_paid, total_unpaid, archive_data
  )
  with year_sessions as (select * from unnest(snapshot)),
  monthly as (
    select m as month, count(r.id) as sessions, coalesce(sum(r.duration_minutes),0) / 60.0 as hours,
      coalesce(sum(r.earned),0) as earned,
      coalesce(sum(r.earned) filter (where r.payment_status = 'paid'),0) as paid,
      coalesce(sum(r.earned) filter (where r.payment_status <> 'paid'),0) as unpaid
    from generate_series(1,12) m left join year_sessions r on extract(month from r.session_date) = m
    group by m
  ),
  weekdays as (
    select d as day, count(r.id) as sessions
    from generate_series(0,6) d left join year_sessions r on extract(isodow from r.session_date) - 1 = d group by d
  ),
  locations as (
    select location as name, count(*) as sessions from year_sessions where location <> ''
    group by location order by sessions desc, name limit 5
  )
  select p_user, p_workspace, p_year, count(*), round(sum(duration_minutes)::numeric/60.0,2), round(sum(earned)::numeric,2),
    round(coalesce(sum(earned) filter (where payment_status = 'paid'),0)::numeric,2),
    round(coalesce(sum(earned) filter (where payment_status <> 'paid'),0)::numeric,2),
    jsonb_build_object(
      'monthly', (select jsonb_agg(to_jsonb(m) order by m.month) from monthly m),
      'day_of_week', (select jsonb_agg(to_jsonb(d) order by d.day) from weekdays d),
      'top_locations', coalesce((select jsonb_agg(to_jsonb(l) order by l.sessions desc, l.name) from locations l), '[]'::jsonb)
    )
  from year_sessions;

  if retain_history then
    update public.sessions s set archived_at = now()
      where s.id in (select id from unnest(snapshot));
  else
    delete from public.sessions s where s.id in (select id from unnest(snapshot));
  end if;
  get diagnostics affected = row_count;
  if affected <> cardinality(snapshot) then raise exception 'Archiviazione incompleta'; end if;
  return to_jsonb(snapshot);
end;
$$;
revoke all on function public.archive_workspace_sessions(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.archive_workspace_sessions(uuid, uuid, integer) to authenticated;

create function public.save_client_lesson(
  p_user uuid, p_workspace uuid, p_client uuid, p_source uuid, p_event boolean,
  p_title text, p_topics text, p_description text, p_published boolean
) returns void language plpgsql set search_path = '' as $$
declare
  lesson uuid;
begin
  perform 1 from public.clients c join public.user_category_access w
    on w.id = c.workspace_id and w.user_id = c.user_id
    where c.id = p_client and c.user_id = p_user and c.workspace_id = p_workspace
      and c.disabled_at is null and w.clients_enabled;
  if not found then raise exception 'Cliente non disponibile'; end if;

  if p_event then
    select client_lesson_id into strict lesson from public.calendar_events
      where id = p_source and user_id = p_user and workspace_id = p_workspace
        and client_id = p_client and not is_converted for update;
  else
    select client_lesson_id into strict lesson from public.sessions
      where id = p_source and user_id = p_user and workspace_id = p_workspace
        and client_id = p_client for update;
  end if;

  if lesson is null then
    insert into public.client_lessons (client_id) values (p_client) returning id into lesson;
    if p_event then
      update public.calendar_events set client_lesson_id = lesson where id = p_source;
    else
      update public.sessions set client_lesson_id = lesson where id = p_source;
    end if;
  end if;
  update public.client_lessons set title = p_title, topics = p_topics,
    description = p_description, published = p_published where id = lesson and client_id = p_client;
end;
$$;
revoke all on function public.save_client_lesson(uuid, uuid, uuid, uuid, boolean, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.save_client_lesson(uuid, uuid, uuid, uuid, boolean, text, text, text, boolean) to service_role;

commit;
