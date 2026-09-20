"use client";

import { Calendar } from "@/components/ui/calendar";
import { toLocalDateString, parseLocalDateString } from "@/lib/utils";

// The month view for the Dreambook: every day that has an entry carries a
// small gold dot under its number, today has a lavender ring and the
// selected day glows, so one glance at the month shows where the dreams are.
//
// It manages its own visible month (react-day-picker does this when `month`
// isn't controlled), so paging through months never changes the selected
// day. The parent gives it `key={selectedDate.slice(0, 7)}`, which resets
// the visible month only when the selection moves to a different month (say,
// from the week strip), the one case where it needs to follow.
export default function MonthCalendar({
  selectedDate,
  onSelectDate,
  markedDates,
  className,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  markedDates: Set<string>;
  className?: string;
}) {
  return (
    <Calendar
      mode="single"
      required
      showOutsideDays
      weekStartsOn={1}
      selected={parseLocalDateString(selectedDate)}
      defaultMonth={parseLocalDateString(selectedDate)}
      onSelect={(date) => date && onSelectDate(toLocalDateString(date))}
      modifiers={{ hasDream: (date) => markedDates.has(toLocalDateString(date)) }}
      modifiersClassNames={{
        hasDream:
          "relative after:content-[''] after:absolute after:bottom-[3px] after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-gold after:shadow-[0_0_6px_var(--color-gold)]",
      }}
      className={className}
    />
  );
}
