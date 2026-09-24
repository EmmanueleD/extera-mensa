begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

select has_table('public', 'daily_declarations', 'daily declarations table exists');
select has_pk('public', 'daily_declarations', 'daily declarations have a composite key');
select is(
  public.current_service_date(),
  (now() at time zone 'Europe/Rome')::date,
  'service date follows Europe/Rome'
);

insert into auth.users (id, instance_id, email, raw_user_meta_data)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'anna-daily@example.test',
    '{"display_name":"Anna Daily"}'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'luca-daily@example.test',
    '{"display_name":"Luca Daily"}'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select throws_like(
  $$ select public.set_today_declaration(true, null, null) $$,
  '%transport mode is required%',
  'attending requires a transport mode'
);
select lives_ok(
  $$ select public.set_today_declaration(true, 'needs_ride', null) $$,
  'a user can request a ride today'
);
select results_eq(
  $$
    select attending, transport_mode::text, car_capacity
    from public.daily_declarations
    where user_id = '10000000-0000-0000-0000-000000000001'
  $$,
  $$ values (true, 'needs_ride'::text, null::smallint) $$,
  'the declaration stores a consistent ride request'
);
select is(
  (select preferred_transport_mode::text from public.profiles where id = auth.uid()),
  'needs_ride',
  'the latest transport mode becomes the profile default'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
select throws_like(
  $$ select public.set_today_declaration(true, 'offers_car', 10::smallint) $$,
  '%car capacity must be between 1 and 9%',
  'car capacity is bounded'
);
select lives_ok(
  $$ select public.set_today_declaration(true, 'offers_car', 1::smallint) $$,
  'a driver can offer a valid car'
);
select is(
  (public.get_today_state() ->> 'ride_demand')::integer,
  1,
  'summary counts ride demand'
);
select is(
  (public.get_today_state() ->> 'passenger_supply')::integer,
  0,
  'the driver does not count as a passenger seat'
);
select is(
  (public.get_today_state() ->> 'missing_seats')::integer,
  1,
  'summary reports the exact shortage'
);
select is(
  jsonb_array_length(public.get_today_state() -> 'participants'),
  2,
  'summary lists all attendees'
);
select results_eq(
  $$
    select (participant ->> 'id')::uuid, (participant ->> 'declared_at')::timestamptz
    from jsonb_array_elements(public.get_today_state() -> 'participants') as participant
    order by 1
  $$,
  $$
    select user_id, created_at
    from public.daily_declarations
    where service_date = public.current_service_date() and attending
    order by 1
  $$,
  'each participant exposes when they declared today'
);
select is(
  public.get_today_state() -> 'own_declaration' ->> 'transport_mode',
  'offers_car',
  'summary identifies the current user declaration'
);
select lives_ok(
  $$ select public.set_today_declaration(true, 'offers_car', 5::smallint) $$,
  'today response can be replaced'
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select is(
  (public.get_today_state() ->> 'missing_seats')::integer,
  0,
  'enough passenger capacity clears the shortage'
);
select lives_ok(
  $$
    update public.daily_declarations set car_capacity = 9
    where user_id = '10000000-0000-0000-0000-000000000002'
  $$,
  'cross-user updates are filtered by RLS'
);
select is(
  (select car_capacity from public.daily_declarations where user_id = '10000000-0000-0000-0000-000000000002'),
  5::smallint,
  'another user declaration remains unchanged'
);
select throws_like(
  $$
    insert into public.daily_declarations (user_id, service_date, attending)
    values (auth.uid(), public.current_service_date() - 1, false)
  $$,
  '%violates row-level security policy%',
  'clients cannot create historical declarations'
);
select lives_ok(
  $$ select public.set_today_declaration(false, 'needs_ride', 3::smallint) $$,
  'answering no clears stale transport input'
);
select results_eq(
  $$
    select attending, transport_mode::text, car_capacity
    from public.daily_declarations
    where user_id = '10000000-0000-0000-0000-000000000001'
      and service_date = public.current_service_date()
  $$,
  $$ values (false, null::text, null::smallint) $$,
  'non-attendance persists without transport data'
);

select * from finish();
rollback;
