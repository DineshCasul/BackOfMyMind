"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fromRow, type DreamRow } from "@/lib/dreams";
import { getLikeInfo } from "@/lib/likes";
import { fetchPublicDreamsForDate, type PublicDream } from "@/lib/publicFeed";
import { cn } from "@/lib/utils";
import CompactDatePicker from "./CompactDatePicker";
import PublicDreamCard from "./PublicDreamCard";
import Carousel from "./Carousel";

// A short dashed line + a breathing star, dropped between favorite cards
// so "This Month's Constellation" is an actual constellation, not just a
// carousel with a starry name. Hidden below sm: at narrow widths the
// extra ~50px it adds per gap crowds already-tight cards, so mobile falls
// back to the carousel's plain gap-4 spacing.
function ConstellationLink() {
  return (
    <div className="hidden sm:flex items-center justify-center w-8 shrink-0 self-center" aria-hidden="true">
      <svg width="32" height="8" viewBox="0 0 32 8" className="overflow-visible">
        <line x1="0" y1="4" x2="32" y2="4" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
        <circle cx="16" cy="4" r="1.5" fill="var(--color-primary)" className="animate-breathe" />
      </svg>
    </div>
  );
}

export default function LiveFeed({
  initialDreams,
  initialFavoriteDreams,
  initialDate,
  viewerId,
}: {
  initialDreams: PublicDream[];
  initialFavoriteDreams: PublicDream[];
  initialDate: string;
  viewerId: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dreams, setDreams] = useState(initialDreams);
  const [favoriteDreams] = useState(initialFavoriteDreams);
  const [dayLoading, setDayLoading] = useState(false);

  // The realtime insert handler below is subscribed once (not
  // re-subscribed per day change), so it reads the *current* selection
  // through this ref rather than closing over a stale selectedDate.
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // the server already fetched initialDate's dreams
    }
    let cancelled = false;
    setDayLoading(true);
    const supabase = createClient();
    fetchPublicDreamsForDate(supabase, selectedDate, viewerId).then((result) => {
      if (!cancelled) {
        setDreams(result);
        setDayLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [selectedDate, viewerId]);

  useEffect(() => {
    const supabase = createClient();

    // "Postgres Changes" streams row-level INSERT/UPDATE/DELETE
    // events out of Postgres's write-ahead log over a websocket, no polling,
    // no manual pub/sub table of your own. The `filter` runs in the database
    // and RLS still applies, so this only ever delivers rows this viewer is
    // allowed to see (public dreams). This is the same primitive things like
    // Firebase/Firestore live queries are built on.
    // Refer: https://supabase.com/docs/guides/realtime/postgres-changes
    const feedChannel = supabase
      .channel("public-dreams-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "dreams", filter: "is_public=eq.true" },
        async (payload) => {
          const row = payload.new as DreamRow;
          if (row.user_id === viewerId) return; // you already see your own instantly via DreamContext
          if (row.date !== selectedDateRef.current) return; // not the day currently being viewed

          const [{ data: profile }, likeInfo] = await Promise.all([
            supabase.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle(),
            getLikeInfo(supabase, [row.id], viewerId),
          ]);

          setDreams((prev) => {
            if (prev.some((d) => d.id === row.id)) return prev;
            const arrived: PublicDream = {
              ...fromRow(row),
              authorName: profile?.display_name ?? "Someone",
              authorId: row.user_id,
              viewerId,
              likeCount: likeInfo.get(row.id)?.count ?? 0,
              likedByMe: likeInfo.get(row.id)?.likedByMe ?? false,
            };
            return [arrived, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedChannel);
    };
  }, [viewerId]);

  return (
    <>
      {favoriteDreams.length > 0 && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
          <div className="flex items-center gap-2.5 mb-4">
            <Sparkles className="size-5 text-primary" strokeWidth={1.5} />
            <h3 className="text-xl font-serif">This Month&apos;s Constellation</h3>
          </div>
          <Carousel>
            {favoriteDreams.map((dream, i) => (
              <div key={dream.id} className="flex items-center">
                {i > 0 && <ConstellationLink />}
                <div
                  className="snap-start shrink-0 w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
                  style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
                >
                  <PublicDreamCard {...dream} />
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mt-10 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
        <div className="flex items-center gap-2.5">
          <Users className="size-6 text-primary" strokeWidth={1.5} />
          <h2 className="text-2xl font-serif">From Everyone</h2>
        </div>
        <CompactDatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {/* Previous day's content stays mounted and blurs/fades out while the
          next day loads, then the swapped-in content fades/sharpens back
          in on the same wrapper, one continuous "drift" rather than an
          abrupt swap to a spinner and back. */}
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          dayLoading ? "opacity-0 blur-[3px] scale-[0.98]" : "opacity-100 blur-none scale-100"
        )}
      >
        {dreams.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center animate-in fade-in duration-500">
            {/* Three Z's drifting up and fading on a staggered loop,
                nothing bouncing back and forth (see zzz-float in
                globals.css for why that matters for smoothness). */}
            <span className="relative flex items-end justify-center h-10 w-16 mb-1" aria-hidden="true">
              <span
                className="absolute font-serif font-semibold text-primary/50 select-none"
                style={{ left: 4, bottom: 4, fontSize: 13, animation: "zzz-float 2.4s ease-out infinite" }}
              >
                z
              </span>
              <span
                className="absolute font-serif font-semibold text-primary/75 select-none"
                style={{ left: 16, bottom: 12, fontSize: 18, animation: "zzz-float 2.4s ease-out infinite 0.8s" }}
              >
                Z
              </span>
              <span
                className="absolute font-serif font-semibold text-primary select-none"
                style={{ left: 30, bottom: 20, fontSize: 23, animation: "zzz-float 2.4s ease-out infinite 1.6s" }}
              >
                Z
              </span>
            </span>
            <p className="text-muted-foreground">No dreams shared for this day yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dreams.map((dream, i) => (
              <div
                key={dream.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
              >
                <PublicDreamCard {...dream} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
