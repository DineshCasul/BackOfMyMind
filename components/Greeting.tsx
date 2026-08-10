"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
};

const INTRO_SEEN_KEY = "backofmymind_intro_seen";

function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "true";
  } catch {
    // Storage can throw in some privacy modes — fail open (play the intro)
    // rather than crash the page over a decorative animation.
    return false;
  }
}

function markIntroSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "true");
  } catch {
    // Ignore — worst case the intro replays next time, not a real problem.
  }
}

function greetingFor(hour: number): { text: string; icon: LucideIcon } {
  if (hour < 5) return { text: "Still up? Sweet dreams whenever you get there", icon: Moon };
  if (hour < 12) return { text: "Good morning — hope you had a nice sleep", icon: Sunrise };
  if (hour < 17) return { text: "Good afternoon", icon: Sun };
  if (hour < 21) return { text: "Good evening", icon: Sunset };
  return { text: "Good night — sweet dreams ahead", icon: Moon };
}

type Phase = "idle" | "iconIn" | "textIn" | "hold" | "fadeOut" | "done";

// Plays once per browser session (sessionStorage — clears when the tab
// closes): a slow, centered, full-screen reveal of the greeting before
// settling into its normal spot at the top of the page. Depends on the
// visitor's local clock, which the server can't know — nothing renders
// until after mount, same pattern as everywhere else timezone-sensitive
// in this app, so there's no hydration mismatch.
export default function Greeting({ name }: Props) {
  const [greeting, setGreeting] = useState<{ text: string; icon: LucideIcon } | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));

    const skip = hasSeenIntro() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skip) {
      setShowOverlay(false);
      setPhase("done");
      markIntroSeen();
      return;
    }

    const timers = [
      setTimeout(() => setPhase("iconIn"), 300),
      setTimeout(() => setPhase("textIn"), 1500),
      setTimeout(() => setPhase("hold"), 2400),
      setTimeout(() => setPhase("fadeOut"), 4000),
      setTimeout(() => {
        setPhase("done");
        setShowOverlay(false);
        markIntroSeen();
      }, 4800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (!greeting) return <div className="h-12 sm:h-14" aria-hidden="true" />;

  const { text, icon: Icon } = greeting;
  const iconVisible = phase !== "idle" && phase !== "done";
  const textVisible = phase === "textIn" || phase === "hold" || phase === "fadeOut";
  const breathing = phase === "hold" || phase === "fadeOut";

  return (
    <>
      {showOverlay && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background transition-opacity duration-[800ms] ease-out",
            phase === "fadeOut" ? "opacity-0" : "opacity-100"
          )}
        >
          <Icon
            className={cn(
              "size-14 text-primary transition-all duration-[1200ms] ease-out",
              iconVisible ? "opacity-100 scale-100" : "opacity-0 scale-90",
              breathing && "animate-breathe"
            )}
            strokeWidth={1.25}
          />
          <h1
            className={cn(
              "text-2xl sm:text-3xl font-serif text-center px-6 transition-all duration-[900ms] ease-out",
              textVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
          >
            {text}
            {name ? `, ${name}` : ""}.
          </h1>
        </div>
      )}

      <div className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both">
        <Icon className="size-7 sm:size-8 text-primary shrink-0" strokeWidth={1.5} />
        <h1 className="text-2xl sm:text-3xl font-serif">
          {text}
          {name ? `, ${name}` : ""}.
        </h1>
      </div>
    </>
  );
}
