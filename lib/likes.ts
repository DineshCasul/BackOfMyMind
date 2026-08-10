import type { SupabaseClient } from "@supabase/supabase-js";

export type LikeInfo = { count: number; likedByMe: boolean };

// One query for however many dream IDs are on screen, rather than one
// per-card round trip, used by both the feed and the dream detail page.
export async function getLikeInfo(
  supabase: SupabaseClient,
  dreamIds: string[],
  viewerId: string
): Promise<Map<string, LikeInfo>> {
  const info = new Map<string, LikeInfo>();
  if (dreamIds.length === 0) return info;

  const { data } = await supabase.from("dream_likes").select("dream_id, user_id").in("dream_id", dreamIds);

  for (const row of data ?? []) {
    const existing = info.get(row.dream_id) ?? { count: 0, likedByMe: false };
    existing.count += 1;
    if (row.user_id === viewerId) existing.likedByMe = true;
    info.set(row.dream_id, existing);
  }

  return info;
}
