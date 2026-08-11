import { Smile, Laugh, Feather, Meh, Annoyed, Frown, Angry, type LucideIcon } from "lucide-react";
import type { MoodType } from "@/context/DreamContext";

// Single source of truth for how a mood renders, icon, label, and the
// CSS-var-backed color class (see --mood-* tokens in globals.css), so
// DreamCard, the mood picker in FormModal, and the filter chips on the
// homepage can't drift out of sync with each other. The set of MoodType
// values also has to stay in sync with the `mood` check constraint on the
// `dreams` table, see supabase/schema.sql.
export const MOOD_META: Record<MoodType, { label: string; icon: LucideIcon; colorClass: string }> = {
  happy: { label: "Happy", icon: Smile, colorClass: "text-mood-happy" },
  excited: { label: "Excited", icon: Laugh, colorClass: "text-mood-excited" },
  peaceful: { label: "Peaceful", icon: Feather, colorClass: "text-mood-peaceful" },
  neutral: { label: "Neutral", icon: Meh, colorClass: "text-mood-neutral" },
  annoyed: { label: "Annoyed", icon: Annoyed, colorClass: "text-mood-annoyed" },
  sad: { label: "Sad", icon: Frown, colorClass: "text-mood-sad" },
  angry: { label: "Angry", icon: Angry, colorClass: "text-mood-angry" },
};

export const MOOD_ORDER: MoodType[] = ["happy", "excited", "peaceful", "neutral", "annoyed", "sad", "angry"];
