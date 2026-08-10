"use client";

import * as React from "react";
import { parseDate } from "chrono-node";
import { CalendarIcon, Sparkles, MoonStar } from "lucide-react";

import { useDreams } from "@/context/DreamContext";
import Layout from "@/components/Layout";
import DreamCard from "@/components/DreamCard";
import FormModal from "@/components/FormModal";
import LoadingState from "@/components/LoadingState";
import { toLocalDateString, parseLocalDateString, cn } from "@/lib/utils";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import type { MoodType } from "@/context/DreamContext";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return toLocalDateString(date);
}

type MoodFilter = "all" | MoodType;

export default function JournalPage() {
  const {
    dreams,
    loading,
    addDream,
    updateDream,
    deleteDream,
    togglePublic,
    selectedDate,
    setSelectedDate,
  } = useDreams();

  const [searchText, setSearchText] = React.useState("");
  const [filterMood, setFilterMood] = React.useState<MoodFilter>("all");

  // date picker state
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(selectedDate);
  const [date, setDate] = React.useState<Date | undefined>(
    selectedDate ? parseLocalDateString(selectedDate) : undefined
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);

  // sync dream context date if user types
  const handleInputChange = (val: string) => {
    setInputValue(val);
    const parsed = parseDate(val);
    if (parsed) {
      setDate(parsed);
      setMonth(parsed);
      setSelectedDate(formatDate(parsed));
    }
  };

  // when user selects date in calendar
  const handleSelect = (selected: Date | undefined) => {
    if (!selected) return;
    setDate(selected);
    const formatted = formatDate(selected);
    setInputValue(formatted);
    setSelectedDate(formatted);
    setOpen(false);
  };

  // filter dreams
  const filteredDreams = dreams.filter(
    (dream) =>
      dream.date === selectedDate &&
      (filterMood === "all" || dream.mood === filterMood) &&
      (dream.title.toLowerCase().includes(searchText.toLowerCase()) ||
        dream.description.toLowerCase().includes(searchText.toLowerCase()))
  );

  return (
    <Layout>
      <div className="flex items-center gap-2.5 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <MoonStar className="size-6 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl font-serif">Your Dreams</h2>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Mood filter */}
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
            {MOOD_ORDER.map((m) => {
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
          </div>

          {/* Date picker */}
          <div className="relative flex gap-2">
            <Input
              id="date"
              value={inputValue}
              placeholder="e.g. tomorrow, next week, 2025-09-23"
              className="bg-background pr-10 w-56"
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
            />
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                >
                  <CalendarIcon className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto overflow-hidden p-0"
                align="end"
              >
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  month={month}
                  onMonthChange={setMonth}
                  onSelect={handleSelect}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Add Dream */}
        <FormModal onAddDream={(values) => addDream({ ...values, date: selectedDate })}>
          <Button>+ Add New Dream</Button>
        </FormModal>
      </div>

      {/* Dreams List */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search dreams..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
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
              <DreamCard {...dream} onEdit={updateDream} onDelete={deleteDream} onTogglePublic={togglePublic} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
