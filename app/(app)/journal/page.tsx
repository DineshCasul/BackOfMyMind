"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarDays, Feather, Flame, MoonStar, Plus, Search, SlidersHorizontal, X } from "lucide-react";

import { useDreams, type Dream } from "@/context/DreamContext";
import DreamCard from "@/components/DreamCard";
import FormModal from "@/components/FormModal";
import DreamListSkeleton from "@/components/DreamListSkeleton";
import WeekDatePicker from "@/components/WeekDatePicker";
import MonthCalendar from "@/components/MonthCalendar";
import FiltersPanel, { NO_FILTERS, countActiveFilters, type JournalFilters } from "@/components/FiltersPanel";
import { computeStreaks } from "@/lib/streaks";
import { parseLocalDateString, startOfWeek, toLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

function matches(dream: Dream, f: JournalFilters): boolean {
  const q = f.search.trim().toLowerCase();
  return (
    (f.mood === "all" || dream.mood === f.mood) &&
    (f.type === "all" || dream.dreamType === f.type) &&
    (!f.favoritesOnly || dream.isFavorite) &&
    (!q ||
      dream.title.toLowerCase().includes(q) ||
      dream.description.toLowerCase().includes(q) ||
      dream.tags.some((t) => t.toLowerCase().includes(q)) ||
      dream.people.some((p) => p.toLowerCase().includes(q)))
  );
}

// A small sidebar card with a handwritten heading, used for the calendar,
// the filters and the numbers.
function SideCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`surface rounded-2xl p-4 ${className ?? ""}`}>
      <h3 className="font-hand text-xl leading-none text-primary/90 mb-3">{title}</h3>
      {children}
    </section>
  );
}

export default function JournalPage() {
  const {
    dreams,
    loading,
    addDream,
    updateDream,
    deleteDream,
    togglePublic,
    toggleFavorite,
    selectedDate,
    setSelectedDate,
  } = useDreams();

  const [filters, setFilters] = React.useState<JournalFilters>(NO_FILTERS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  const dreamDatesSet = React.useMemo(() => new Set(dreams.map((d) => d.date)), [dreams]);
  const streaks = React.useMemo(() => computeStreaks(dreams.map((d) => d.date)), [dreams]);
  const thisMonth = selectedDate.slice(0, 7);
  const monthCount = dreams.filter((d) => d.date.startsWith(thisMonth)).length;

  // Two modes. Normally the page shows the selected day. As soon as any
  // filter or search is on, it shows matches from the WHOLE journal instead,
  // grouped by date: searching "flying" should find every flying dream, not
  // only the ones written on the day that happens to be selected.
  const activeFilters = countActiveFilters(filters);
  const isSearching = activeFilters > 0;
  const dayDreams = dreams.filter((d) => d.date === selectedDate);
  const results = React.useMemo(
    () => (isSearching ? dreams.filter((d) => matches(d, filters)) : []),
    [dreams, filters, isSearching]
  );
  const groups = React.useMemo(() => {
    const byDate = new Map<string, Dream[]>();
    for (const d of results) byDate.set(d.date, [...(byDate.get(d.date) ?? []), d]);
    return [...byDate.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  }, [results]);

  const longDate = format(parseLocalDateString(selectedDate), "EEEE, d MMMM");
  const weekKey = toLocalDateString(startOfWeek(parseLocalDateString(selectedDate)));
  // Only known once the page is in the browser (the server's clock may be on
  // another day), so the "Back to today" button appears after hydration
  // instead of risking a mismatch with the server's HTML.
  const [localToday, setLocalToday] = React.useState<string | null>(null);
  React.useEffect(() => setLocalToday(toLocalDateString(new Date())), []);
  const isToday = localToday === null || selectedDate === localToday;

  const cardProps = {
    onEdit: updateDream,
    onDelete: deleteDream,
    onTogglePublic: togglePublic,
    onToggleFavorite: toggleFavorite,
    allDreams: dreams,
    className: "h-full",
  };

  const logButton = (
    <FormModal dateLabel={longDate} onAddDream={(values) => addDream({ ...values, date: selectedDate })}>
      <Button className="rounded-full shrink-0 h-11 px-4" aria-label="Add a new dream" title="Add a new dream">
        <Plus className="size-4" strokeWidth={2.25} />
        <span className="hidden sm:inline">Log a dream</span>
      </Button>
    </FormModal>
  );

  return (
    <div className="lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-8 lg:items-start">
      {/* ------------------------------------------------- the sidebar (desktop) */}
      <aside className="hidden lg:flex flex-col gap-4 sticky top-24 reveal">
        <SideCard title="The calendar" className="!p-2 pt-4">
          <div className="px-2">
            <MonthCalendar
              key={selectedDate.slice(0, 7)}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              markedDates={dreamDatesSet}
              className="!p-0 w-full [--cell-size:--spacing(9)]"
            />
          </div>
          {!isToday && (
            <div className="px-2 pt-2 pb-1">
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => setSelectedDate(toLocalDateString(new Date()))}>
                <MoonStar /> Back to today
              </Button>
            </div>
          )}
        </SideCard>

        <SideCard title="Find a dream">
          <FiltersPanel filters={filters} onChange={setFilters} />
        </SideCard>

        <SideCard title="At a glance">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="flex items-center justify-center gap-1 font-serif text-2xl leading-none text-gold">
                <Flame className="size-4" strokeWidth={1.75} />
                {streaks.current}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Streak</p>
            </div>
            <div>
              <p className="font-serif text-2xl leading-none">{dreams.length}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Dreams</p>
            </div>
            <div>
              <p className="font-serif text-2xl leading-none">{monthCount}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">This month</p>
            </div>
          </div>
        </SideCard>
      </aside>

      {/* ------------------------------------------------------- the page itself */}
      <div className="min-w-0">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div className="animate-focus-in">
            <p className="font-hand text-2xl leading-none text-primary/90 mb-1.5">{isSearching ? "Across the whole journal" : longDate}</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl sm:text-4xl font-serif text-moonglow">{isSearching ? "Search results" : "Dream Journal"}</h2>
              {streaks.current > 0 && (
                <span
                  className="lg:hidden flex items-center gap-1 text-xs font-medium text-gold bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-full"
                  title="Days in a row with a dream logged"
                >
                  <Flame className="size-3.5" strokeWidth={1.75} />
                  {streaks.current} day{streaks.current === 1 ? "" : "s"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1.5">
              {loading
                ? "Turning the pages…"
                : isSearching
                  ? `${results.length} ${results.length === 1 ? "dream" : "dreams"} match`
                  : dayDreams.length === 0
                    ? "A blank page today."
                    : `${dayDreams.length} ${dayDreams.length === 1 ? "entry" : "entries"} on this page`}
            </p>
          </div>
          {logButton}
        </div>

        {/* Phones and tablets: the sidebar's jobs, condensed. Search stays in
            view, filters and the month calendar each open in a sheet, and the
            week strip covers day-to-day moves. */}
        <div className="lg:hidden flex flex-col gap-3 mb-6 reveal" style={{ "--i": 1 } as React.CSSProperties}>
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary" strokeWidth={1.75} />
              <Input
                type="text"
                placeholder="Search every dream…"
                aria-label="Search every dream"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10 pr-9"
              />
              {filters.search && (
                <button type="button" onClick={() => setFilters({ ...filters, search: "" })} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 cursor-pointer">
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative" onClick={() => setFiltersOpen(true)} aria-label="Filters">
              <SlidersHorizontal />
              {activeFilters - (filters.search.trim() ? 1 : 0) > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                  {activeFilters - (filters.search.trim() ? 1 : 0)}
                </span>
              )}
            </Button>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => setCalendarOpen(true)} aria-label="Open the calendar">
              <CalendarDays />
            </Button>
          </div>
          {!isSearching && (
            <div className="flex justify-center">
              <WeekDatePicker key={weekKey} selectedDate={selectedDate} onSelectDate={setSelectedDate} markedDates={dreamDatesSet} />
            </div>
          )}
        </div>

        {loading ? (
          <DreamListSkeleton />
        ) : isSearching ? (
          groups.length === 0 ? (
            <EmptyState
              title="Nothing matches that"
              note="try a different word, or clear a filter"
              action={
                <Button variant="outline" onClick={() => setFilters(NO_FILTERS)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-8">
              {groups.map(([date, list], gi) => (
                <section key={date}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setFilters(NO_FILTERS);
                    }}
                    className="group mb-3 flex items-center gap-2 font-hand text-2xl text-primary/90 hover:text-primary cursor-pointer"
                    title="Open this day"
                  >
                    {format(parseLocalDateString(date), "EEEE, d MMMM yyyy")}
                    <span className="text-sm font-sans text-muted-foreground opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0">open day →</span>
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 items-stretch">
                    {list.map((dream, i) => (
                      <div key={dream.id} className="reveal" style={{ "--i": gi + i } as React.CSSProperties}>
                        <DreamCard {...dream} {...cardProps} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : dayDreams.length === 0 ? (
          <EmptyState
            title="A blank page is waiting"
            note="what did you see last night?"
            action={
              <FormModal dateLabel={longDate} onAddDream={(values) => addDream({ ...values, date: selectedDate })}>
                <Button className="rounded-full">
                  <Feather /> Write the first entry
                </Button>
              </FormModal>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
            {dayDreams.map((dream, i) => (
              <div key={dream.id} className="reveal" style={{ "--i": i } as React.CSSProperties}>
                <DreamCard {...dream} {...cardProps} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------ phone sheets: filters, calendar */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Find a dream</DialogTitle>
            <DialogDescription>Filters search the whole journal, not just today.</DialogDescription>
          </DialogHeader>
          <FiltersPanel filters={filters} onChange={setFilters} showSearch={false} />
          <Button onClick={() => setFiltersOpen(false)}>Show results</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Jump to a day</DialogTitle>
            <DialogDescription>Gold dots mark days with a dream.</DialogDescription>
          </DialogHeader>
          <MonthCalendar
            key={selectedDate.slice(0, 7)}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setCalendarOpen(false);
            }}
            markedDates={dreamDatesSet}
            className="!p-0 mx-auto"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ title, note, action }: { title: string; note: string; action: React.ReactNode }) {
  // An empty day is an invitation, not an error: a blank page with a quill
  // and one clear next step.
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center animate-in fade-in duration-500">
      <span className="relative flex size-20 items-center justify-center rounded-full border border-dashed border-white/15">
        <span className="absolute inset-2 rounded-full bg-primary/10 blur-xl animate-halo" aria-hidden="true" />
        <Feather className="relative size-8 text-primary/80" strokeWidth={1.25} />
      </span>
      <div>
        <p className="font-serif text-xl">{title}</p>
        <p className="font-hand text-xl text-muted-foreground mt-1">{note}</p>
      </div>
      {action}
    </div>
  );
}
