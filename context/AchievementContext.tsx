"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDreams } from "@/context/DreamContext";
import { getLikeInfo } from "@/lib/likes";
import {
  ACHIEVEMENTS,
  buildAchievementContext,
  computeUnlockedAchievementIds,
  type Achievement,
  type AchievementContext as AchievementStats,
} from "@/lib/achievements";

type AchievementContextValue = {
  stats: AchievementStats;
  unlockedIds: Set<string>;
  loading: boolean;
  celebrating: Achievement | null;
  dismissCelebration: () => void;
};

const Ctx = createContext<AchievementContextValue | undefined>(undefined);

export function AchievementProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const { dreams, loading: dreamsLoading } = useDreams();
  const [likesReceived, setLikesReceived] = useState<number | null>(null);
  // achievement_id -> unlocked_at, seeded from dream_achievements. Stays
  // null until that fetch resolves, which the diff effect below waits on.
  const [stored, setStored] = useState<Map<string, string> | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [celebrating, setCelebrating] = useState<Achievement | null>(null);

  // Whether the very first diff against `stored` has happened yet. That
  // first diff is a backfill (years of past dreams suddenly qualifying
  // for badges that didn't exist yet), not something earned "on the
  // spot", so it's persisted silently without a popup. Every diff after
  // this flips true is a real unlock and gets queued.
  const baselinedRef = useRef(false);
  // Ids already sent to Supabase but not yet reflected in `stored`, so a
  // second dream save landing before the first upsert's response comes
  // back doesn't re-diff the same id and re-send the write.
  const pendingRef = useRef<Set<string>>(new Set());
  // Ids already queued for celebration this session. Separate from
  // `stored`/`pendingRef`: celebrating must not depend on the Supabase
  // write succeeding (e.g. the dream_achievements migration not having
  // been run yet shouldn't silently swallow the popup), but without this
  // a write that keeps failing would re-diff the same id as "new" on
  // every dreams change and queue it again and again.
  const celebratedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("dream_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId)
      .then(({ data }) => {
        setStored(new Map((data ?? []).map((row) => [row.achievement_id, row.unlocked_at])));
      });
  }, [userId]);

  // Likes only ever land on public dreams (RLS enforces that), so this is
  // the full set worth asking about. Waits on dreamsLoading so it doesn't
  // settle on "0 likes" from an empty placeholder list before the real
  // dreams have loaded, which would wrongly seed the baseline low.
  const publicDreamIds = useMemo(() => dreams.filter((d) => d.isPublic).map((d) => d.id), [dreams]);
  const publicDreamIdsKey = publicDreamIds.join(",");

  useEffect(() => {
    if (dreamsLoading) return;
    if (publicDreamIds.length === 0) {
      setLikesReceived(0);
      return;
    }
    const supabase = createClient();
    getLikeInfo(supabase, publicDreamIds, userId).then((info) => {
      let total = 0;
      info.forEach((v) => (total += v.count));
      setLikesReceived(total);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dreamsLoading, publicDreamIdsKey, userId]);

  const stats = useMemo(() => buildAchievementContext(dreams, likesReceived ?? 0), [dreams, likesReceived]);
  // Badges are permanent trophies: once `stored` has recorded one, it
  // stays "unlocked" even if the dream that earned it (e.g. your only
  // lucid dream) later gets deleted and the live stats no longer qualify.
  // Union of "currently true" and "ever recorded", not just the former.
  const unlockedIds = useMemo(() => {
    const ids = new Set(computeUnlockedAchievementIds(stats));
    stored?.forEach((_unlockedAt, id) => ids.add(id));
    return ids;
  }, [stats, stored]);

  useEffect(() => {
    if (dreamsLoading || stored === null || likesReceived === null) return;

    const newIds = [...unlockedIds].filter((id) => !stored.has(id) && !pendingRef.current.has(id));
    if (newIds.length === 0) {
      baselinedRef.current = true;
      return;
    }

    const isBaseline = !baselinedRef.current;
    baselinedRef.current = true;
    newIds.forEach((id) => pendingRef.current.add(id));

    // Queued immediately, independent of whether the Supabase write below
    // succeeds, so a missing table or a network blip can't silently eat
    // the celebration for something that genuinely just unlocked.
    if (!isBaseline) {
      const toCelebrate = newIds.filter((id) => !celebratedRef.current.has(id));
      toCelebrate.forEach((id) => celebratedRef.current.add(id));
      if (toCelebrate.length > 0) {
        setQueue((q) => [...q, ...ACHIEVEMENTS.filter((a) => toCelebrate.includes(a.id))]);
      }
    }

    const supabase = createClient();
    supabase
      .from("dream_achievements")
      .upsert(
        newIds.map((achievement_id) => ({ user_id: userId, achievement_id })),
        { onConflict: "user_id,achievement_id" }
      )
      .select()
      .then(({ data }) => {
        newIds.forEach((id) => pendingRef.current.delete(id));
        if (!data) return;
        setStored((prev) => {
          const next = new Map(prev ?? []);
          data.forEach((row) => next.set(row.achievement_id, row.unlocked_at));
          return next;
        });
      });
  }, [dreamsLoading, unlockedIds, stored, likesReceived, userId]);

  // Show one celebration at a time, draining the queue as each dismisses.
  useEffect(() => {
    if (celebrating || queue.length === 0) return;
    setCelebrating(queue[0]);
    setQueue((q) => q.slice(1));
  }, [celebrating, queue]);

  const dismissCelebration = useCallback(() => setCelebrating(null), []);

  const loading = dreamsLoading || stored === null || likesReceived === null;

  const value: AchievementContextValue = useMemo(
    () => ({
      stats,
      unlockedIds,
      loading,
      celebrating,
      dismissCelebration,
    }),
    [stats, unlockedIds, loading, celebrating, dismissCelebration]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAchievements() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAchievements must be used within AchievementProvider");
  return ctx;
}
