"use client";

import { useState, useEffect } from "react";
import { useDreams } from "@/context/DreamContext";
import Calendar from "react-calendar";
import Layout from "@/components/Layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DreamCard from "@/components/DreamCard";
import "react-calendar/dist/Calendar.css";

export default function CalendarPage() {
  const { dreams, selectedDate, setSelectedDate } = useDreams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // <--- add mounted flag

  useEffect(() => {
    setMounted(true); // <--- only render after client mount
  }, []);

  const dreamDatesSet = new Set(dreams.map((d) => d.date));
  const dreamsForSelectedDate = dreams.filter((d) => d.date === selectedDate);

  const getLocalDateStr = (date: Date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

  const handleDateChange = (value: any) => {
    if (!value) return;
    let dateToUse: Date;
    if (value instanceof Date) dateToUse = value;
    else if (Array.isArray(value) && value[0] instanceof Date) dateToUse = value[0];
    else return;

    setSelectedDate(getLocalDateStr(dateToUse));
    setIsModalOpen(true);
  };

  if (!mounted) return null; // <--- prevent SSR render

  return (
    <Layout>
      <h2 className="text-3xl font-bold mb-6 text-center">📅 Dream Calendar</h2>

      <Calendar
        onChange={handleDateChange as any}
        value={new Date(selectedDate)}
        className="react-calendar mx-auto rounded-xl shadow-lg border border-gray-200 w-full max-w-md p-4"
        tileClassName={({ date, view }) => {
          const dayStr = getLocalDateStr(date);
          let classes = "relative transition-all duration-150 hover:bg-indigo-50";
          if (view === "month") {
            if (dreamDatesSet.has(dayStr)) classes += " font-semibold text-indigo-700";
            const todayStr = getLocalDateStr(new Date());
            if (dayStr === todayStr) classes += " border border-indigo-400 rounded";
          }
          return classes;
        }}
        tileContent={({ date, view }) => {
          if (view === "month" && dreamDatesSet.has(getLocalDateStr(date))) {
            return (
              <span className="absolute bottom-1 left-1/2 w-2 h-2 bg-yellow-300 rounded-full transform -translate-x-1/2" />
            );
          }
          return null;
        }}
      />

      <div className="mt-6 text-center">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button className="px-5 py-2 bg-indigo-500 text-white rounded-lg shadow hover:bg-indigo-600 transition">
              View Dreams on {selectedDate}
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[60vh] overflow-y-auto">
            <DialogHeader className="sticky top-0 z-10">
              <DialogTitle>Dreams on {selectedDate}</DialogTitle>
            </DialogHeader>

           
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
