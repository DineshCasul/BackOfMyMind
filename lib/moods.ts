import { Smile, Meh, Frown, type LucideIcon } from "lucide-react";
import type { MoodType } from "@/context/DreamContext";

// Single source of truth for how a mood renders, icon, label, and the
// CSS-var-backed color class (see --mood-* tokens in globals.css), so
// DreamCard, the mood picker in FormModal, and the filter chips on the
// homepage can't drift out of sync with each other.
export const MOOD_META: Record<MoodType, { label: string; icon: LucideIcon; colorClass: string }> = {
  happy: { label: "Happy", icon: Smile, colorClass: "text-mood-happy" },
  neutral: { label: "Neutral", icon: Meh, colorClass: "text-mood-neutral" },
  sad: { label: "Sad", icon: Frown, colorClass: "text-mood-sad" },
};

export const MOOD_ORDER: MoodType[] = ["happy", "neutral", "sad"];
