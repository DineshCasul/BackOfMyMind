"use client";

import * as React from "react";
import { Plus, Sparkles, MoonStar, ChevronDown, ChevronUp, Flame } from "lucide-react";

import { useDreams } from "@/context/DreamContext";
import DreamCard from "@/components/DreamCard";
import FormModal from "@/components/FormModal";
import LoadingState from "@/components/LoadingState";
import WeekDatePicker from "@/components/WeekDatePicker";
import { cn } from "@/lib/utils";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import { computeStreaks } from "@/lib/streaks";
import type { MoodType } from "@/context/DreamContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MoodFilter = "all" | MoodType;

// Enough moods now (7) that showing all of them by default crowds the
// filter row, collapse to a handful with a "More" chip to reveal the rest.
const VISIBLE_MOOD_COUNT = 5;

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

  const [searchText, setSearchText] = React.useState("");
  const [filterMood, setFilterMood] = React.useState<MoodFilter>("all");
  const [showAllMoods, setShowAllMoods] = React.useState(false);

  const visibleMoods = showAllMoods ? MOOD_ORDER : MOOD_ORDER.slice(0, VISIBLE_MOOD_COUNT);
  const hasHiddenMoods = MOOD_ORDER.length > VISIBLE_MOOD_COUNT;

  const dreamDatesSet = React.useMemo(() => new Set(dreams.map((d) => d.date)), [dreams]);
  const currentStreak = React.useMemo(() => computeStreaks(dreams.map((d) => d.date)).current, [dreams]);

  // filter dreams
  const filteredDreams = dreams.filter(
    (dream) =>
      dream.date === selectedDate &&
      (filterMood === "all" || dream.mood === filterMood) &&
      (dream.title.toLowerCase().includes(searchText.toLowerCase()) ||
        dream.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <>
      <div className="flex items-center gap-2.5 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <MoonStar className="size-6 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl font-serif">Your Dreams</h2>
        {currentStreak > 0 && (
          <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            <Flame className="size-3.5" strokeWidth={1.75} />
            {currentStreak} day{currentStreak === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Mood filter + Add Dream, always the same row so the add button
          never drops to an orphaned line of its own on narrow screens;
          items-start so it stays pinned top-right even once the chips wrap
          onto multiple lines. */}
      <div className="flex items-start justify-between gap-3 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both">
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterMood("all")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-200 hover:scale-105 cursor-pointer",
              filterMood === "all"
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-accent"
            )}
          >
            <Sparkles className="size-3.5" strokeWidth={1.75} />
            All
          </button>
          {visibleMoods.map((m) => {
            const { icon: Icon, label } = MOOD_META[m];
            const selected = filterMood === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setFilterMood(m)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-200 hover:scale-105 cursor-pointer",
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="size-3.5" strokeWidth={1.75} />
                {label}
              </button>
            );
          })}
          {hasHiddenMoods && (
            <button
              type="button"
              onClick={() => setShowAllMoods((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border border-dashed border-border text-muted-foreground hover:bg-accent transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              {showAllMoods ? (
                <>
                  <ChevronUp className="size-3.5" strokeWidth={1.75} />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="size-3.5" strokeWidth={1.75} />
                  More
                </>
              )}
            </button>
          )}
        </div>

        <FormModal onAddDream={(values) => addDream({ ...values, date: selectedDate })}>
          <Button size="icon" className="relative rounded-full shrink-0" aria-label="Add a new dream" title="Add a new dream">
            <MoonStar className="size-4" strokeWidth={1.75} />
            <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-background text-primary ring-2 ring-background">
              <Plus className="size-2.5" strokeWidth={3} />
            </span>
          </Button>
        </FormModal>
      </div>

      {/* Desktop: search left, date picker right, same row. Mobile: stacks,
          search goes full width, dates get their own line below. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
        <Input
          type="text"
          placeholder="Search…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-56 shrink-0"
        />
        <WeekDatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} markedDates={dreamDatesSet} />
      </div>

      {loading ? (
        <LoadingState label="Gathering your dreams…" />
      ) : filteredDreams.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center animate-in fade-in duration-500">
          <MoonStar className="size-8 text-muted-foreground" strokeWidth={1.25} />
          <p className="text-muted-foreground">No dreams for {selectedDate} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDreams.map((dream, i) => (
            <div
              key={dream.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              <DreamCard
                {...dream}
                onEdit={updateDream}
                onDelete={deleteDream}
                onTogglePublic={togglePublic}
                onToggleFavorite={toggleFavorite}
                allDreams={dreams}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
