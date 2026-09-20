import { Moon } from "lucide-react";

// Shown while a page's data is on its way. Same breathing moon as the session
// intro (Greeting.tsx), now with a small gold star orbiting it, so "loading"
// reads as something quietly happening rather than a frozen icon. The orbit
// is a rotating wrapper (transform only). `role="status"` makes screen
// readers announce the label.
export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-16 text-center animate-in fade-in duration-500">
      <div className="relative size-20">
        <span className="absolute inset-2 rounded-full bg-primary/30 blur-xl animate-halo" aria-hidden="true" />
        <Moon className="relative m-auto mt-[1.4rem] size-9 text-primary animate-breathe" strokeWidth={1.25} />
        <span className="absolute inset-0 animate-[spin_3.6s_linear_infinite]" aria-hidden="true">
          <span className="absolute left-1/2 -top-0.5 size-1.5 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_10px_2px_var(--color-gold)]" />
        </span>
      </div>
      <p className="font-hand text-xl text-muted-foreground">{label}</p>
    </div>
  );
}
