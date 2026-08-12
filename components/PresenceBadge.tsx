"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Presence tracking lives here on its own, not inside LiveFeed, it's
// really "who's on the app right now" rather than anything specific to
// the feed, and this way it can sit next to the Greeting title instead.
export default function PresenceBadge({ viewerId }: { viewerId: string }) {
  const [onlineCount, setOnlineCount] = useState(1);
  // The dot already has a continuous subtle `animate-ping`; this is a
  // separate one-shot burst specifically when the count itself changes,
  // so someone joining actually reads as an event, not just ambient motion.
  const [justChanged, setJustChanged] = useState(false);
  const prevCountRef = useRef(onlineCount);

  useEffect(() => {
    const supabase = createClient();
    const presenceChannel = supabase.channel("constellation-presence", {
      config: { presence: { key: viewerId } },
    });
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        setOnlineCount(Object.keys(presenceChannel.presenceState()).length);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [viewerId]);

  useEffect(() => {
    if (prevCountRef.current === onlineCount) return;
    prevCountRef.current = onlineCount;
    setJustChanged(true);
    const timer = setTimeout(() => setJustChanged(false), 900);
    return () => clearTimeout(timer);
  }, [onlineCount]);

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        {justChanged && (
          <span
            className="absolute -inset-1.5 rounded-full bg-green-500/40"
            style={{ animation: "achievement-ring 0.9s ease-out" }}
            aria-hidden="true"
          />
        )}
        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
      </span>
      <span className={cn("transition-all duration-300", justChanged && "text-foreground scale-105")}>
        {onlineCount} dreaming right now
      </span>
    </span>
  );
}
