import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRow, type DreamRow } from "@/lib/dreams";
import { getLikeInfo } from "@/lib/likes";
import type { Dream, MoodType } from "@/context/DreamContext";

export type PublicDream = Dream & {
  authorName: string;
  authorId: string;
  viewerId: string;
  likeCount: number;
  likedByMe: boolean;
};

async function enrichRows(supabase: SupabaseClient, rows: DreamRow[], viewerId: string): Promise<PublicDream[]> {
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const { data: authorRows } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] as { id: string; display_name: string | null }[] };

  const nameById = new Map((authorRows ?? []).map((p) => [p.id, p.display_name ?? "Someone"]));
  const likeInfoByDream = await getLikeInfo(
    supabase,
    rows.map((r) => r.id),
    viewerId
  );

  return rows.map((row) => ({
    ...fromRow(row),
    authorName: nameById.get(row.user_id) ?? "Someone",
    authorId: row.user_id,
    viewerId,
    likeCount: likeInfoByDream.get(row.id)?.count ?? 0,
    likedByMe: likeInfoByDream.get(row.id)?.likedByMe ?? false,
  }));
}

// Shared between the home page's initial server-side fetch (today) and
// LiveFeed's client-side refetch (whichever day gets picked), so the two
// can't drift into fetching/shaping public dreams differently.
export async function fetchPublicDreamsForDate(
  supabase: SupabaseClient,
  date: string,
  viewerId: string
): Promise<PublicDream[]> {
  const { data: dreamRows } = await supabase
    .from("dreams")
    .select("*")
    .eq("is_public", true)
    .eq("date", date)
    .order("created_at", { ascending: false });

  return enrichRows(supabase, (dreamRows ?? []) as DreamRow[], viewerId);
}

// For the home page's "This Month's Constellation" spotlight, independent
// of whichever single day the main feed below it is currently showing.
export async function fetchFavoritePublicDreamsForMonth(
  supabase: SupabaseClient,
  monthStart: string,
  monthEnd: string,
  viewerId: string
): Promise<PublicDream[]> {
  const { data: dreamRows } = await supabase
    .from("dreams")
    .select("*")
    .eq("is_public", true)
    .eq("is_favorite", true)
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .order("created_at", { ascending: false });

  return enrichRows(supabase, (dreamRows ?? []) as DreamRow[], viewerId);
}

export type FeedFilters = {
  mood?: MoodType | "all";
  /** Free text, matched against title, description and tags. */
  search?: string;
};

// The search text ends up inside a PostgREST `or(...)` filter string, where
// commas, parentheses, percent signs and backslashes have meaning of their
// own. Stripping them (rather than trying to escape them) means a search can
// never break out of the filter or change what it means.
export function cleanSearch(raw: string | undefined): string {
  return (raw ?? "").replace(/[,()%\\*{}"']/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

function applyFilters<T extends { eq: (c: string, v: string) => T; or: (f: string) => T }>(query: T, filters: FeedFilters): T {
  let q = query;
  if (filters.mood && filters.mood !== "all") q = q.eq("mood", filters.mood);
  const s = cleanSearch(filters.search);
  if (s) {
    // Title and description contain the text, or one tag is exactly that word.
    q = q.or(`title.ilike.%${s}%,description.ilike.%${s}%,tags.cs.{${s.toLowerCase()}}`);
  }
  return q;
}

export const LATEST_PAGE_SIZE = 10;

// The newest shared dreams, across every day, a page at a time. `before` is
// the created_at of the last dream already on screen: "everything older than
// this" stays correct even if new dreams arrive while someone is reading,
// which offset-based paging (skip the first N) would get wrong, shifting by
// one for every new arrival and repeating a card. One extra row is requested
// so we know whether a "Show more" is worth offering.
export async function fetchLatestPublicDreams(
  supabase: SupabaseClient,
  viewerId: string,
  options: FeedFilters & { before?: string; limit?: number } = {}
): Promise<{ dreams: PublicDream[]; hasMore: boolean }> {
  const limit = options.limit ?? LATEST_PAGE_SIZE;
  let query = supabase.from("dreams").select("*").eq("is_public", true);
  query = applyFilters(query, options);
  if (options.before) query = query.lt("created_at", options.before);
  const { data } = await query.order("created_at", { ascending: false }).limit(limit + 1);

  const rows = (data ?? []) as DreamRow[];
  return { dreams: await enrichRows(supabase, rows.slice(0, limit), viewerId), hasMore: rows.length > limit };
}

// Set to false the first time the database function below turns out not to
// exist, so the app stops asking for it (and stops logging a failed request)
// for the rest of the session.
let popularFunctionAvailable = true;

// The most-liked shared dreams in a time window.
//
// Preferred route: the `popular_public_dreams` database function
// (supabase/popular_dreams.sql), which ranks EVERY shared dream in the window
// by its like count, in the database. If that function hasn't been created
// yet, this falls back to taking the 150 newest shared dreams, counting their
// likes in one query and ranking those: still correct order, but it can't see a
// popular dream that has been pushed past the 150 newest.
export async function fetchPopularPublicDreams(
  supabase: SupabaseClient,
  viewerId: string,
  options: FeedFilters & { days?: number; limit?: number } = {}
): Promise<PublicDream[]> {
  const days = options.days ?? 30;
  const limit = options.limit ?? 12;
  const search = cleanSearch(options.search);
  const rank = (list: PublicDream[]) =>
    list
      .filter((d) => d.likeCount > 0)
      .sort((a, b) => b.likeCount - a.likeCount || (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .slice(0, limit);

  if (popularFunctionAvailable) {
    const { data, error } = await supabase.rpc("popular_public_dreams", {
      p_days: days,
      p_limit: limit,
      p_mood: options.mood && options.mood !== "all" ? options.mood : null,
      p_search: search || null,
    });
    if (!error) return rank(await enrichRows(supabase, (data ?? []) as DreamRow[], viewerId));
    // Only a missing function should switch it off; a passing network error
    // shouldn't disable the exact ranking for the whole session.
    if (error.code === "PGRST202" || error.code === "42883" || /could not find|does not exist/i.test(error.message)) {
      popularFunctionAvailable = false;
    }
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase.from("dreams").select("*").eq("is_public", true).gte("created_at", since);
  query = applyFilters(query, options);
  const { data } = await query.order("created_at", { ascending: false }).limit(150);
  return rank(await enrichRows(supabase, (data ?? []) as DreamRow[], viewerId));
}
