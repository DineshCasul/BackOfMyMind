"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toLocalDateString, parseLocalDateString, startOfWeek, cn } from "@/lib/utils";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeekDatePicker({
  selectedDate,
  onSelectDate,
  markedDates,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  markedDates?: Set<string>;
}) {
  // The displayed week is independent of the selection, paging with the
  // arrows shouldn't change which date is selected until a pill is clicked.
  const [weekStart, setWeekStart] = useState(() => startOfWeek(parseLocalDateString(selectedDate)));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  function shiftWeek(weeks: number) {
    setWeekStart((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + weeks * 7);
      return next;
    });
  }

  function handleMonthJump(date: Date | undefined) {
    if (!date) return;
    setWeekStart(startOfWeek(date));
    onSelectDate(toLocalDateString(date));
    setMonthPickerOpen(false);
  }

  // The pill strip alone gives day-of-week + day-of-month but never which
  // month (or week of it) you're looking at, and the month-jump button that
  // could otherwise hint at that is desktop-only. A small range label above
  // the strip covers both: "Aug 11–17" normally, "Aug 28–Sep 3" across a
  // month boundary.
  const weekEnd = days[6];
  const sameMonth = days[0].getMonth() === weekEnd.getMonth() && days[0].getFullYear() === weekEnd.getFullYear();
  const monthShort = (d: Date) => d.toLocaleString("en-US", { month: "short" });
  const rangeLabel = sameMonth
    ? `${monthShort(days[0])} ${days[0].getDate()}–${weekEnd.getDate()}`
    : `${monthShort(days[0])} ${days[0].getDate()}–${monthShort(weekEnd)} ${weekEnd.getDate()}`;

  return (
    // Always centered: on mobile it sits full-width on its own line below
    // search; on desktop it shares a row with search, and no longer grows
    // to fill the leftover space, so the pair centers together as one
    // compact group instead of the picker spreading out and left-aligning
    // its own days/calendar button inside that extra room.
    <div className="flex flex-col items-center gap-1 min-w-0">
      <span className="text-[11px] font-medium text-muted-foreground">{rangeLabel}</span>

      <div className="flex items-center justify-center gap-1 min-w-0">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          aria-label="Previous week"
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>

        {/* min-w-0 lets this flex item actually shrink below its content
            width, without it overflow-x-auto never kicks in, a flex item
            defaults to min-width: auto, so the row would just push the whole
            picker wider than the viewport on narrow screens instead of
            scrolling internally. */}
        <div className="flex gap-1.5 overflow-x-auto min-w-0 px-2.5 py-2 -my-2">
          {days.map((d) => {
            const value = toLocalDateString(d);
            const isSelected = value === selectedDate;
            const hasDream = markedDates?.has(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onSelectDate(value)}
                aria-pressed={isSelected}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
              >
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">
                  {DAY_LABELS[(d.getDay() + 6) % 7]}
                </span>
                <span
                  className={cn(
                    "flex items-center justify-center size-8 sm:size-9 rounded-full border text-sm font-semibold transition-all duration-200 hover:scale-105",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_-4px_var(--color-primary)]"
                      : "border-white/10 text-muted-foreground hover:bg-white/[0.06] hover:border-white/25"
                  )}
                >
                  {d.getDate()}
                </span>
                <span
                  className={cn("size-1 rounded-full", hasDream ? (isSelected ? "bg-gold" : "bg-gold/70") : "bg-transparent")}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => shiftWeek(1)}
          aria-label="Next week"
          className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>

        {/* Hidden below sm: on a phone-width row the pill strip already
            covers "nearby dates" and a third control just adds clutter,
            the month-jump is a desktop-space convenience. */}
        <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Jump to a date"
              title="Jump to a date"
              className="hidden sm:inline-flex items-center justify-center p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer shrink-0"
            >
              <CalendarDays className="size-4" strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseLocalDateString(selectedDate)}
              captionLayout="dropdown"
              onSelect={handleMonthJump}
              modifiers={{
                hasDream: (date) => markedDates?.has(toLocalDateString(date)) ?? false,
              }}
              modifiersClassNames={{
                hasDream:
                  "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary",
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
