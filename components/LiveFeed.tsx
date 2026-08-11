"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fromRow, type DreamRow } from "@/lib/dreams";
import { getLikeInfo } from "@/lib/likes";
import { fetchPublicDreamsForDate, type PublicDream } from "@/lib/publicFeed";
import CompactDatePicker from "./CompactDatePicker";
import PublicDreamCard from "./PublicDreamCard";
import Carousel from "./Carousel";
import LoadingState from "./LoadingState";

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
              <div
                key={dream.id}
                className="snap-start shrink-0 w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
                style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
              >
                <PublicDreamCard {...dream} />
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

      {dayLoading ? (
        <LoadingState label="Drifting to that day…" />
      ) : dreams.length === 0 ? (
        <p className="text-muted-foreground text-center py-16 animate-in fade-in duration-500">
          No dreams shared for this day yet.
        </p>
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
    </>
  );
}
