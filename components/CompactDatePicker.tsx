"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toLocalDateString, parseLocalDateString } from "@/lib/utils";

// Just the calendar-jump, no day-pill row, this is for the home feed
// where browsing a specific day is an occasional action rather than the
// primary interaction (that's Journal's WeekDatePicker), and public
// activity per day tends to be sparser, so quick nearby-day scanning
// matters less here.
export default function CompactDatePicker({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = toLocalDateString(new Date());
  const label =
    selectedDate === today
      ? "Today"
      : parseLocalDateString(selectedDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onSelectDate(toLocalDateString(date));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Pick a day to browse"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <CalendarDays className="size-4" strokeWidth={1.75} />
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar mode="single" selected={parseLocalDateString(selectedDate)} captionLayout="dropdown" onSelect={handleSelect} />
      </PopoverContent>
    </Popover>
  );
}
