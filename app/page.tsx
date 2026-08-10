"use client";

import * as React from "react";
import { parseDate } from "chrono-node";
import { CalendarIcon } from "lucide-react";

import { useDreams } from "@/context/DreamContext";
import Layout from "@/components/Layout";
import DreamCard from "@/components/DreamCard";
import FormModal from "@/components/FormModal";
import { toLocalDateString, parseLocalDateString } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return toLocalDateString(date);
}

export default function HomePage() {
  const {
    dreams,
    addDream,
    updateDream,
    deleteDream,
    selectedDate,
    setSelectedDate,
  } = useDreams();

  const [searchText, setSearchText] = React.useState("");
  const [filterMood, setFilterMood] = React.useState<
    "all" | "happy" | "neutral" | "sad"
  >("all");

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

  // moods for filter
  const moods = [
    { value: "all", label: "🌍 All" },
    { value: "happy", label: "😊 Happy" },
    { value: "neutral", label: "😐 Neutral" },
    { value: "sad", label: "😢 Sad" },
  ] as const;

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
      {/* Filters row */}

      <div className="flex flex-col justify-between md:flex-row md:items-center md:gap-4 mb-4">
        {/* Mood filter as badges */}
        <div className="flex flex-row">
          <div className="flex gap-2 flex-wrap mr-4">
            {moods.map((m) => (
              <Badge
                key={m.value}
                className={`cursor-pointer px-3 py-1 transition ${
                  filterMood === m.value
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
                }`}
                onClick={() => setFilterMood(m.value as typeof filterMood)}
              >
                {m.label}
              </Badge>
            ))}
          </div>

          {/* Date picker */}
          <div className="relative flex gap-2 mt-2 md:mt-0">
            <Input
              id="date"
              value={inputValue}
              placeholder="e.g. tomorrow, next week, 2025-09-23"
              className="bg-background pr-10"
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
        <FormModal
          onAddDream={(title, description, mood) =>
            addDream(title, description, mood, selectedDate)
          }
        >
          <Button className="bg-indigo-500 hover:bg-indigo-600 text-white mt-2 md:mt-0">
            + Add New Dream
          </Button>
        </FormModal>
      </div>

      {/* Dreams List */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search dreams..."
          className="mt-2 md:mt-0 flex-1"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredDreams.length === 0 ? (
          <p className="text-gray-500 text-center">
            No dreams for {selectedDate} yet.
          </p>
        ) : (
          filteredDreams.map((dream) => (
            <DreamCard
              key={dream.id}
              id={dream.id}
              title={dream.title}
              description={dream.description}
              mood={dream.mood}
              onEdit={updateDream}
              onDelete={deleteDream}
              className="p-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md transition"
            />
          ))
        )}
      </div>
    </Layout>
  );
}
