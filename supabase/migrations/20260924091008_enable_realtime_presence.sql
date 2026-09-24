alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.daily_declarations;

create policy "Authenticated users can join cafeteria realtime"
on realtime.messages
for select
to authenticated
using ((select realtime.topic()) = 'cafeteria:global');

create policy "Authenticated users can track cafeteria presence"
on realtime.messages
for insert
to authenticated
with check (
  (select realtime.topic()) = 'cafeteria:global'
  and extension = 'presence'
);
