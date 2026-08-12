"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { X } from "lucide-react";
import { useAchievements } from "@/context/AchievementContext";
import type { Achievement } from "@/lib/achievements";
import { cn } from "@/lib/utils";

const PARTICLE_COUNT = 18;
const AUTO_DISMISS_MS = 4800;
const CLOSE_ANIMATION_MS = 400;

// Mounted once in the (app) layout, so it fires no matter which page a
// dream gets saved from, not just on the /profile achievements grid.
export default function AchievementCelebration() {
  const { celebrating, dismissCelebration } = useAchievements();
  if (!celebrating) return null;
  // Remounts per achievement (via key) so back-to-back unlocks from the
  // queue each replay the full entrance instead of the second one reusing
  // the first's already-settled, mid-animation DOM state.
  return <Celebration key={celebrating.id} achievement={celebrating} onDismiss={dismissCelebration} />;
}

function Celebration({ achievement, onDismiss }: { achievement: Achievement; onDismiss: () => void }) {
  const [closing, setClosing] = useState(false);
  const Icon = achievement.icon;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (i / PARTICLE_COUNT) * 360 + (Math.random() * 14 - 7);
        const radius = 70 + Math.random() * 90;
        const rad = (angle * Math.PI) / 180;
        return {
          tx: Math.cos(rad) * radius,
          ty: Math.sin(rad) * radius,
          size: 3 + Math.random() * 4,
          delay: Math.random() * 0.15,
          duration: 0.9 + Math.random() * 0.6,
        };
      }),
    []
  );

  function close() {
    setClosing((already) => {
      if (already) return already;
      setTimeout(onDismiss, CLOSE_ANIMATION_MS);
      return true;
    });
  }

  useEffect(() => {
    const timer = setTimeout(close, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      onClick={close}
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm cursor-pointer transition-opacity duration-[400ms]",
        closing ? "opacity-0" : "opacity-100 animate-in fade-in duration-300"
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative flex flex-col items-center text-center gap-2 px-10 py-10 rounded-3xl border border-primary/40 bg-card shadow-[0_0_80px_-10px_var(--color-primary)] overflow-visible cursor-default transition-all duration-[400ms]",
          closing ? "opacity-0 scale-90" : "opacity-100 scale-100 animate-in zoom-in-90 duration-500"
        )}
      >
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-3xl pointer-events-none" aria-hidden="true">
          <div className="absolute -top-10 -left-10 size-48 rounded-full bg-primary/40 blur-3xl animate-aurora-a" />
          <div className="absolute -bottom-10 -right-10 size-48 rounded-full bg-mood-happy/30 blur-3xl animate-aurora-b" />
        </div>

        <div className="absolute top-24 left-1/2 size-0 pointer-events-none" aria-hidden="true">
          {particles.map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-primary"
              style={
                {
                  width: p.size,
                  height: p.size,
                  left: 0,
                  top: 0,
                  animation: `achievement-particle ${p.duration}s ease-out ${p.delay}s both`,
                  "--tx": `${p.tx}px`,
                  "--ty": `${p.ty}px`,
                } as CSSProperties
              }
            />
          ))}
        </div>

        <button
          onClick={close}
          aria-label="Dismiss"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <span className="relative flex items-center justify-center size-20">
          <span className="absolute inset-0 rounded-full bg-primary/30 animate-achievement-ring" aria-hidden="true" />
          <span
            className="absolute inset-0 rounded-full bg-primary/30 animate-achievement-ring [animation-delay:0.6s]"
            aria-hidden="true"
          />
          <span className="relative flex items-center justify-center size-16 rounded-full bg-primary/15 border border-primary/50 animate-achievement-pop">
            <Icon className="size-8 text-primary" strokeWidth={1.5} />
          </span>
        </span>

        <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mt-2">Achievement Unlocked</p>
        <h3 className="text-2xl font-serif bg-clip-text text-transparent bg-[length:200%_auto] bg-gradient-to-r from-primary via-mood-happy to-primary animate-achievement-shimmer">
          {achievement.label}
        </h3>
        <p className="text-sm text-muted-foreground max-w-xs">{achievement.description}</p>

        <div className="w-40 h-1 rounded-full bg-muted overflow-hidden mt-2">
          {!closing && (
            <div
              className="h-full w-full bg-primary/70 origin-left"
              style={{ animation: `achievement-countdown ${AUTO_DISMISS_MS}ms linear forwards` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
