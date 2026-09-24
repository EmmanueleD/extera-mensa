create type public.transport_mode as enum (
  'needs_ride',
  'offers_car',
  'autonomous'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  message text,
  avatar_seed uuid not null default gen_random_uuid(),
  avatar_color text not null default 'coral',
  message_text_color text not null default 'ink',
  preferred_transport_mode public.transport_mode,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_format check (
    display_name = btrim(display_name)
    and char_length(display_name) between 1 and 30
    and display_name !~ '[\r\n]'
  ),
  constraint profiles_message_length check (
    message is null or char_length(message) <= 140
  ),
  constraint profiles_avatar_color_palette check (
    avatar_color in ('coral', 'teal', 'sun', 'violet', 'blue', 'pink')
  ),
  constraint profiles_message_color_palette check (
    message_text_color in ('ink', 'coral', 'teal', 'violet', 'blue')
  )
);

create unique index profiles_display_name_unique
  on public.profiles (lower(display_name));

alter table public.profiles enable row level security;

create policy "Authenticated users can read profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on table public.profiles from anon;
revoke insert, delete, truncate, references, trigger on table public.profiles from authenticated;
revoke update on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (
  display_name,
  message,
  avatar_seed,
  avatar_color,
  message_text_color
) on table public.profiles to authenticated;

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    btrim(coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
