"use client";

import { useMemo, useState } from "react";
import { BarChart3, MoonStar, Flame, Trophy, Star, Eye, Sparkles } from "lucide-react";
import { useDreams } from "@/context/DreamContext";
import LoadingState from "@/components/LoadingState";
import CountUp from "@/components/CountUp";
import DreamHeatmap from "@/components/DreamHeatmap";
import PatternCard, { EmptyNote } from "@/components/patterns/PatternCard";
import MoodSpectrum from "@/components/patterns/MoodSpectrum";
import WeekdayRhythm from "@/components/patterns/WeekdayRhythm";
import MoodRiver from "@/components/patterns/MoodRiver";
import DreamCharacter from "@/components/patterns/DreamCharacter";
import Motifs from "@/components/patterns/Motifs";
import { computeStreaks } from "@/lib/streaks";
import { computePatterns, filterByRange, RANGES, type Range } from "@/lib/patterns";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const { dreams, loading } = useDreams();
  const [range, setRange] = useState<Range>("all");

  // Streaks are about the whole journal, so they ignore the range switch; the
  // rest of the page follows it. Everything is computed once per change here
  // (see lib/patterns.ts) instead of once per chart.
  const streaks = useMemo(() => computeStreaks(dreams.map((d) => d.date)), [dreams]);
  const scoped = useMemo(() => filterByRange(dreams, range), [dreams, range]);
  const p = useMemo(() => computePatterns(scoped, dreams), [scoped, dreams]);
  const heatDates = useMemo(() => dreams.map((d) => d.date), [dreams]);

  const lucidPct = p.total ? Math.round((p.typeCounts.lucid / p.total) * 100) : 0;
  const stats = [
    { icon: MoonStar, label: "Dreams", value: p.total, decimals: 0, suffix: "" },
    { icon: Flame, label: "Current streak", value: streaks.current, decimals: 0, suffix: streaks.current === 1 ? " night" : " nights" },
    { icon: Trophy, label: "Longest streak", value: streaks.longest, decimals: 0, suffix: streaks.longest === 1 ? " night" : " nights" },
    { icon: Star, label: "Avg vividness", value: p.avgVividness, decimals: 1, suffix: "/5" },
    { icon: Eye, label: "Lucid", value: lucidPct, decimals: 0, suffix: "%" },
  ];

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 animate-focus-in">
        <div>
          <p className="mb-1.5 font-hand text-2xl leading-none text-primary/90">what your nights keep repeating</p>
          <div className="flex items-center gap-3">
            <BarChart3 className="size-7 text-primary" strokeWidth={1.5} />
            <h2 className="font-serif text-3xl text-moonglow sm:text-4xl">Patterns</h2>
          </div>
        </div>

        {!loading && dreams.length > 0 && (
          <div role="group" aria-label="Time range" className="flex max-w-full gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-1 sm:gap-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => setRange(r.id)}
                className={cn(
                  "cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-xs transition-colors sm:px-3",
                  range === r.id ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState label="Crunching your dreams…" />
      ) : dreams.length === 0 ? (
        <div className="surface rounded-2xl">
          <EmptyNote>write a few dreams and your patterns will appear here</EmptyNote>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="surface reveal grid grid-cols-2 items-center gap-x-6 gap-y-4 rounded-2xl px-5 py-4 sm:flex sm:flex-wrap sm:gap-x-9">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-2.5">
                <s.icon className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="font-serif text-xl leading-none">
                    <CountUp value={s.value} decimals={s.decimals} />
                    {s.suffix}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {p.insights.length > 0 && (
            <PatternCard title="Noticed lately" index={1}>
              <ul className="flex flex-col gap-2.5">
                {p.insights.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm text-foreground/90">
                    <Sparkles className="mt-0.5 size-3.5 shrink-0 text-gold" strokeWidth={1.75} />
                    {line}
                  </li>
                ))}
              </ul>
            </PatternCard>
          )}

          <div className="grid items-start gap-4 lg:grid-cols-2">
            <PatternCard title="How it felt" note="Every dream, by the mood you gave it." index={2}>
              <MoodSpectrum counts={p.moodCounts} total={p.total} />
            </PatternCard>
            <PatternCard title="When you write" note="Dreams by day of the week." index={3}>
              <WeekdayRhythm weekdays={p.weekdays} />
            </PatternCard>
          </div>

          <PatternCard title="The last twelve weeks" note="Each column is a week: taller means more dreams, colours are moods." index={4}>
            <MoodRiver river={p.river} />
          </PatternCard>

          <PatternCard title="Dream activity" note="Brighter means more dreams that day." index={5}>
            <DreamHeatmap dates={heatDates} />
          </PatternCard>

          <PatternCard title="What kind of dreams" index={6}>
            <DreamCharacter typeCounts={p.typeCounts} vividness={p.vividness} avg={p.avgVividness} total={p.total} />
          </PatternCard>

          <PatternCard title="Things that keep coming back" note="Bigger means more often; colour is the mood it usually comes with." index={7}>
            <Motifs tags={p.tags} people={p.people} />
          </PatternCard>
        </div>
      )}
    </>
  );
}
