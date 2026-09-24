begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ),
  'profile changes are published'
);
select ok(
  exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'daily_declarations'
  ),
  'declaration changes are published'
);
select policies_are(
  'realtime',
  'messages',
  array[
    'Authenticated users can join cafeteria realtime',
    'Authenticated users can track cafeteria presence'
  ],
  'private channel has only the intended authorization policies'
);
select results_eq(
  $$
    select cmd from pg_policies
    where schemaname = 'realtime'
      and tablename = 'messages'
      and policyname like 'Authenticated users can % cafeteria %'
    order by cmd
  $$,
  $$ values ('INSERT'::text), ('SELECT'::text) $$,
  'presence authorization separates join and track capabilities'
);

select * from finish();
rollback;
