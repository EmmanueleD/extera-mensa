create function public.current_service_date()
returns date
language sql
stable
security invoker
set search_path = ''
as $$
  select (now() at time zone 'Europe/Rome')::date
$$;

create table public.daily_declarations (
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_date date not null,
  attending boolean not null,
  transport_mode public.transport_mode,
  car_capacity smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, service_date),
  constraint daily_declarations_state check (
    (not attending and transport_mode is null and car_capacity is null)
    or
    (
      attending
      and transport_mode is not null
      and (
        (transport_mode = 'offers_car' and car_capacity between 1 and 9)
        or (transport_mode <> 'offers_car' and car_capacity is null)
      )
    )
  )
);

create trigger daily_declarations_set_updated_at
before update on public.daily_declarations
for each row execute function public.set_updated_at();

alter table public.daily_declarations enable row level security;

create policy "Authenticated users can read declarations"
  on public.daily_declarations for select to authenticated using (true);
create policy "Users can insert their current declaration"
  on public.daily_declarations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and service_date = public.current_service_date()
  );
create policy "Users can update their current declaration"
  on public.daily_declarations for update to authenticated
  using (
    user_id = (select auth.uid())
    and service_date = public.current_service_date()
  )
  with check (
    user_id = (select auth.uid())
    and service_date = public.current_service_date()
  );

revoke all on table public.daily_declarations from anon;
grant select, insert, update on table public.daily_declarations to authenticated;

create function public.set_today_declaration(
  p_attending boolean,
  p_transport_mode public.transport_mode default null,
  p_car_capacity smallint default null
)
returns public.daily_declarations
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  saved public.daily_declarations;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_attending and p_transport_mode is null then
    raise exception 'transport mode is required' using errcode = '23514';
  end if;
  if p_attending and p_transport_mode = 'offers_car'
     and (p_car_capacity is null or p_car_capacity not between 1 and 9) then
    raise exception 'car capacity must be between 1 and 9' using errcode = '23514';
  end if;
  if p_attending and p_transport_mode <> 'offers_car' and p_car_capacity is not null then
    raise exception 'car capacity is only valid when offering a car' using errcode = '23514';
  end if;

  insert into public.daily_declarations (
    user_id, service_date, attending, transport_mode, car_capacity
  ) values (
    actor_id,
    public.current_service_date(),
    p_attending,
    case when p_attending then p_transport_mode else null end,
    case when p_attending and p_transport_mode = 'offers_car' then p_car_capacity else null end
  )
  on conflict (user_id, service_date) do update set
    attending = excluded.attending,
    transport_mode = excluded.transport_mode,
    car_capacity = excluded.car_capacity
  returning * into saved;

  if p_attending then
    update public.profiles
    set preferred_transport_mode = p_transport_mode
    where id = actor_id;
  end if;

  return saved;
end;
$$;

revoke all on function public.set_today_declaration(boolean, public.transport_mode, smallint) from public;
grant execute on function public.set_today_declaration(boolean, public.transport_mode, smallint) to authenticated;

create function public.get_today_state()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with participants as (
    select
      p.id,
      p.display_name,
      p.message,
      p.avatar_seed,
      p.avatar_color,
      p.message_text_color,
      d.transport_mode,
      d.car_capacity
    from public.daily_declarations d
    join public.profiles p on p.id = d.user_id
    where d.service_date = public.current_service_date()
      and d.attending
    order by lower(p.display_name), p.id
  ), totals as (
    select
      count(*) filter (where transport_mode = 'needs_ride')::integer as ride_demand,
      coalesce(sum(car_capacity - 1) filter (where transport_mode = 'offers_car'), 0)::integer as passenger_supply
    from participants
  )
  select jsonb_build_object(
    'service_date', public.current_service_date(),
    'own_declaration', (
      select to_jsonb(d) - 'created_at' - 'updated_at'
      from public.daily_declarations d
      where d.user_id = auth.uid()
        and d.service_date = public.current_service_date()
    ),
    'preferred_transport_mode', (
      select preferred_transport_mode from public.profiles where id = auth.uid()
    ),
    'participants', coalesce((select jsonb_agg(to_jsonb(participants)) from participants), '[]'::jsonb),
    'ride_demand', totals.ride_demand,
    'passenger_supply', totals.passenger_supply,
    'missing_seats', greatest(0, totals.ride_demand - totals.passenger_supply)
  )
  from totals
$$;

revoke all on function public.get_today_state() from public;
grant execute on function public.get_today_state() to authenticated;
