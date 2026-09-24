create function public.statistics_range_days(p_range text)
returns integer
language plpgsql
immutable
security invoker
set search_path = ''
as $$
begin
  if p_range = '7' then
    return 7;
  elsif p_range = '30' then
    return 30;
  elsif p_range = '90' then
    return 90;
  elsif p_range = 'all' then
    return null;
  end if;

  raise exception 'unsupported statistics range: %', p_range using errcode = '22023';
end;
$$;

revoke all on function public.statistics_range_days(text) from public;
revoke execute on function public.statistics_range_days(text) from anon;
grant execute on function public.statistics_range_days(text) to authenticated;

create function public.get_attendance_statistics(p_range text)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  range_end date := public.current_service_date();
  range_start date;
  range_days integer;
  result jsonb;
begin
  if actor_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  range_days := public.statistics_range_days(p_range);

  if range_days is null then
    select min(d.service_date) into range_start
    from public.daily_declarations d;
    range_start := coalesce(range_start, range_end);
  else
    range_start := range_end - (range_days - 1);
  end if;

  with bounded_dates as (
    select generate_series(
      range_start::timestamp,
      range_end::timestamp,
      interval '1 day'
    )::date as service_date
  ),
  attendance_totals as (
    select d.service_date, count(*)::integer as attending_count
    from public.daily_declarations d
    where d.attending
      and d.service_date between range_start and range_end
    group by d.service_date
  ),
  points as (
    select jsonb_agg(
      jsonb_build_object(
        'service_date', bd.service_date,
        'attending_count', coalesce(at.attending_count, 0),
        'participants', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', p.id,
                'display_name', p.display_name,
                'message', p.message,
                'avatar_seed', p.avatar_seed,
                'avatar_color', p.avatar_color,
                'message_text_color', p.message_text_color,
                'transport_mode', d.transport_mode,
                'car_capacity', d.car_capacity
              )
              order by lower(p.display_name), p.id
            )
            from public.daily_declarations d
            join public.profiles p on p.id = d.user_id
            where d.service_date = bd.service_date
              and d.attending
          ),
          '[]'::jsonb
        )
      )
      order by bd.service_date
    ) as entries
    from bounded_dates bd
    left join attendance_totals at on at.service_date = bd.service_date
  ),
  ranking_rows as (
    select
      p.id,
      p.display_name,
      p.avatar_seed,
      p.avatar_color,
      count(*)::integer as attendance_count
    from public.daily_declarations d
    join public.profiles p on p.id = d.user_id
    where d.attending
      and d.service_date between range_start and range_end
    group by p.id, p.display_name, p.avatar_seed, p.avatar_color
  ),
  ranking as (
    select coalesce(
      jsonb_agg(
        to_jsonb(r)
        order by r.attendance_count desc, lower(r.display_name), r.id
      ),
      '[]'::jsonb
    ) as entries
    from ranking_rows r
  )
  select jsonb_build_object(
    'range', p_range,
    'range_start', range_start,
    'range_end', range_end,
    'points', points.entries,
    'ranking', ranking.entries
  )
  into result
  from points, ranking;

  return result;
end;
$$;

revoke all on function public.get_attendance_statistics(text) from public;
revoke execute on function public.get_attendance_statistics(text) from anon;
grant execute on function public.get_attendance_statistics(text) to authenticated;
