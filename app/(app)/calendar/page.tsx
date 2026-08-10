"use client";

import { useState, useEffect } from "react";
import { CalendarDays } from "lucide-react";
import { useDreams } from "@/context/DreamContext";
import Layout from "@/components/Layout";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DreamCard from "@/components/DreamCard";
import LoadingState from "@/components/LoadingState";
import { toLocalDateString, parseLocalDateString } from "@/lib/utils";

export default function CalendarPage() {
  const { dreams, loading, selectedDate, setSelectedDate, updateDream, deleteDream, togglePublic } = useDreams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  // selectedDate's initial value comes from `new Date()`, which can differ
  // between the server render and client hydration (different instant,
  // possibly different timezone) — gating on mount avoids rendering
  // anything date-dependent until the client's real value has settled.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dreamDatesSet = new Set(dreams.map((d) => d.date));
  const dreamsForSelectedDate = dreams.filter((d) => d.date === selectedDate);

  const handleSelect = (value: Date | undefined) => {
    if (!value) return;
    setSelectedDate(toLocalDateString(value));
    setIsModalOpen(true);
  };

  if (!mounted) return null;

  return (
    <Layout>
      <div className="flex items-center gap-2.5 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <CalendarDays className="size-6 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl font-serif">Dream Calendar</h2>
      </div>

      <div className="flex justify-center animate-in fade-in zoom-in-95 duration-500 delay-75 fill-mode-both">
        <Calendar
          mode="single"
          selected={parseLocalDateString(selectedDate)}
          onSelect={handleSelect}
          captionLayout="dropdown"
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
          modifiers={{
            hasDream: (date) => dreamDatesSet.has(toLocalDateString(date)),
          }}
          modifiersClassNames={{
            hasDream:
              "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1 after:rounded-full after:bg-primary",
          }}
        />
      </div>

      <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">View Dreams on {selectedDate}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[60vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 z-10">
              <DialogTitle>Dreams on {selectedDate}</DialogTitle>
            </DialogHeader>

            {loading ? (
              <LoadingState label="Gathering your dreams…" />
            ) : dreamsForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No dreams logged for this date yet.
              </p>
            ) : (
              <div className="space-y-3">
                {dreamsForSelectedDate.map((dream) => (
                  <DreamCard
                    key={dream.id}
                    {...dream}
                    onEdit={updateDream}
                    onDelete={deleteDream}
                    onTogglePublic={togglePublic}
                  />
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
