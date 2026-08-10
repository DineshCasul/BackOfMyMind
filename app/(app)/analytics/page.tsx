"use client";

import { useDreams } from "@/context/DreamContext";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LoadingState from "@/components/LoadingState";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
    const counts: Record<string, number> = { happy: 0, neutral: 0, sad: 0 };
    dreams.forEach((dream) => {
      counts[dream.mood] = (counts[dream.mood] || 0) + 1;
    });
    return counts;
  }, [dreams]);

  return (
    <Layout>
      <div className="flex items-center gap-2.5 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <BarChart3 className="size-6 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl font-serif">Analytics</h2>
      </div>

      {loading ? (
        <LoadingState label="Crunching your dreams…" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
              <CardHeader>
                <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Total Dreams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-serif">{dreams.length}</p>
              </CardContent>
            </Card>
            {MOOD_ORDER.map((mood, i) => {
              const { icon: Icon, label, colorClass } = MOOD_META[mood];
              return (
                <Card
                  key={mood}
                  className="transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both"
                  style={{ animationDelay: `${(i + 1) * 75}ms` }}
                >
                  <CardHeader>
                    <CardTitle
                      className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${colorClass}`}
                    >
                      <Icon className="size-3.5" strokeWidth={1.75} />
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-serif">{moodCounts[mood]}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
            <CardHeader>
              <CardTitle className="text-base font-serif">Dreams Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {dreamsPerDate.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">
                  No dreams yet to show a graph.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dreamsPerDate} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
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
                      cursor={{ fill: "var(--accent)" }}
                    />
                    <Bar dataKey="count" className="fill-primary" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Layout>
  );
}
