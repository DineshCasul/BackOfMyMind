"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { toLocalDateString, startOfWeek, parseLocalDateString, cn } from "@/lib/utils";

const MIN_WEEKS = 9; // ~2 months, a floor for very narrow screens
const MAX_WEEKS = 30; // ~7 months, past which it's more noise than signal
const COL_STEP = 16; // px, cell (size-3 = 12px) + gap (gap-1 = 4px)
const DAY_LABEL_WIDTH = 28; // px, the Mon/Wed/Fri column + the gap next to it
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

// Unlit through brightest, by how many dreams landed on that day: stars
// getting brighter, in the style of a contribution grid. Plain background
// colours only: no glow and no per-cell transition, since there can be over
// two hundred cells and each one would otherwise be its own animated element.
const BUCKET_CLASSES = ["bg-white/[0.07]", "bg-primary/30", "bg-primary/55", "bg-primary/80", "bg-primary"];

const bucketFor = (count: number) => (count <= 0 ? 0 : Math.min(4, count));

type Cell = { key: string; count: number; future: boolean };

// The calendar of when dreams were written. It used to fade in 210 cells one by
// one, each with its own CSS animation and hover transition, which is a lot of
// animation for a picture that just needs to be there. Now the grid appears
// once, as a whole, and hovering is handled by ONE listener on the grid that
// reads which cell is under the pointer (event delegation), showing the
// date and count in a single line underneath instead of a tooltip per cell.
export default function DreamHeatmap({ dates }: { dates: string[] }) {
  const [pageOffset, setPageOffset] = useState(0); // 0 = most recent page, higher = further back
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeksPerPage, setWeeksPerPage] = useState(MIN_WEEKS);
  const [hover, setHover] = useState<{ date: string; count: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function measure(width: number) {
      const fitted = Math.floor((width - DAY_LABEL_WIDTH) / COL_STEP);
      setWeeksPerPage(Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, fitted)));
    }
    measure(el.clientWidth);
    // A ResizeObserver rather than a window "resize" listener: the card's width
    // can change from a layout reflow with no viewport resize at all. Setting
    // state to the same number is a no-op, so this is cheap while resizing.
    const observer = new ResizeObserver(([entry]) => measure(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { cells, monthLabels, rangeLabel, inRange } = useMemo(() => {
    const countByDate = new Map<string, number>();
    for (const d of dates) countByDate.set(d, (countByDate.get(d) ?? 0) + 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentWeekMonday = startOfWeek(today);

    const pageEndMonday = new Date(currentWeekMonday);
    pageEndMonday.setDate(currentWeekMonday.getDate() - pageOffset * weeksPerPage * 7);
    const pageStart = new Date(pageEndMonday);
    pageStart.setDate(pageEndMonday.getDate() - (weeksPerPage - 1) * 7);

    const cells: Cell[] = [];
    const monthLabels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    let inRange = 0;

    for (let w = 0; w < weeksPerPage; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(pageStart);
        date.setDate(pageStart.getDate() + w * 7 + d);
        const key = toLocalDateString(date);
        const count = countByDate.get(key) ?? 0;
        inRange += count;
        cells.push({ key, count, future: date > today });
      }
      const first = new Date(pageStart);
      first.setDate(pageStart.getDate() + w * 7);
      if (first.getMonth() !== lastMonth) {
        lastMonth = first.getMonth();
        // A 3-letter label needs about 2 columns of room, so skip one that
        // would land on top of the previous label.
        const prev = monthLabels[monthLabels.length - 1];
        if (!prev || w - prev.weekIndex >= 2) monthLabels.push({ weekIndex: w, label: first.toLocaleString("en-US", { month: "short" }) });
      }
    }

    const pageEnd = new Date(pageStart);
    pageEnd.setDate(pageStart.getDate() + weeksPerPage * 7 - 1);
    const fmt = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric" });
    return { cells, monthLabels, rangeLabel: `${fmt(pageStart)} – ${fmt(pageEnd > today ? today : pageEnd)}`, inRange };
  }, [dates, pageOffset, weeksPerPage]);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-d]");
    if (!el) return setHover(null);
    const date = el.dataset.d!;
    setHover((prev) => (prev?.date === date ? prev : { date, count: Number(el.dataset.n) }));
  }

  return (
    <div ref={containerRef}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPageOffset((p) => p + 1)}
          aria-label="Earlier"
          className="flex size-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground cursor-pointer"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>
        <span className="text-xs text-muted-foreground">{rangeLabel}</span>
        <button
          type="button"
          onClick={() => setPageOffset((p) => Math.max(0, p - 1))}
          disabled={pageOffset === 0}
          aria-label="Later"
          className="flex size-8 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground cursor-pointer disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex animate-in fade-in justify-center gap-1.5 duration-500">
        <div className="flex shrink-0 flex-col gap-1 pt-4">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="h-3 text-[9px] leading-3 text-muted-foreground">
              {label}
            </span>
          ))}
        </div>

        <div>
          <div className="relative mb-1 h-4" style={{ width: weeksPerPage * COL_STEP }}>
            {monthLabels.map(({ weekIndex, label }) => (
              <span key={weekIndex} className="absolute text-[10px] text-muted-foreground" style={{ left: weekIndex * COL_STEP }}>
                {label}
              </span>
            ))}
          </div>

          <div
            role="img"
            aria-label={`${inRange} dreams between ${rangeLabel}`}
            className="grid grid-flow-col gap-1"
            style={{ gridTemplateRows: "repeat(7, 12px)", gridAutoColumns: "12px" }}
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            {cells.map((c) =>
              c.future ? (
                <span key={c.key} className="size-3" />
              ) : (
                <span key={c.key} data-d={c.key} data-n={c.count} className={cn("size-3 rounded-full", BUCKET_CLASSES[bucketFor(c.count)])} />
              )
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-5 items-center justify-between gap-3 text-xs text-muted-foreground" aria-live="polite">
        <span>
          {hover
            ? `${format(parseLocalDateString(hover.date), "EEE d MMM")} · ${hover.count === 0 ? "no dreams" : `${hover.count} ${hover.count === 1 ? "dream" : "dreams"}`}`
            : `${inRange} ${inRange === 1 ? "dream" : "dreams"} in these weeks`}
        </span>
        <span className="flex items-center gap-1.5" aria-hidden="true">
          Fewer
          {BUCKET_CLASSES.map((c, i) => (
            <span key={i} className={cn("size-2.5 rounded-full", c)} />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
