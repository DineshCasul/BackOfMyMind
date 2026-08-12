"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toLocalDateString, startOfWeek, cn } from "@/lib/utils";

const MIN_WEEKS = 9; // ~2 months, the old fixed count, now just a floor
const MAX_WEEKS = 30; // ~7 months, past which it's more noise than signal
const COL_STEP = 16; // px, cell (size-3 = 12px) + gap (gap-1 = 4px)
const DAY_LABEL_WIDTH = 28; // px, the Mon/Wed/Fri column + the gap next to it
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

// Empty (unlit) through glowing-bright, by how many dreams landed on that
// day, the "stars getting brighter" take on a GitHub-style contribution
// grid rather than flat colored squares.
const BUCKET_CLASSES = [
  "bg-border/60",
  "bg-primary/30",
  "bg-primary/55",
  "bg-primary/80",
  "bg-primary shadow-[0_0_6px_1.5px_var(--color-primary)]",
];

function bucketFor(count: number): number {
  if (count <= 0) return 0;
  if (count >= 4) return 4;
  return count;
}

// Weeks-per-page fills whatever width the card actually gives it (measured
// below) instead of a fixed count that left a fixed-size grid stranded in
// the middle of a much wider card. </> paging still caps it per-screen
// rather than one long scrollable year, so it never needs horizontal
// scroll on a phone.
export default function DreamHeatmap({ dates }: { dates: string[] }) {
  const [pageOffset, setPageOffset] = useState(0); // 0 = most recent page, higher = further back
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeksPerPage, setWeeksPerPage] = useState(MIN_WEEKS);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function measure(width: number) {
      const available = width - DAY_LABEL_WIDTH;
      const fitted = Math.floor(available / COL_STEP);
      setWeeksPerPage(Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, fitted)));
    }
    measure(el.clientWidth);
    // A ResizeObserver rather than a window "resize" listener: the card's
    // width can change from a layout reflow (grid/sidebar content, font
    // load) with no viewport resize at all, which the listener would miss
    // entirely and leave weeksPerPage stale.
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { weeks, monthLabels, rangeLabel } = useMemo(() => {
    const countByDate = new Map<string, number>();
    for (const d of dates) countByDate.set(d, (countByDate.get(d) ?? 0) + 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekMonday = startOfWeek(today);

    const pageEndMonday = new Date(currentWeekMonday);
    pageEndMonday.setDate(currentWeekMonday.getDate() - pageOffset * weeksPerPage * 7);
    const pageStart = new Date(pageEndMonday);
    pageStart.setDate(pageEndMonday.getDate() - (weeksPerPage - 1) * 7);

    const weeks: { date: Date; count: number; isFuture: boolean }[][] = [];
    const monthLabels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;

    for (let w = 0; w < weeksPerPage; w++) {
      const week: { date: Date; count: number; isFuture: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(pageStart);
        date.setDate(pageStart.getDate() + w * 7 + d);
        const key = toLocalDateString(date);
        week.push({ date, count: countByDate.get(key) ?? 0, isFuture: date > today });
      }
      weeks.push(week);
      if (week[0].date.getMonth() !== lastMonth) {
        lastMonth = week[0].date.getMonth();
        // A 3-letter label needs roughly 2 columns of room (COL_STEP=16px
        // each). The page's first week always gets a label (see the -1
        // sentinel above), so a month boundary landing on the very next
        // week (a page starting a few days before month-end) would
        // otherwise place two labels almost on top of each other.
        // Skipping the close one is better than both rendering garbled.
        const prevLabel = monthLabels[monthLabels.length - 1];
        if (!prevLabel || w - prevLabel.weekIndex >= 2) {
          monthLabels.push({ weekIndex: w, label: week[0].date.toLocaleString("en-US", { month: "short" }) });
        }
      }
    }

    const pageEnd = new Date(pageStart);
    pageEnd.setDate(pageStart.getDate() + weeksPerPage * 7 - 1);
    const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric" });
    const rangeLabel = `${fmt(pageStart)} – ${fmt(pageEnd > today ? today : pageEnd)}`;

    return { weeks, monthLabels, rangeLabel };
  }, [dates, pageOffset, weeksPerPage]);

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setPageOffset((p) => p + 1)}
          aria-label="Earlier"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>
        <span className="text-xs text-muted-foreground">{rangeLabel}</span>
        <button
          type="button"
          onClick={() => setPageOffset((p) => Math.max(0, p - 1))}
          disabled={pageOffset === 0}
          aria-label="Later"
          className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex justify-center gap-1.5">
        <div className="flex flex-col gap-1 pt-4 shrink-0">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="h-3 text-[9px] leading-3 text-muted-foreground">
              {label}
            </span>
          ))}
        </div>

        <div>
          <div className="relative h-4 mb-1" style={{ width: weeksPerPage * COL_STEP }}>
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={weekIndex}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: weekIndex * COL_STEP }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-flow-col gap-1" style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}>
            {weeks.map((week, wi) =>
              week.map((day, di) => {
                const index = wi * 7 + di;
                if (day.isFuture) return <div key={index} className="size-3" />;
                return (
                  <div
                    key={index}
                    title={`${day.count} dream${day.count === 1 ? "" : "s"} · ${toLocalDateString(day.date)}`}
                    className={cn(
                      "size-3 rounded-full transition-transform duration-150 hover:scale-125 animate-in fade-in duration-300 fill-mode-both",
                      BUCKET_CLASSES[bucketFor(day.count)]
                    )}
                    style={{ animationDelay: `${index * 6}ms` }}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
