import { cn } from "@/lib/utils";

// Placeholder pages with the same outline as a DreamCard (date line, mood
// line, title, three text lines, a footer), so when the real cards arrive
// nothing jumps: they replace shapes that already had the right size. That
// steadier layout, plus the shimmer, feels quicker than a lone spinner even
// when the wait is the same.
export function DreamCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("surface rounded-2xl p-5 flex flex-col gap-4", className)} aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="skeleton h-4 w-20" />
        <div className="skeleton h-3 w-14" />
      </div>
      <div className="space-y-2.5">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-6 w-4/5" />
      </div>
      <div className="space-y-2.5">
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-full" />
        <div className="skeleton h-3.5 w-2/3" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="skeleton h-3.5 w-24" />
        <div className="skeleton h-6 w-28 rounded-full" />
      </div>
    </div>
  );
}

export default function DreamListSkeleton({ count = 3, label = "Gathering your dreams…" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="reveal" style={{ "--i": i } as React.CSSProperties}>
            <DreamCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
