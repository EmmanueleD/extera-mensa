-- Expose when each participant declared today so clients can assign car seats
-- in a stable arrival order. The signature and security model are unchanged.
create or replace function public.get_today_state()
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
      d.car_capacity,
      d.created_at as declared_at
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
