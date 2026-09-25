-- Production reliability repair for synthetic-email account confirmation.
-- Run this entire file in the hosted project's Supabase SQL Editor.
-- It is safe to rerun: only unconfirmed users in the synthetic email domain are updated.

-- BEFORE: each row is a synthetic-email account. `email_confirmed = false` means
-- the account exists but password sign-in is blocked pending administrator enablement.
select
  id,
  email,
  email_confirmed_at,
  email_confirmed_at is not null as email_confirmed
from auth.users
where lower(email) like '%@users.ext-mensa.it'
order by lower(email), id;

-- REPAIR: enable only currently unconfirmed synthetic-email accounts.
-- Password hashes, tokens, unrelated users, and already-confirmed users are untouched.
update auth.users
set email_confirmed_at = now()
where lower(email) like '%@users.ext-mensa.it'
  and email_confirmed_at is null;

-- AFTER: every synthetic-email account intended for username sign-in should now show
-- `email_confirmed = true`. Any false row still requires operator investigation.
select
  id,
  email,
  email_confirmed_at,
  email_confirmed_at is not null as email_confirmed
from auth.users
where lower(email) like '%@users.ext-mensa.it'
order by lower(email), id;

-- DRIVER DIAGNOSTIC: one row per today's `offers_car` declaration.
-- `profile_missing = true` exposes data skew that an INNER JOIN would hide; this query
-- is read-only and does not change declarations or profiles.
select
  d.user_id,
  d.service_date,
  d.attending,
  d.transport_mode,
  d.car_capacity,
  d.created_at as declared_at,
  p.display_name,
  p.id is null as profile_missing
from public.daily_declarations d
left join public.profiles p on p.id = d.user_id
where d.service_date = public.current_service_date()
  and d.transport_mode = 'offers_car'
order by d.created_at, d.user_id;
