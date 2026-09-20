"use client";

import { Search, Sparkles, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DreamType, MoodType } from "@/context/DreamContext";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import { DREAM_TYPE_META, DREAM_TYPE_ORDER } from "@/lib/dreamTypes";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

export type JournalFilters = {
  search: string;
  mood: MoodType | "all";
  type: DreamType | "all";
  favoritesOnly: boolean;
};

export const NO_FILTERS: JournalFilters = { search: "", mood: "all", type: "all", favoritesOnly: false };

/** How many filters are switched on (search counts as one). */
export function countActiveFilters(f: JournalFilters): number {
  return (f.search.trim() ? 1 : 0) + (f.mood !== "all" ? 1 : 0) + (f.type !== "all" ? 1 : 0) + (f.favoritesOnly ? 1 : 0);
}

const chip =
  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs border transition-all duration-200 cursor-pointer active:scale-95";
const chipIdle = "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground hover:bg-white/[0.04]";

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

// One panel for every filter, used in two places: as a card in the desktop
// sidebar and inside a sheet on phones, so the two can't drift apart. Search
// is optional here because on phones it lives in its own always-visible field.
export default function FiltersPanel({
  filters,
  onChange,
  showSearch = true,
}: {
  filters: JournalFilters;
  onChange: (next: JournalFilters) => void;
  showSearch?: boolean;
}) {
  const active = countActiveFilters(filters);
  const set = (patch: Partial<JournalFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-5">
      {showSearch && (
        <div className="relative group">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary"
            strokeWidth={1.75}
          />
          <Input
            type="text"
            placeholder="Search every dream…"
            aria-label="Search every dream"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="pl-10 pr-9"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => set({ search: "" })}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      <Group label="Mood">
        <div className="flex flex-wrap gap-1.5">
          {MOOD_ORDER.map((m) => {
            const { icon: Icon, label } = MOOD_META[m];
            const selected = filters.mood === m;
            return (
              <button
                key={m}
                type="button"
                aria-pressed={selected}
                onClick={() => set({ mood: selected ? "all" : m })}
                style={{ "--m": `var(--mood-${m})` } as CSSProperties}
                className={cn(
                  chip,
                  selected
                    ? "border-[var(--m)] text-[var(--m)] bg-[color-mix(in_oklch,var(--m)_16%,transparent)] shadow-[0_0_18px_-6px_var(--m)]"
                    : chipIdle
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Kind of dream">
        <div className="flex flex-wrap gap-1.5">
          {DREAM_TYPE_ORDER.map((t) => {
            const { icon: Icon, label } = DREAM_TYPE_META[t];
            const selected = filters.type === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={selected}
                onClick={() => set({ type: selected ? "all" : t })}
                className={cn(chip, selected ? "bg-primary/20 text-primary border-primary/60 shadow-[0_0_18px_-6px_var(--color-primary)]" : chipIdle)}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
        </div>
      </Group>

      <button
        type="button"
        role="switch"
        aria-checked={filters.favoritesOnly}
        onClick={() => set({ favoritesOnly: !filters.favoritesOnly })}
        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm transition-colors hover:bg-white/[0.06] cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Star className={cn("size-4", filters.favoritesOnly ? "text-gold" : "text-muted-foreground")} fill={filters.favoritesOnly ? "currentColor" : "none"} strokeWidth={1.75} />
          Favourites only
        </span>
        <span className={cn("relative h-5 w-9 rounded-full transition-colors", filters.favoritesOnly ? "bg-primary" : "bg-white/15")} aria-hidden="true">
          <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-all", filters.favoritesOnly ? "left-[18px]" : "left-0.5")} />
        </span>
      </button>

      {active > 0 && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(NO_FILTERS)} className="self-start text-muted-foreground">
          <Sparkles /> Clear {active === 1 ? "filter" : `${active} filters`}
        </Button>
      )}
    </div>
  );
}
