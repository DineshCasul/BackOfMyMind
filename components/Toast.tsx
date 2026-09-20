"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "info" | "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

const ToastContext = createContext<{ toast: (message: string, tone?: Tone) => void } | null>(null);

const TONE_STYLE: Record<Tone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-primary" },
  success: { icon: CircleCheck, className: "text-mood-peaceful" },
  error: { icon: TriangleAlert, className: "text-destructive" },
};

const VISIBLE_MS = 4500;
const MAX_VISIBLE = 3;

// A small toast system, in place of the browser's alert(): alert() freezes
// the page behind a system dialog that ignores the app's look, while a toast
// says the same thing in one line, in the app's own style, and gets out of
// the way by itself. Messages sit in an aria-live region, so screen readers
// announce them without stealing focus.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message: string, tone: Tone = "info") => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, message, tone }]);
      setTimeout(() => dismiss(id), VISIBLE_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 md:bottom-4 z-[70] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => {
          const { icon: Icon, className } = TONE_STYLE[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="pointer-events-auto surface flex max-w-md items-center gap-3 rounded-xl py-3 pl-4 pr-2 text-sm shadow-[0_20px_50px_-20px_oklch(0_0_0/90%)] animate-in fade-in slide-in-from-bottom-3 duration-300"
            >
              <Icon className={cn("size-4 shrink-0", className)} strokeWidth={1.75} />
              <span className="flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
