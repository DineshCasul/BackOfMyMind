import type { SupabaseClient } from "@supabase/supabase-js";
import { fromRow, type DreamRow } from "@/lib/dreams";
import { getLikeInfo } from "@/lib/likes";
import type { Dream } from "@/context/DreamContext";

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
