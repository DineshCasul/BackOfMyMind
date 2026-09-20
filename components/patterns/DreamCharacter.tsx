import type { CSSProperties } from "react";
import { Star } from "lucide-react";
import { DREAM_TYPE_META, DREAM_TYPE_ORDER } from "@/lib/dreamTypes";
import type { DreamType } from "@/context/DreamContext";
import { EmptyNote } from "./PatternCard";

// What kind of dreams they are (normal, lucid, nightmare, recurring) and how
// vivid they were, side by side, since both describe the dream itself rather
// than how it felt or when it happened.
export default function DreamCharacter({
  typeCounts,
  vividness,
  avg,
  total,
}: {
  typeCounts: Record<DreamType, number>;
  vividness: number[];
  avg: number;
  total: number;
}) {
  if (total === 0) return <EmptyNote>no dreams in this range yet</EmptyNote>;
  const maxViv = Math.max(...vividness);

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <div>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Kind</p>
        <ul className="flex flex-col gap-3">
          {DREAM_TYPE_ORDER.map((t) => {
            const { icon: Icon, label } = DREAM_TYPE_META[t];
            const n = typeCounts[t];
            return (
              <li key={t} className="text-sm">
                <div className="mb-1 flex items-center gap-2">
                  <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.75} />
                  <span className="text-muted-foreground">{label}</span>
                  <span className="ml-auto font-medium tabular-nums">{n}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="grow-x h-full rounded-full bg-gradient-to-r from-primary/60 to-primary" style={{ width: `${(n / total) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Vividness</p>
          <span className="flex items-center gap-1 rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-xs font-medium text-gold">
            <Star className="size-3" fill="currentColor" strokeWidth={0} />
            {avg.toFixed(1)} avg
          </span>
        </div>
        <div className="flex h-24 items-end gap-2" role="img" aria-label={vividness.map((n, i) => `${i + 1} star: ${n}`).join(", ")}>
          {vividness.map((n, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[10px] tabular-nums text-muted-foreground">{n || ""}</span>
              <div
                className="grow-y w-full rounded-t-md bg-gradient-to-t from-gold/30 to-gold/80"
                style={{ height: `${maxViv ? Math.max(n ? 8 : 2, (n / maxViv) * 70) : 2}%`, "--i": i } as CSSProperties}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className="flex-1 text-center text-[10px] text-muted-foreground">
              {n}★
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
