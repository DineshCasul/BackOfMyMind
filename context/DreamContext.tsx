"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { fromRow } from "@/lib/dreams";
import { toLocalDateString } from "@/lib/utils";

export type MoodType = "happy" | "neutral" | "sad";
export type DreamType = "normal" | "lucid" | "nightmare" | "recurring";

export type Dream = {
  id: string;
  title: string;
  description: string;
  mood: MoodType;
  date: string;
  tags: string[];
  dreamType: DreamType;
  people: string[];
  setting: string;
  vividness: number; // 1-5
  isPublic: boolean;
};

// Everything addDream/updateDream need, minus what the caller doesn't
// control (id) — kept as one object rather than a growing positional
// argument list now that there are this many fields.
export type DreamInput = {
  title: string;
  description: string;
  mood: MoodType;
  date: string;
  tags: string[];
  dreamType: DreamType;
  people: string[];
  setting: string;
  vividness: number;
};

export type DreamContextType = {
  dreams: Dream[];
  loading: boolean;
  addDream: (input: DreamInput) => Promise<void>;
  updateDream: (id: string, input: Omit<DreamInput, "date">) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  togglePublic: (id: string, isPublic: boolean) => Promise<void>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

const DreamContext = createContext<DreamContextType | undefined>(undefined);

export function DreamProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(toLocalDateString(new Date()));
  const supabase = createClient();

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error && data) setDreams(data.map(fromRow));
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addDream = async (input: DreamInput) => {
    const { data, error } = await supabase
      .from("dreams")
      .insert({
        user_id: userId,
        title: input.title,
        description: input.description,
        mood: input.mood,
        date: input.date,
        tags: input.tags,
        dream_type: input.dreamType,
        people: input.people,
        setting: input.setting,
        vividness: input.vividness,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    setDreams((prev) => [fromRow(data), ...prev]);
  };

  const updateDream = async (id: string, input: Omit<DreamInput, "date">) => {
    const { data, error } = await supabase
      .from("dreams")
      .update({
        title: input.title,
        description: input.description,
        mood: input.mood,
        tags: input.tags,
        dream_type: input.dreamType,
        people: input.people,
        setting: input.setting,
        vividness: input.vividness,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    setDreams((prev) => prev.map((d) => (d.id === id ? fromRow(data) : d)));
  };

  const deleteDream = async (id: string) => {
    const { error } = await supabase.from("dreams").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setDreams((prev) => prev.filter((d) => d.id !== id));
  };

  const togglePublic = async (id: string, isPublic: boolean) => {
    const { error } = await supabase.from("dreams").update({ is_public: isPublic }).eq("id", id);
    if (error) throw new Error(error.message);
    setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, isPublic } : d)));
  };

  return (
    <DreamContext.Provider
      value={{
        dreams,
        loading,
        addDream,
        updateDream,
        deleteDream,
        togglePublic,
        selectedDate,
        setSelectedDate,
      }}
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
