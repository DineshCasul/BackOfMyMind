import type { CSSProperties } from "react";
import { WEEKDAYS } from "@/lib/patterns";
import { cn } from "@/lib/utils";
import { EmptyNote } from "./PatternCard";

// Which days of the week the dreams were written on. It answers a question the
// old charts didn't: "when do I actually do this?". Seven plain columns; the
// busiest day is gold. The bars are `div`s scaled by a CSS animation, not a
// chart.
export default function WeekdayRhythm({ weekdays }: { weekdays: number[] }) {
  const max = Math.max(...weekdays);
  if (max === 0) return <EmptyNote>nothing written in this range yet</EmptyNote>;

  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3" role="img" aria-label={WEEKDAYS.map((d, i) => `${d} ${weekdays[i]}`).join(", ")}>
      {WEEKDAYS.map((day, i) => {
        const n = weekdays[i];
        const isTop = n === max;
        return (
          <div key={day} className="flex flex-col items-center gap-2">
            <span className={cn("text-xs tabular-nums", isTop ? "font-semibold text-gold" : "text-muted-foreground")}>{n}</span>
            <div className="flex h-28 w-full items-end">
              <div
                className={cn("grow-y w-full rounded-t-lg", isTop ? "bg-gradient-to-t from-gold/50 to-gold shadow-[0_0_18px_-4px_var(--color-gold)]" : "bg-gradient-to-t from-primary/25 to-primary/65")}
                style={{ height: `${Math.max(n ? 6 : 2, (n / max) * 100)}%`, "--i": i } as CSSProperties}
              />
            </div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{day}</span>
          </div>
        );
      })}
    </div>
  );
}
