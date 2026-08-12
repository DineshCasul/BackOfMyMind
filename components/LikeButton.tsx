"use client";

import { useState, type CSSProperties } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// A handful of fixed directions, not randomized per click, cheap and
// looks identical either way for a burst this small and this brief.
const PARTICLES = Array.from({ length: 7 }, (_, i) => {
  const angle = (i / 7) * 360;
  const rad = (angle * Math.PI) / 180;
  const radius = 12 + (i % 2) * 5;
  return { tx: Math.cos(rad) * radius, ty: Math.sin(rad) * radius, delay: i * 0.02 };
});

type Props = {
  dreamId: string;
  userId: string;
  // The dream's owner, so LikeButton can work out for itself whether this
  // viewer is allowed to like it, rather than trusting every call site to
  // separately compute that correctly. A call site that forgot would
  // otherwise get an optimistic like that flips back a moment later when
  // the dream_likes RLS insert policy rejects it server-side.
  ownerId: string;
  initialCount: number;
  initialLiked: boolean;
  size?: "sm" | "md";
};

// Every viewer of a public dream is already logged in (the whole app is
// auth-gated), so there's no "sign in to like" case to handle here, the
// dream_likes RLS policy is what actually enforces one like per user per
// dream; this just reflects that optimistically and reverts on failure.
export default function LikeButton({
  dreamId,
  userId,
  ownerId,
  initialCount,
  initialLiked,
  size = "sm",
}: Props) {
  const interactive = ownerId !== userId;
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);
  // 0 = no burst yet; incrementing (rather than a boolean) forces the
  // burst span to remount via key, so liking, unliking, then liking again
  // replays the animation instead of the second like being a no-op class
  // toggle on an already-settled element.
  const [burstKey, setBurstKey] = useState(0);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const supabase = createClient();
    const wasLiked = liked;
    setPending(true);
    setLiked(!wasLiked);
    setCount((c) => c + (wasLiked ? -1 : 1));
    if (!wasLiked) setBurstKey((k) => k + 1); // only celebrate liking, not unliking

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

  if (!interactive) {
    return (
      <span
        title="You can't like your own dream"
        onClick={(e) => {
          // Otherwise the click falls through to the card's own onClick/Link
          // underneath and navigates or opens the edit modal, since there's
          // no button here to stop it the way the interactive case below does.
          e.preventDefault();
          e.stopPropagation();
        }}
        className={cn(
          "flex items-center gap-1.5 text-muted-foreground cursor-not-allowed",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        <Heart className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={1.75} />
        {count}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Unlike this dream" : "Like this dream"}
      className={cn(
        "relative flex items-center gap-1.5 transition-all duration-200 hover:scale-110 cursor-pointer disabled:opacity-50",
        liked ? "text-primary" : "text-muted-foreground hover:text-primary",
        size === "sm" ? "text-xs" : "text-sm"
      )}
    >
      {burstKey > 0 && (
        <span key={burstKey} className="absolute left-2.5 top-1/2 size-0 pointer-events-none" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="absolute size-1 rounded-full bg-primary"
              style={
                {
                  animation: `achievement-particle 0.55s ease-out ${p.delay}s both`,
                  "--tx": `${p.tx}px`,
                  "--ty": `${p.ty}px`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}
      <Heart
        className={size === "sm" ? "size-3.5" : "size-4"}
        fill={liked ? "currentColor" : "none"}
        strokeWidth={1.75}
      />
      {count}
    </button>
  );
}
