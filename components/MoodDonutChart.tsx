"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import type { MoodType } from "@/context/DreamContext";
import { cn } from "@/lib/utils";

export default function MoodDonutChart({ moodCounts, total }: { moodCounts: Record<string, number>; total: number }) {
  const data = MOOD_ORDER.filter((m) => moodCounts[m] > 0).map((m) => ({
    mood: m,
    label: MOOD_META[m].label,
    value: moodCounts[m],
    color: `var(--mood-${m})`,
  }));

  if (total === 0) {
    return <p className="text-muted-foreground text-center py-12">No dreams yet to break down.</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 w-full min-w-0 py-2">
      <div className="relative size-40 sm:size-52 max-w-full shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={3}
              cornerRadius={6}
              animationDuration={700}
              animationEasing="ease-out"
            >
              {data.map((entry) => (
                <Cell key={entry.mood} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius-md)",
                color: "var(--popover-foreground)",
              }}
              formatter={(value: number, _name, entry) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
                entry.payload.label,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centered total, sitting in the donut's hole. */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-serif">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">dreams</span>
        </div>
      </div>

      {/* Always a column, never wrapping rows, so `ml-auto` lines every
          count up against the same right edge instead of each item's own
          ragged auto-width in a wrapped flex row. */}
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        {data.map((entry) => {
          const { icon: Icon } = MOOD_META[entry.mood as MoodType];
          return (
            <div key={entry.mood} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color, boxShadow: `0 0 6px 1px ${entry.color}` }}
              />
              <Icon className={cn("size-3.5 shrink-0 text-muted-foreground")} strokeWidth={1.75} />
              <span className="text-muted-foreground">{entry.label}</span>
              <span className="font-medium ml-auto">{entry.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
