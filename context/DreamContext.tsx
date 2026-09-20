"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { fromRow } from "@/lib/dreams";
import { toLocalDateString } from "@/lib/utils";
import { useToast } from "@/components/Toast";

export type MoodType = "happy" | "excited" | "peaceful" | "neutral" | "annoyed" | "sad" | "angry";
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
  isFavorite: boolean;
  /** ISO timestamp the row was created. Absent on dreams built client-side before a reload. */
  createdAt?: string;
};

// Everything addDream/updateDream need, minus what the caller doesn't
// control (id), kept as one object rather than a growing positional
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

// What the profile lookup on the server found. Only "missing" and "unnamed"
// justify writing a name; "error" means we don't KNOW, and a write based on
// not knowing is exactly how a real nickname gets overwritten.
export type ProfileState = "ok" | "missing" | "unnamed" | "error";

export const DISPLAY_NAME_MAX = 40;

export type DreamContextType = {
  dreams: Dream[];
  loading: boolean;
  addDream: (input: DreamInput) => Promise<void>;
  updateDream: (id: string, input: Omit<DreamInput, "date">) => Promise<void>;
  deleteDream: (id: string) => Promise<void>;
  togglePublic: (id: string, isPublic: boolean) => Promise<void>;
  toggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  displayName: string;
  updateDisplayName: (name: string) => Promise<void>;
};

const DreamContext = createContext<DreamContextType | undefined>(undefined);

export function DreamProvider({
  userId,
  userEmail,
  serverToday,
  initialProfile,
  children,
}: {
  userId: string;
  userEmail: string;
  /** What the server found when it looked up this user's profile row. */
  initialProfile: { name: string; state: ProfileState };
  /** "Today" as the server sees it. Used as the very first selected date so
      the server render and the browser's first render agree (see below). */
  serverToday: string;
  children: ReactNode;
}) {
  const toast = useToast();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  // The server and the visitor's browser can be on different calendar days:
  // at 1am in India the server (UTC) is still on yesterday. The first render
  // must match what the server sent, so it starts from the server's "today";
  // then, right after hydration, it moves to the visitor's own today, unless
  // they have already picked a day by then. Starting from the browser's date
  // instead would cause a hydration mismatch, and starting from the server's
  // date and staying there would open the journal on the wrong day.
  const [selectedDate, setSelectedDate] = useState<string>(serverToday);
  useEffect(() => {
    const localToday = toLocalDateString(new Date());
    setSelectedDate((current) => (current === serverToday ? localToday : current));
  }, [serverToday]);
  // Starts as the server's answer, so the very first paint already has the
  // right name (no flash of an empty name or a fallback).
  const [displayName, setDisplayName] = useState(initialProfile.name);
  const supabase = createClient();
  const router = useRouter();

  const refetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("dreams")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      // Without this an outage looks exactly like an empty journal.
      toast("Couldn't load your dreams. Check your connection and refresh.", "error");
    } else if (data) {
      setDreams(data.map(fromRow));
    }
    setLoading(false);
  }, [supabase, userId, toast]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Keeping the profile's name sensible, without ever destroying a real one.
  //
  // The old version of this asked "is there a name?" and, on ANY empty answer
  // (including a failed request), wrote the email prefix over it: a network
  // blip during a token refresh could permanently replace a person's nickname.
  // Now it only writes when the server has positively confirmed there is
  // nothing there, and each write is shaped so that it cannot overwrite:
  //   missing  -> insert the row, doing nothing if one appeared meanwhile
  //   unnamed  -> set the name only where it is still null
  //   error    -> write nothing; just try a plain read again
  const { name: initialName, state: profileState } = initialProfile;
  useEffect(() => {
    if (profileState === "ok") return;
    let cancelled = false;
    const fallback = userEmail.split("@")[0] || "You";

    (async () => {
      if (profileState === "error") {
        const { data, error } = await supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle();
        if (!cancelled && !error && data?.display_name) setDisplayName(data.display_name);
        return;
      }
      const { error } =
        profileState === "missing"
          ? await supabase.from("profiles").upsert({ id: userId, display_name: fallback }, { onConflict: "id", ignoreDuplicates: true })
          : await supabase.from("profiles").update({ display_name: fallback }).eq("id", userId).is("display_name", null);
      if (!cancelled && !error && !initialName) setDisplayName(fallback);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, userEmail, profileState, initialName]);

  const updateDisplayName = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Name can't be empty.");
      if (trimmed.length > DISPLAY_NAME_MAX) throw new Error(`Keep it under ${DISPLAY_NAME_MAX} characters.`);
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: userId, display_name: trimmed }, { onConflict: "id" });
      if (error) throw new Error(error.message);
      setDisplayName(trimmed);
      router.refresh();
    },
    [supabase, userId, router]
  );

  const addDream = useCallback(
    async (input: DreamInput) => {
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
    },
    [supabase, userId]
  );

  const updateDream = useCallback(
    async (id: string, input: Omit<DreamInput, "date">) => {
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
      router.refresh();
    },
    [supabase, router]
  );

  const deleteDream = useCallback(
    async (id: string) => {
      const { error } = await supabase.from("dreams").delete().eq("id", id);
      if (error) throw new Error(error.message);
      setDreams((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    },
    [supabase, router]
  );

  const togglePublic = useCallback(
    async (id: string, isPublic: boolean) => {
      // Optimistic: flip it on screen now, and put it back if the save fails.
      // Waiting a network round trip to move a toggle makes it feel broken.
      setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, isPublic } : d)));
      const { error } = await supabase.from("dreams").update({ is_public: isPublic }).eq("id", id);
      if (error) {
        setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, isPublic: !isPublic } : d)));
        throw new Error(error.message);
      }
      router.refresh();
    },
    [supabase, router]
  );

  const toggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, isFavorite } : d)));
      const { error } = await supabase.from("dreams").update({ is_favorite: isFavorite }).eq("id", id);
      if (error) {
        setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, isFavorite: !isFavorite } : d)));
        throw new Error(error.message);
      }
      router.refresh();
    },
    [supabase, router]
  );

  // Stable reference so consumers that only read a subset of the context
  // (e.g. AchievementContext watching `dreams`) don't re-render on every
  // DreamProvider render, only when a value they depend on actually changes.
  const value = useMemo(
    () => ({
      dreams,
      loading,
      addDream,
      updateDream,
      deleteDream,
      togglePublic,
      toggleFavorite,
      selectedDate,
      setSelectedDate,
      displayName,
      updateDisplayName,
    }),
    [
      dreams,
      loading,
      addDream,
      updateDream,
      deleteDream,
      togglePublic,
      toggleFavorite,
      selectedDate,
      displayName,
      updateDisplayName,
    ]
  );

  return <DreamContext.Provider value={value}>{children}</DreamContext.Provider>;
}

export function useDreams() {
  const context = useContext(DreamContext);
  if (!context) throw new Error("useDreams must be used within DreamProvider");
  return context;
}
