import { Moon, Eye, Ghost, Repeat, type LucideIcon } from "lucide-react";
import type { DreamType } from "@/context/DreamContext";

export const DREAM_TYPE_META: Record<DreamType, { label: string; icon: LucideIcon }> = {
  normal: { label: "Normal", icon: Moon },
  lucid: { label: "Lucid", icon: Eye },
  nightmare: { label: "Nightmare", icon: Ghost },
  recurring: { label: "Recurring", icon: Repeat },
};

export const DREAM_TYPE_ORDER: DreamType[] = ["normal", "lucid", "nightmare", "recurring"];
