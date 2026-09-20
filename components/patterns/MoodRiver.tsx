import type { CSSProperties } from "react";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import type { WeekBucket } from "@/lib/patterns";
import { EmptyNote } from "./PatternCard";
import { format } from "date-fns";
import { parseLocalDateString } from "@/lib/utils";

// The last twelve weeks as twelve columns. Each column stacks that week's
// dreams by mood, and its height is how many dreams there were, so you can see
// both how much you were writing and how the mood of it shifted. It answers
// "what has it felt like lately?" which a single all-time total can't.
export default function MoodRiver({ river }: { river: WeekBucket[] }) {
  const max = Math.max(...river.map((w) => w.total));
  if (max === 0) return <EmptyNote>nothing in the last 12 weeks yet</EmptyNote>;

  return (
    <div>
      <div className="flex h-36 items-end gap-1.5 sm:gap-2.5">
        {river.map((week, i) => {
          const label = format(parseLocalDateString(week.start), "d MMM");
          const summary = MOOD_ORDER.filter((m) => week.counts[m] > 0)
            .map((m) => `${week.counts[m]} ${MOOD_META[m].label.toLowerCase()}`)
            .join(", ");
          return (
            <div
              key={week.start}
              className="grow-y flex h-full min-w-0 flex-1 flex-col-reverse gap-px overflow-hidden rounded-md"
              style={{ "--i": i } as CSSProperties}
              title={`Week of ${label}: ${week.total ? summary : "no dreams"}`}
            >
              {week.total === 0 ? (
                <span className="h-1 rounded-full bg-white/10" />
              ) : (
                MOOD_ORDER.filter((m) => week.counts[m] > 0).map((m) => (
                  <span key={m} style={{ height: `${(week.counts[m] / max) * 100}%`, background: `var(--mood-${m})`, opacity: 0.9 }} />
                ))
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2.5">
        {river.map((week, i) => (
          <span key={week.start} className="relative h-3 min-w-0 flex-1 text-[10px] text-muted-foreground">
            {i % 3 === 0 && <span className="absolute left-0 whitespace-nowrap">{format(parseLocalDateString(week.start), "d MMM")}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
