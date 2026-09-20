import type { CSSProperties } from "react";
import { Users } from "lucide-react";
import type { Motif } from "@/lib/patterns";
import { EmptyNote } from "./PatternCard";

// The things that keep coming back. Tags are shown as a cloud, hand-written,
// with the biggest words being the most frequent and each one coloured by the
// mood it most often appears with (so a colour means the same thing here as
// everywhere else in the app). People are a short ranked list.
export default function Motifs({ tags, people }: { tags: Motif[]; people: Motif[] }) {
  if (tags.length === 0 && people.length === 0) return <EmptyNote>add tags and people to your dreams and they will collect here</EmptyNote>;
  const max = Math.max(1, ...tags.map((t) => t.count));

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div>
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Tags</p>
        {tags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 leading-none">
            {tags.map((t, i) => (
              <span
                key={t.label}
                title={`${t.label}: ${t.count} ${t.count === 1 ? "dream" : "dreams"}, mostly ${t.mood}`}
                className="reveal font-hand"
                style={{ fontSize: `${1.15 + (t.count / max) * 1.35}rem`, color: `var(--mood-${t.mood})`, "--i": i } as CSSProperties}
              >
                {t.label}
                <sup className="ml-0.5 font-sans text-[10px] text-muted-foreground">{t.count}</sup>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Users className="size-3" strokeWidth={1.75} />
          People
        </p>
        {people.length === 0 ? (
          <p className="text-sm text-muted-foreground">No people yet.</p>
        ) : (
          <ol className="flex flex-col gap-2.5">
            {people.map((p, i) => (
              <li key={p.label} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <span className="truncate">{p.label}</span>
                <span className="mx-1 flex-1 -translate-y-0.5 border-b border-dashed border-white/15" />
                <span className="font-medium tabular-nums">&times;{p.count}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
