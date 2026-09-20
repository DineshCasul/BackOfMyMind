"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Clock, Flame, Loader2, Search, Sparkles, Users, X, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fromRow, type DreamRow } from "@/lib/dreams";
import { getLikeInfo } from "@/lib/likes";
import {
  fetchLatestPublicDreams,
  fetchPopularPublicDreams,
  fetchPublicDreamsForDate,
  type PublicDream,
} from "@/lib/publicFeed";
import { cn } from "@/lib/utils";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import type { MoodType } from "@/context/DreamContext";
import CompactDatePicker from "./CompactDatePicker";
import PublicDreamCard from "./PublicDreamCard";
import Carousel from "./Carousel";
import SleepingMoon from "./SleepingMoon";
import DreamListSkeleton from "./DreamListSkeleton";
import { Button } from "@/components/ui/button";

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

type Tab = "latest" | "popular" | "day";
type Range = "week" | "month" | "all";

const RANGES: { id: Range; label: string; days: number; blurb: string }[] = [
  { id: "week", label: "This week", days: 7, blurb: "Most loved this week" },
  { id: "month", label: "This month", days: 30, blurb: "Most loved in the last 30 days" },
  { id: "all", label: "All time", days: 3650, blurb: "The most loved dreams, ever" },
];
type Filters = { mood: MoodType | "all"; search: string };

const TABS: { id: Tab; label: string; icon: typeof Clock; blurb: string }[] = [
  { id: "latest", label: "Latest", icon: Clock, blurb: "The newest dreams anyone has shared" },
  { id: "popular", label: "Popular", icon: Flame, blurb: "Most loved in the last 30 days" },
  { id: "day", label: "By day", icon: CalendarDays, blurb: "Browse a single night" },
];

const SEARCH_DELAY_MS = 350;

export default function LiveFeed({
  initialDreams,
  initialFavoriteDreams,
  initialLatest,
  initialDate,
  viewerId,
}: {
  initialDreams: PublicDream[];
  initialFavoriteDreams: PublicDream[];
  initialLatest: { dreams: PublicDream[]; hasMore: boolean };
  initialDate: string;
  viewerId: string;
}) {
  const [tab, setTab] = useState<Tab>("latest");
  const [filters, setFilters] = useState<Filters>({ mood: "all", search: "" });
  // What is actually sent to the database trails what is typed by a moment,
  // so typing "flying" is one query, not six.
  const [appliedSearch, setAppliedSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setAppliedSearch(filters.search), SEARCH_DELAY_MS);
    return () => clearTimeout(id);
  }, [filters.search]);

  const [range, setRange] = useState<Range>("month");
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [dayDreams, setDayDreams] = useState(initialDreams);
  const [latest, setLatest] = useState(initialLatest);
  const [popular, setPopular] = useState<PublicDream[]>([]);
  const [favoriteDreams] = useState(initialFavoriteDreams);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The realtime handler below is subscribed once, so it reads the current
  // choices through a ref instead of closing over stale values.
  const live = useRef({ tab, selectedDate, mood: filters.mood, search: appliedSearch });
  live.current = { tab, selectedDate, mood: filters.mood, search: appliedSearch };

  // The server already fetched the first page of "Latest" and today's day
  // view, so nothing is requested until a choice actually changes.
  const skipFirst = useRef(true);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const f = { mood: filters.mood, search: appliedSearch };

    const job =
      tab === "latest"
        ? fetchLatestPublicDreams(supabase, viewerId, f).then((r) => !cancelled && setLatest(r))
        : tab === "popular"
          ? fetchPopularPublicDreams(supabase, viewerId, { ...f, days: RANGES.find((r) => r.id === range)!.days }).then((r) => !cancelled && setPopular(r))
          : fetchPublicDreamsForDate(supabase, selectedDate, viewerId).then((r) => !cancelled && setDayDreams(r));

    job
      .catch(() => !cancelled && setError("Couldn't load dreams. Check your connection and try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab, filters.mood, appliedSearch, selectedDate, range, viewerId]);

  const loadMore = useCallback(async () => {
    const last = latest.dreams[latest.dreams.length - 1];
    if (!last?.createdAt || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = await fetchLatestPublicDreams(createClient(), viewerId, {
        mood: filters.mood,
        search: appliedSearch,
        before: last.createdAt,
      });
      // Skip anything already on screen (a dream that arrived live can sit at
      // the boundary between two pages).
      setLatest((prev) => ({
        dreams: [...prev.dreams, ...next.dreams.filter((d) => !prev.dreams.some((p) => p.id === d.id))],
        hasMore: next.hasMore,
      }));
    } catch {
      setError("Couldn't load more. Try again.");
    } finally {
      setLoadingMore(false);
    }
  }, [latest.dreams, loadingMore, viewerId, filters.mood, appliedSearch]);

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

          const now = live.current;
          // Which lists could this new dream belong in right now?
          const forLatest = now.mood === "all" || row.mood === now.mood;
          const forDay = row.date === now.selectedDate;
          const searchOk =
            !now.search || `${row.title} ${row.description}`.toLowerCase().includes(now.search.toLowerCase());
          if (!(forLatest && searchOk) && !forDay) return;

          const [{ data: profile }, likeInfo] = await Promise.all([
            supabase.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle(),
            getLikeInfo(supabase, [row.id], viewerId),
          ]);
          const arrived: PublicDream = {
            ...fromRow(row),
            authorName: profile?.display_name ?? "Someone",
            authorId: row.user_id,
            viewerId,
            likeCount: likeInfo.get(row.id)?.count ?? 0,
            likedByMe: likeInfo.get(row.id)?.likedByMe ?? false,
          };

          if (forLatest && searchOk) {
            setLatest((prev) => (prev.dreams.some((d) => d.id === row.id) ? prev : { ...prev, dreams: [arrived, ...prev.dreams] }));
          }
          if (forDay) {
            setDayDreams((prev) => (prev.some((d) => d.id === row.id) ? prev : [arrived, ...prev]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(feedChannel);
    };
  }, [viewerId]);

  const list = tab === "latest" ? latest.dreams : tab === "popular" ? popular : dayDreams;
  const filtering = filters.mood !== "all" || appliedSearch.trim() !== "";
  const activeTab = TABS.find((t) => t.id === tab)!;
  const blurb = tab === "popular" ? RANGES.find((r) => r.id === range)!.blurb : activeTab.blurb;

  return (
    <>
      {favoriteDreams.length > 0 && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
          <div className="flex items-center gap-2.5 mb-4">
            <Sparkles className="size-5 text-gold" strokeWidth={1.5} />
            <h3 className="text-2xl font-serif text-moonglow">This Month&apos;s Constellation</h3>
          </div>
          <Carousel>
            {favoriteDreams.map((dream, i) => (
              <div key={dream.id} className="flex items-center">
                {i > 0 && <ConstellationLink />}
                <div className="snap-start shrink-0 w-72 sm:w-80 reveal" style={{ "--i": i } as CSSProperties}>
                  <PublicDreamCard {...dream} />
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      )}

      <section className="mt-12" aria-label="Discover shared dreams">
        <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
          <div>
            <p className="font-hand text-2xl leading-none text-primary/90 mb-1.5">{blurb}</p>
            <div className="flex items-center gap-2.5">
              <Users className="size-6 text-primary" strokeWidth={1.5} />
              <h2 className="text-3xl font-serif text-moonglow">From Everyone</h2>
            </div>
          </div>
          {tab === "day" && <CompactDatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />}
        </div>

        {/* Three ways in. Latest is the default because "what did people just
            share?" is the first thing anyone opening the app wants to know. */}
        <div role="tablist" aria-label="How to browse shared dreams" className="inline-flex gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 mb-4">
          {TABS.map((t) => {
            const Icon = t.icon;
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-all duration-300 cursor-pointer",
                  selected
                    ? "bg-gradient-to-b from-primary/30 to-primary/15 text-foreground border border-primary/30 shadow-[0_0_20px_-6px_var(--color-primary)]"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-3.5", selected && "text-primary")} strokeWidth={1.75} />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "popular" && (
          <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-all duration-200 cursor-pointer active:scale-95",
                  range === r.id ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Search and mood apply to Latest and Popular. "By day" is already a
            narrow slice, so it doesn't need them. */}
        {tab !== "day" && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6 reveal">
            <div className="relative sm:w-72 shrink-0 group">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={1.75} />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search shared dreams…"
                aria-label="Search shared dreams"
                className="field h-11 w-full pl-10 pr-9 text-base md:text-sm placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
              />
              {filters.search && (
                <button type="button" onClick={() => setFilters((f) => ({ ...f, search: "" }))} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 cursor-pointer">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_ORDER.map((m) => {
                const { icon: Icon, label } = MOOD_META[m];
                const selected = filters.mood === m;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setFilters((f) => ({ ...f, mood: selected ? "all" : m }))}
                    style={{ "--m": `var(--mood-${m})` } as CSSProperties}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition-all duration-200 cursor-pointer active:scale-95",
                      selected
                        ? "border-[var(--m)] text-[var(--m)] bg-[color-mix(in_oklch,var(--m)_16%,transparent)] shadow-[0_0_18px_-6px_var(--m)]"
                        : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* The previous list stays mounted and softens while the next one
            loads (rather than jumping to a spinner and back), then the new
            cards rise in. */}
        <div className={cn("transition-all duration-500 ease-out", loading && list.length > 0 ? "opacity-40 blur-[2px]" : "opacity-100 blur-none")}>
          {loading && list.length === 0 ? (
            <DreamListSkeleton />
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center animate-in fade-in duration-500">
              <SleepingMoon />
              <p className="font-serif text-xl">
                {filtering ? "No dreams match that" : tab === "popular" ? "Nothing has been liked yet" : "The sky is quiet"}
              </p>
              <p className="font-hand text-xl text-muted-foreground max-w-xs">
                {filtering
                  ? "try another word, or a different mood"
                  : tab === "popular"
                    ? "like a dream you enjoy and it will rise here"
                    : tab === "day"
                      ? "nothing shared on this night, everyone is still asleep"
                      : "be the first to share a dream tonight"}
              </p>
              {filtering && (
                <Button variant="outline" onClick={() => setFilters({ mood: "all", search: "" })}>
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                {list.map((dream, i) => (
                  <div key={dream.id} className="reveal" style={{ "--i": i } as CSSProperties}>
                    <PublicDreamCard {...dream} showRelativeTime={tab === "latest"} />
                  </div>
                ))}
              </div>
              {tab === "latest" && latest.hasMore && (
                <div className="flex justify-center mt-8">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? (
                      <>
                        <Loader2 className="animate-spin" /> Loading…
                      </>
                    ) : (
                      "Show older dreams"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
