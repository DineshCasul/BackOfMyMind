"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  extra?: React.ReactNode;
};

const INTRO_SEEN_KEY = "backofmymind_intro_seen";

function hasSeenIntro(): boolean {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === "true";
  } catch {
    // Storage can throw in some privacy modes, fail open (play the intro)
    // rather than crash the page over a decorative animation.
    return false;
  }
}

function markIntroSeen(): void {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "true");
  } catch {
    // Ignore, worst case the intro replays next time, not a real problem.
  }
}

// A pool per time-of-day instead of one fixed line, so the greeting
// doesn't say the exact same thing on every single visit.
const LATE_NIGHT_PHRASES = [
  "Still up? Sweet dreams whenever you get there",
  "The night is quiet, let your mind wander",
  "Burning the midnight oil? Rest is calling",
  "The stars are still out, and so are you",
  "Whenever you're ready, the dreamworld's waiting",
  "Late night thoughts make for the best dreams",
  "The world's asleep, but you're still here",
];

const MORNING_PHRASES = [
  "Good morning, hope you had a nice sleep",
  "Rise and shine, what did you dream last night?",
  "A new day, fresh from the dreamworld",
  "Morning has broken, did your dreams linger?",
  "Good morning, the world's just waking up with you",
  "Hope your dreams were kind to you last night",
  "Morning light, and whatever dreams came with it",
];

const AFTERNOON_PHRASES = [
  "Good afternoon",
  "Hope your day's treating you well",
  "Midday check-in, how's it going?",
  "The sun's high, how's your day unfolding?",
  "Good afternoon, halfway through the day already",
  "Taking a moment in the middle of the day",
  "Good afternoon, hope it's been a good one so far",
];

const EVENING_PHRASES = [
  "Good evening",
  "The day's winding down, how was it?",
  "Evening's here, time to slow down a little",
  "Good evening, the sky's putting on a show",
  "As the sun sets, what's on your mind?",
  "Good evening, the quiet hours are near",
  "Evening settles in, day's almost done",
];

const NIGHT_PHRASES = [
  "Good night, sweet dreams ahead",
  "Time to drift off, may your dreams be vivid",
  "The stars are out, ready when you are",
  "Sleep tight, see you in the dreamworld",
  "Good night, let your mind wander freely tonight",
  "Sweet dreams, whatever they may hold",
  "Good night, the sky's clear for dreaming",
];

function pick(phrases: string[]): string {
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function greetingFor(hour: number): { text: string; icon: LucideIcon } {
  if (hour < 5) return { text: pick(LATE_NIGHT_PHRASES), icon: Moon };
  if (hour < 12) return { text: pick(MORNING_PHRASES), icon: Sunrise };
  if (hour < 17) return { text: pick(AFTERNOON_PHRASES), icon: Sun };
  if (hour < 21) return { text: pick(EVENING_PHRASES), icon: Sunset };
  return { text: pick(NIGHT_PHRASES), icon: Moon };
}

type Phase = "idle" | "iconIn" | "textIn" | "hold" | "fadeOut" | "done";

// Plays once per browser session (sessionStorage, clears when the tab
// closes): a slow, centered, full-screen reveal of the greeting before
// settling into its normal spot at the top of the page. Depends on the
// visitor's local clock, which the server can't know, nothing renders
// until after mount, same pattern as everywhere else timezone-sensitive
// in this app, so there's no hydration mismatch.
export default function Greeting({ name, extra }: Props) {
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

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 animate-in fade-in slide-in-from-bottom-2 duration-700 fill-mode-both">
        <Icon className="size-7 sm:size-8 text-primary shrink-0" strokeWidth={1.5} />
        <h1 className="text-2xl sm:text-3xl font-serif">
          {text}
          {name ? `, ${name}` : ""}.
        </h1>
        <div className="ml-auto">{extra}</div>
      </div>
    </>
  );
}
