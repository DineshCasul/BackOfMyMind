import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import type { MoodType } from "@/context/DreamContext";
import { EmptyNote } from "./PatternCard";

// How your dreams feel, as ONE bar split into moods, with the numbers listed
// underneath. This replaces the donut chart: comparing the lengths of segments
// along a line is easier than comparing angles around a ring, the labels sit
// next to their numbers instead of in a separate legend, and it needs no
// chart library at all.
export default function MoodSpectrum({ counts, total }: { counts: Record<MoodType, number>; total: number }) {
  if (total === 0) return <EmptyNote>no dreams in this range yet</EmptyNote>;
  const present = MOOD_ORDER.filter((m) => counts[m] > 0);

  return (
    <div>
      <div
        role="img"
        aria-label={present.map((m) => `${MOOD_META[m].label} ${counts[m]}`).join(", ")}
        className="grow-x flex h-4 w-full gap-[3px] overflow-hidden rounded-full"
      >
        {present.map((m) => (
          <span
            key={m}
            title={`${MOOD_META[m].label}: ${counts[m]}`}
            className="first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: counts[m], flexBasis: 0, background: `var(--mood-${m})` }}
          />
        ))}
      </div>

      <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
        {present.map((m) => {
          const { icon: Icon, label } = MOOD_META[m];
          return (
            <li key={m} className="flex items-center gap-2.5 text-sm">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--mood-${m})`, boxShadow: `0 0 8px var(--mood-${m})` }} />
              <Icon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-muted-foreground">{label}</span>
              <span className="ml-auto font-medium tabular-nums">{counts[m]}</span>
              <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{Math.round((counts[m] / total) * 100)}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
