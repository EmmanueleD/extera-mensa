begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('public', 'profiles', 'profiles table exists');
select has_pk('public', 'profiles', 'profiles has a primary key');
select hasnt_column('public', 'profiles', 'email', 'profiles never expose email');

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'anna@example.test',
    'unused',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Anna"}'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'luca@example.test',
    'unused',
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Luca"}'
  );

select is(
  (select count(*) from public.profiles),
  2::bigint,
  'auth identities create profiles'
);
select ok(
  (select bool_and(avatar_seed is not null) from public.profiles),
  'profiles receive persistent avatar seeds'
);
select throws_like(
  $$
    insert into auth.users (id, instance_id, email, raw_user_meta_data)
    values (
      '00000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      'duplicate@example.test',
      '{"display_name":"anna"}'
    )
  $$,
  '%duplicate key value violates unique constraint "profiles_display_name_unique"%',
  'duplicate display names are rejected case-insensitively'
);
select throws_like(
  $$ update public.profiles set message = repeat('x', 141) where display_name = 'Anna' $$,
  '%violates check constraint "profiles_message_length"%',
  'messages longer than 140 characters are rejected'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

select results_eq(
  $$ select display_name from public.profiles order by display_name $$,
  $$ values ('Anna'::text), ('Luca'::text) $$,
  'authenticated users can read shared profiles'
);
select lives_ok(
  $$ update public.profiles set display_name = 'Anna Maria' where id = '00000000-0000-0000-0000-000000000001' $$,
  'users can update their own profile'
);
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000001'),
  'Anna Maria',
  'own profile update is persisted'
);
select lives_ok(
  $$ update public.profiles set display_name = 'Intruso' where id = '00000000-0000-0000-0000-000000000002' $$,
  'cross-profile update is filtered by RLS'
);
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000002'),
  'Luca',
  'another profile remains unchanged'
);
select throws_like(
  $$ update public.profiles set preferred_transport_mode = 'autonomous' where id = '00000000-0000-0000-0000-000000000001' $$,
  '%permission denied for table profiles%',
  'clients cannot edit the remembered transport mode directly'
);

reset role;
select throws_like(
  $$ update public.profiles set avatar_color = 'untrusted-css' where display_name = 'Luca' $$,
  '%violates check constraint "profiles_avatar_color_palette"%',
  'avatar colors are restricted to the curated palette'
);

select * from finish();
rollback;
