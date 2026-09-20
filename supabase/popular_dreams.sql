-- Ranking shared dreams by how many likes they have.
--
-- The app works without this file: it falls back to ranking the 150 newest
-- shared dreams in the browser. Running this in the Supabase SQL editor makes
-- "Popular" exact (it considers every shared dream in the time window, not just
-- the newest 150) and cheaper (one query, ranked where the data lives).
--
-- `security invoker` means the function runs with the CALLER's permissions, so
-- row level security still applies: it can only ever return dreams the caller
-- is allowed to see (public ones), same as a normal select.

create or replace function public.popular_public_dreams(
  p_days int default 30,
  p_limit int default 12,
  p_mood text default null,
  p_search text default null
)
returns setof public.dreams
language sql
stable
security invoker
set search_path = public
as $$
  select d.*
  from public.dreams d
  join (
    select dream_id, count(*) as likes
    from public.dream_likes
    group by dream_id
  ) l on l.dream_id = d.id
  where d.is_public
    and d.created_at >= now() - make_interval(days => p_days)
    and (p_mood is null or d.mood = p_mood)
    and (
      p_search is null
      or d.title ilike '%' || p_search || '%'
      or d.description ilike '%' || p_search || '%'
      or lower(p_search) = any (d.tags)
    )
  order by l.likes desc, d.created_at desc
  limit p_limit;
$$;
