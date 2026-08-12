"use client";

import Link from "next/link";
import { useDreams } from "@/context/DreamContext";
import { useAchievements } from "@/context/AchievementContext";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingState from "@/components/LoadingState";
import CountUp from "@/components/CountUp";
import MoodDonutChart from "@/components/MoodDonutChart";
import DreamHeatmap from "@/components/DreamHeatmap";
import { MOOD_ORDER } from "@/lib/moods";
import { computeStreaks } from "@/lib/streaks";
import { useMemo } from "react";
import { BarChart3, MoonStar, Flame, Trophy, Star, Eye, Award, Tag, Users, ArrowUpRight } from "lucide-react";
import type { Dream } from "@/context/DreamContext";

// Shared by the top-tags and top-people lists below: same "count how often
// each string appears, case-insensitively, but keep the first casing seen
// for display" logic either way.
function topEntries(dreams: Dream[], pick: (d: Dream) => string[], limit = 8): { label: string; count: number }[] {
  const byKey = new Map<string, { label: string; count: number }>();
  dreams.forEach((d) =>
    pick(d).forEach((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      const existing = byKey.get(key);
      if (existing) existing.count++;
      else byKey.set(key, { label: trimmed, count: 1 });
    })
  );
  return [...byKey.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export default function AnalyticsPage() {
  const { dreams, loading } = useDreams();
  const { unlockedIds, loading: achievementsLoading } = useAchievements();

  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(MOOD_ORDER.map((m) => [m, 0]));
    dreams.forEach((dream) => {
      counts[dream.mood] = (counts[dream.mood] || 0) + 1;
    });
    return counts;
  }, [dreams]);

  const streaks = useMemo(() => computeStreaks(dreams.map((d) => d.date)), [dreams]);

  const avgVividness = dreams.length ? dreams.reduce((sum, d) => sum + d.vividness, 0) / dreams.length : 0;
  const lucidPct = dreams.length ? Math.round((dreams.filter((d) => d.dreamType === "lucid").length / dreams.length) * 100) : 0;

  const topTags = useMemo(() => topEntries(dreams, (d) => d.tags), [dreams]);
  const topPeople = useMemo(() => topEntries(dreams, (d) => d.people), [dreams]);

  const stats = [
    { icon: MoonStar, label: "Total Dreams", value: dreams.length, decimals: 0, suffix: "" },
    { icon: Flame, label: "Current Streak", value: streaks.current, decimals: 0, suffix: streaks.current === 1 ? " day" : " days" },
    { icon: Trophy, label: "Longest Streak", value: streaks.longest, decimals: 0, suffix: streaks.longest === 1 ? " day" : " days" },
    { icon: Star, label: "Avg Vividness", value: avgVividness, decimals: 1, suffix: "/5" },
    { icon: Eye, label: "Lucid Dreams", value: lucidPct, decimals: 0, suffix: "%" },
  ];

  return (
    <>
      <div className="flex items-center gap-2.5 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <BarChart3 className="size-6 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl font-serif">Patterns</h2>
      </div>

      {loading ? (
        <LoadingState label="Crunching your dreams…" />
      ) : (
        <>
          {/* One compact strip instead of a wall of big cards. Grid on
              mobile so 5 items align cleanly in 2 columns instead of
              wrapping raggedly at whatever width each one happens to be;
              a plain row once there's room for all 5 side by side. */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-6 gap-y-4 sm:gap-x-8 rounded-xl border border-border bg-card px-5 py-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 animate-in fade-in duration-500 fill-mode-both"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <stat.icon className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-xl font-serif leading-none">
                    <CountUp value={stat.value} decimals={stat.decimals} />
                    {stat.suffix}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {!achievementsLoading && (
            <Link
              href="/profile"
              className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3.5 mb-6 transition-all duration-200 hover:border-primary/40 hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Award className="size-5 shrink-0 text-primary" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {unlockedIds.size}/{ACHIEVEMENTS.length} badges unlocked
                  </p>
                  <div className="w-40 max-w-full h-1.5 rounded-full bg-muted overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${(unlockedIds.size / ACHIEVEMENTS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-foreground transition-all duration-200 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={2}
              />
            </Link>
          )}

          {/* items-start: without it, grid stretches both cards to match
              whichever is taller, which is how a short Mood Balance (few
              moods logged) ends up with a card visibly taller than its
              own content, looking half-empty. */}
          <div className="grid gap-4 lg:grid-cols-2 mb-6 items-start">
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
              <CardHeader>
                <CardTitle className="text-base font-serif">Mood Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <MoodDonutChart moodCounts={moodCounts} total={dreams.length} />
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
              <CardHeader>
                <CardTitle className="text-base font-serif">Dream Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {dreams.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12">No dreams yet to light up the sky.</p>
                ) : (
                  <DreamHeatmap dates={dreams.map((d) => d.date)} />
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both">
            <CardHeader>
              <CardTitle className="text-base font-serif">Recurring Motifs</CardTitle>
            </CardHeader>
            <CardContent>
              {topTags.length === 0 && topPeople.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No tags or people logged yet.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-3">
                      <Tag className="size-3.5" strokeWidth={1.75} />
                      Tags
                    </div>
                    {topTags.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No tags yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {topTags.map((entry) => (
                          <div key={entry.label} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground truncate">{entry.label}</span>
                            <span className="flex-1 border-b border-dashed border-border mx-1 translate-y-[-2px]" />
                            <span className="font-medium shrink-0">&times;{entry.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground mb-3">
                      <Users className="size-3.5" strokeWidth={1.75} />
                      People
                    </div>
                    {topPeople.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No people logged yet.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {topPeople.map((entry) => (
                          <div key={entry.label} className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground truncate">{entry.label}</span>
                            <span className="flex-1 border-b border-dashed border-border mx-1 translate-y-[-2px]" />
                            <span className="font-medium shrink-0">&times;{entry.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
