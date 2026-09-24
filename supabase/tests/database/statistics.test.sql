begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

insert into auth.users (id, instance_id, email, raw_user_meta_data)
values
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'anna-stats@example.test',
    '{"display_name":"Anna"}'
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'luca-stats@example.test',
    '{"display_name":"Luca"}'
  ),
  (
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'marco-stats@example.test',
    '{"display_name":"Marco"}'
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'bruno-stats@example.test',
    '{"display_name":"Bruno"}'
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'giulia-stats@example.test',
    '{"display_name":"Giulia"}'
  );

insert into public.daily_declarations (user_id, service_date, attending, transport_mode)
values
  ('20000000-0000-0000-0000-000000000001', public.current_service_date(), true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000001', public.current_service_date() - 1, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000001', public.current_service_date() - 2, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000001', public.current_service_date() - 5, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000001', public.current_service_date() - 40, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000002', public.current_service_date(), true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000002', public.current_service_date() - 1, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000002', public.current_service_date() - 2, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000003', public.current_service_date(), true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000004', public.current_service_date(), true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000005', public.current_service_date() - 40, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000005', public.current_service_date() - 100, true, 'autonomous'),
  ('20000000-0000-0000-0000-000000000005', public.current_service_date(), false, null);

select has_function(
  'public',
  'get_attendance_statistics',
  array['text'],
  'statistics RPC exists'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-000000000001', true);

select throws_like(
  $$ select public.get_attendance_statistics('14') $$,
  '%unsupported statistics range%',
  'unsupported ranges are rejected'
);

select is(
  jsonb_array_length(public.get_attendance_statistics('7') -> 'points'),
  7,
  'the 7-day range yields seven bounded dates'
);
select is(
  (public.get_attendance_statistics('7') -> 'points' -> 0 ->> 'service_date')::date,
  public.current_service_date() - 6,
  'the 7-day range starts six Rome days before today'
);
select is(
  (public.get_attendance_statistics('7') -> 'points' -> -1 ->> 'service_date')::date,
  public.current_service_date(),
  'the 7-day range ends on the current Rome date'
);
select is(
  (public.get_attendance_statistics('7') -> 'points' -> 0 ->> 'attending_count')::integer,
  0,
  'a bounded date without attendance reports zero'
);
select is(
  (public.get_attendance_statistics('7') -> 'points' -> -1 ->> 'attending_count')::integer,
  4,
  'the current date reports the attending total'
);
select is(
  (
    select (elem ->> 'attending_count')::integer
    from jsonb_array_elements(public.get_attendance_statistics('90') -> 'points') elem
    where (elem ->> 'service_date')::date = public.current_service_date() - 40
  ),
  2,
  'the 90-day range counts every declaration beyond 30 days'
);
select is(
  jsonb_array_length(public.get_attendance_statistics('30') -> 'points'),
  30,
  'the 30-day range yields thirty bounded dates'
);
select is(
  jsonb_array_length(public.get_attendance_statistics('90') -> 'points'),
  90,
  'the 90-day range yields ninety bounded dates'
);
select is(
  jsonb_array_length(public.get_attendance_statistics('7') -> 'points' -> -1 -> 'participants'),
  4,
  'point details list every attending profile'
);
select is(
  public.get_attendance_statistics('7') -> 'points' -> -1 -> 'participants' -> 0 ->> 'display_name',
  'Anna',
  'point details are ordered by normalized display name'
);
select ok(
  not exists (
    select 1
    from jsonb_array_elements(
      public.get_attendance_statistics('7') -> 'points' -> -1 -> 'participants'
    ) elem
    where elem ->> 'display_name' = 'Giulia'
  ),
  'non-attending declarations are excluded from details'
);
select is(
  (public.get_attendance_statistics('all') -> 'points' -> 0 ->> 'service_date')::date,
  public.current_service_date() - 100,
  'the all-history range starts at the earliest stored declaration'
);
select is(
  (public.get_attendance_statistics('all') -> 'points' -> -1 ->> 'service_date')::date,
  public.current_service_date(),
  'the all-history range ends on the current Rome date'
);
select is(
  jsonb_array_length(public.get_attendance_statistics('all') -> 'points'),
  101,
  'the all-history range yields every stored-to-current date'
);
select results_eq(
  $$
    select elem ->> 'display_name'
    from jsonb_array_elements(public.get_attendance_statistics('7') -> 'ranking') elem
  $$,
  $$ values ('Anna'::text), ('Luca'::text), ('Bruno'::text), ('Marco'::text) $$,
  'ranking orders by attendance then normalized display name'
);
select results_eq(
  $$
    select (elem ->> 'attendance_count')::integer
    from jsonb_array_elements(public.get_attendance_statistics('7') -> 'ranking') elem
  $$,
  $$ values (4), (3), (1), (1) $$,
  'ranking reports same-range attendance totals'
);
select results_eq(
  $$
    select elem ->> 'display_name'
    from jsonb_array_elements(public.get_attendance_statistics('all') -> 'ranking') elem
  $$,
  $$ values ('Anna'::text), ('Luca'::text), ('Giulia'::text), ('Bruno'::text), ('Marco'::text) $$,
  'the all-history ranking spans stored declarations'
);

select set_config('request.jwt.claim.sub', '', true);
select throws_like(
  $$ select public.get_attendance_statistics('30') $$,
  '%authentication required%',
  'statistics require an authenticated identity'
);

reset role;
set local role anon;
select throws_like(
  $$ select public.get_attendance_statistics('30') $$,
  '%permission denied%',
  'anonymous callers cannot execute statistics'
);

select * from finish();
rollback;
