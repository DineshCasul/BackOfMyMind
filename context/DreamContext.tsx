"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    new Date().toISOString().split("T")[0]
  );

  // Load dreams from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dreams");
    if (stored) setDreams(JSON.parse(stored));
  }, []);

  // Save dreams to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("dreams", JSON.stringify(dreams));
  }, [dreams]);

  const addDream = (title: string, description: string, mood: MoodType, date: string) => {
    const newDream: Dream = {
      id: dreams.length > 0 ? dreams[dreams.length - 1].id + 1 : 1,
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
