"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { format } from "date-fns";
import { Award, Lock } from "lucide-react";
import { useAchievements } from "@/context/AchievementContext";
import { ACHIEVEMENTS, CATEGORY_LABELS, CATEGORY_ORDER, type Achievement } from "@/lib/achievements";
import LoadingState from "@/components/LoadingState";
import { cn } from "@/lib/utils";

type Filter = "all" | "earned" | "locked";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "earned", label: "Earned" },
  { id: "locked", label: "Still to find" },
];

const RING_R = 44;
const RING_C = 2 * Math.PI * RING_R;

// The badge wall. Earned badges are lit gold medals; the rest are quiet
// outlines with their progress underneath. It is plain HTML with a couple of
// transitions: there are 51 badges, so nothing here runs a per-badge animation
// (the old page did, which is part of why it felt slow).
export default function AchievementsPanel() {
  const { stats, unlockedIds, unlockedAt, likesReady, loading } = useAchievements();
  const [filter, setFilter] = useState<Filter>("all");

  const earned = unlockedIds.size;
  const total = ACHIEVEMENTS.length;

  // The locked badge you're closest to earning: the most useful "what next?".
  const nextUp = useMemo(() => {
    return ACHIEVEMENTS.filter((a) => !unlockedIds.has(a.id))
      .map((a) => {
        const p = a.progress?.(stats);
        return { a, p, ratio: p && p.target > 0 ? p.current / p.target : 0 };
      })
      .filter((x) => x.p && x.p.target > 1 && x.ratio > 0)
      .sort((x, y) => y.ratio - x.ratio)
      .slice(0, 3);
  }, [stats, unlockedIds]);

  const recent = useMemo(() => {
    return [...unlockedAt.entries()]
      .sort((a, b) => b[1].localeCompare(a[1]))
      .slice(0, 4)
      .map(([id, at]) => ({ a: ACHIEVEMENTS.find((x) => x.id === id), at }))
      .filter((x): x is { a: Achievement; at: string } => !!x.a);
  }, [unlockedAt]);

  if (loading) return <LoadingState label="Tallying your badges…" />;

  return (
    <>
      <div className="mb-7 animate-focus-in">
        <p className="mb-1.5 font-hand text-2xl leading-none text-primary/90">small things worth marking</p>
        <div className="flex items-center gap-3">
          <Award className="size-7 text-primary" strokeWidth={1.5} />
          <h2 className="font-serif text-3xl text-moonglow sm:text-4xl">Achievements</h2>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        <section className="surface reveal flex items-center gap-5 rounded-2xl p-5">
          <div className="relative size-24 shrink-0" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={earned} aria-label="Badges earned">
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
              <circle cx="50" cy="50" r={RING_R} fill="none" strokeWidth="6" className="stroke-white/10" />
              <circle
                cx="50"
                cy="50"
                r={RING_R}
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                className="stroke-gold transition-[stroke-dashoffset] duration-1000 ease-out"
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * (1 - earned / total)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-2xl leading-none">{earned}</span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">of {total}</span>
            </div>
          </div>
          <div>
            <p className="font-hand text-2xl leading-none text-gold">{earned === total ? "every last one" : earned === 0 ? "a blank page" : "collecting stars"}</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {earned === total ? "You found them all." : `${total - earned} left to find. Badges you earn are yours for good.`}
            </p>
          </div>
        </section>

        <section className="surface reveal rounded-2xl p-5" style={{ "--i": 1 } as CSSProperties}>
          {nextUp.length > 0 ? (
            <>
              <h3 className="font-hand text-2xl leading-none text-primary/90">Closest to earning</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {nextUp.map(({ a, p, ratio }) => {
                  const Icon = a.icon;
                  return (
                    <li key={a.id} className="flex items-center gap-3">
                      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="truncate">{a.label}</span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {p!.current}/{p!.target}
                          </span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : recent.length > 0 ? (
            <>
              <h3 className="font-hand text-2xl leading-none text-primary/90">Recently earned</h3>
              <RecentList recent={recent} />
            </>
          ) : (
            <p className="py-4 font-hand text-xl text-muted-foreground">write your first dream and the first badge will light up</p>
          )}
          {nextUp.length > 0 && recent.length > 0 && (
            <>
              <h3 className="mt-5 font-hand text-2xl leading-none text-primary/90">Recently earned</h3>
              <RecentList recent={recent} />
            </>
          )}
        </section>
      </div>

      <div role="group" aria-label="Show badges" className="mb-5 flex w-fit gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-xs transition-colors",
              filter === f.id ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-7">
        {CATEGORY_ORDER.map((category) => {
          const all = ACHIEVEMENTS.filter((a) => a.category === category);
          const items = all.filter((a) => (filter === "all" ? true : filter === "earned" ? unlockedIds.has(a.id) : !unlockedIds.has(a.id)));
          if (items.length === 0) return null;
          const got = all.filter((a) => unlockedIds.has(a.id)).length;
          return (
            <section key={category}>
              <div className="mb-3 flex items-baseline gap-3 border-b border-dashed border-white/10 pb-2">
                <h3 className="font-serif text-lg">{CATEGORY_LABELS[category]}</h3>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {got}/{all.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {items.map((a) => (
                  <Medal key={a.id} a={a} isUnlocked={unlockedIds.has(a.id)} progress={a.progress?.(stats)} likesPending={!likesReady} />
                ))}
              </div>
            </section>
          );
        })}
        {filter === "earned" && earned === 0 && <p className="py-8 text-center font-hand text-xl text-muted-foreground">nothing earned yet, but the night is young</p>}
        {filter === "locked" && earned === total && <p className="py-8 text-center font-hand text-xl text-muted-foreground">nothing left to find</p>}
      </div>
    </>
  );
}

function RecentList({ recent }: { recent: { a: Achievement; at: string }[] }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {recent.map(({ a, at }) => {
        const Icon = a.icon;
        return (
          <li key={a.id} className="flex items-center gap-2.5 text-sm">
            <Icon className="size-4 shrink-0 text-gold" strokeWidth={1.5} />
            <span className="truncate">{a.label}</span>
            <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">{format(new Date(at), "d MMM")}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Medal({
  a,
  isUnlocked,
  progress,
  likesPending,
}: {
  a: Achievement;
  isUnlocked: boolean;
  progress?: { current: number; target: number };
  likesPending: boolean;
}) {
  const Icon = a.icon;
  const showBar = !isUnlocked && progress && progress.target > 1;
  return (
    <div
      className={cn(
        "medal relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-3 pt-4 text-center",
        isUnlocked ? "border-gold/35 bg-gold/[0.07] shadow-[0_0_24px_-12px_var(--color-gold)]" : "border-white/[0.07] bg-white/[0.02]"
      )}
    >
      {isUnlocked && <span aria-hidden="true" className="medal-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/15 to-transparent" style={{ transform: "translateX(-120%) skewX(-20deg)" }} />}
      <span className={cn("flex size-10 items-center justify-center rounded-full border", isUnlocked ? "border-gold/40 bg-gold/15 text-gold" : "border-white/10 text-muted-foreground/70")}>
        {isUnlocked || !likesPending ? <Icon className="size-5" strokeWidth={1.5} /> : <Lock className="size-4" strokeWidth={1.5} />}
      </span>
      <p className={cn("text-xs font-medium leading-tight", !isUnlocked && "text-foreground/70")}>{a.label}</p>
      <p className="text-[11px] leading-snug text-muted-foreground">{a.description}</p>
      {showBar && (
        <div className="mt-0.5 w-full">
          <div className="h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.min(100, (progress.current / progress.target) * 100)}%` }} />
          </div>
          <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
            {progress.current}/{progress.target}
          </p>
        </div>
      )}
    </div>
  );
}
