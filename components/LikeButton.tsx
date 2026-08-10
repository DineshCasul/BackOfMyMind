"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Props = {
  dreamId: string;
  userId: string;
  initialCount: number;
  initialLiked: boolean;
  size?: "sm" | "md";
};

// Every viewer of a public dream is already logged in (the whole app is
// auth-gated), so there's no "sign in to like" case to handle here — the
// dream_likes RLS policy is what actually enforces one like per user per
// dream; this just reflects that optimistically and reverts on failure.
export default function LikeButton({ dreamId, userId, initialCount, initialLiked, size = "sm" }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const supabase = createClient();
    const wasLiked = liked;
    setPending(true);
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));

    try {
      const { error } = wasLiked
        ? await supabase.from("dream_likes").delete().eq("dream_id", dreamId).eq("user_id", userId)
        : await supabase.from("dream_likes").insert({ dream_id: dreamId, user_id: userId });
      if (error) throw error;
    } catch {
      setLiked(wasLiked);
      setCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this dream" : "Like this dream"}
      className={cn(
        "flex items-center gap-1.5 transition-all duration-200 hover:scale-110 cursor-pointer disabled:opacity-50",
        liked ? "text-primary" : "text-muted-foreground hover:text-primary",
        size === "sm" ? "text-xs" : "text-sm"
      )}
    >
      <Heart
        className={size === "sm" ? "size-3.5" : "size-4"}
        fill={liked ? "currentColor" : "none"}
        strokeWidth={1.75}
      />
      {count}
    </button>
  );
}
