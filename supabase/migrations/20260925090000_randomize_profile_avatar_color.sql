alter table public.profiles
alter column avatar_color set default (
  (array['coral', 'teal', 'sun', 'violet', 'blue', 'pink']::text[])[
    floor(random() * 6)::integer + 1
  ]
);
