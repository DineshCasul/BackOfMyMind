"use client";

import { useDreams } from "@/context/DreamContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingState from "@/components/LoadingState";
import CountUp from "@/components/CountUp";
import MoodDonutChart from "@/components/MoodDonutChart";
import DreamHeatmap from "@/components/DreamHeatmap";
import { MOOD_ORDER } from "@/lib/moods";
import { computeStreaks } from "@/lib/streaks";
import { useMemo } from "react";
import { BarChart3, MoonStar, Flame, Trophy, Star, Eye } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
  const { dreams, loading } = useDreams();

  const dreamsPerDate = useMemo(() => {
    const counts: Record<string, number> = {};
    dreams.forEach((dream) => {
      counts[dream.date] = (counts[dream.date] || 0) + 1;
    });

    // Transform into array for recharts
    return Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [dreams]);

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
        <h2 className="text-2xl font-serif">Analytics</h2>
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

          <div className="grid gap-4 lg:grid-cols-2 mb-6">
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

          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
            <CardHeader>
              <CardTitle className="text-base font-serif">Dreams Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {dreamsPerDate.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No dreams yet to show a graph.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dreamsPerDate} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="dreamsAreaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={12} />
                    <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--popover)",
                        borderColor: "var(--border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--popover-foreground)",
                      }}
                      cursor={{ stroke: "var(--color-primary)", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#dreamsAreaFill)"
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
