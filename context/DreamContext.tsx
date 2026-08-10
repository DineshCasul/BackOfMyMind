"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { toLocalDateString } from "@/lib/utils";

export type MoodType = "happy" | "neutral" | "sad";

export type Dream = {
  id: number;
  title: string;
  description: string;
  mood: MoodType;
  date: string;
};

export type DreamContextType = {
  dreams: Dream[];
  addDream: (title: string, description: string, mood: MoodType, date: string) => void;
  updateDream: (id: number, title: string, description: string, mood: MoodType) => void;
  deleteDream: (id: number) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

const DreamContext = createContext<DreamContextType | undefined>(undefined);

export function DreamProvider({ children }: { children: ReactNode }) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    toLocalDateString(new Date())
  );
  // Guards the save effect so it can't fire with the initial empty `dreams`
  // state before the load effect below has had a chance to populate it from
  // localStorage — without this, mount briefly overwrites real stored data
  // with "[]" before immediately re-saving the real value back.
  const hasLoaded = useRef(false);

  // Load dreams from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dreams");
    if (stored) setDreams(JSON.parse(stored));
    hasLoaded.current = true;
  }, []);

  // Save dreams to localStorage whenever they change
  useEffect(() => {
    if (!hasLoaded.current) return;
    localStorage.setItem("dreams", JSON.stringify(dreams));
  }, [dreams]);

  const addDream = (title: string, description: string, mood: MoodType, date: string) => {
    const newDream: Dream = {
      // Max across all dreams, not dreams.length-1 — addDream prepends new
      // entries, so the last array element is the *oldest* dream, and using
      // its id+1 collides with an existing id once there are 3+ dreams.
      id: dreams.length > 0 ? Math.max(...dreams.map((d) => d.id)) + 1 : 1,
      title,
      description,
      mood,
      date,
    };
    setDreams([newDream, ...dreams]);
  };

  const updateDream = (id: number, title: string, description: string, mood: MoodType) => {
    setDreams((prev) =>
      prev.map((d) => (d.id === id ? { ...d, title, description, mood } : d))
    );
  };

  const deleteDream = (id: number) => {
    setDreams((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <DreamContext.Provider
      value={{ dreams, addDream, updateDream, deleteDream, selectedDate, setSelectedDate }}
    >
      {children}
    </DreamContext.Provider>
  );
}

export function useDreams() {
  const context = useContext(DreamContext);
  if (!context) throw new Error("useDreams must be used within DreamProvider");
  return context;
}
