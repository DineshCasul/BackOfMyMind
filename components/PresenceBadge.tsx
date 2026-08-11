"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Presence tracking lives here on its own, not inside LiveFeed, it's
// really "who's on the app right now" rather than anything specific to
// the feed, and this way it can sit next to the Greeting title instead.
export default function PresenceBadge({ viewerId }: { viewerId: string }) {
  const [onlineCount, setOnlineCount] = useState(1);

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

  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
      <span className="relative flex size-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-green-500" />
      </span>
      {onlineCount} dreaming right now
    </span>
  );
}
