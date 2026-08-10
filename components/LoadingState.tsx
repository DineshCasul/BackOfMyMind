import { Moon } from "lucide-react";

// Reuses the same breathing-moon motif as the session intro (Greeting.tsx)
// rather than a generic spinner, to stay consistent with the rest of the
// app's "peaceful" motion language.
export default function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center animate-in fade-in duration-500">
      <Moon className="size-8 text-primary animate-breathe" strokeWidth={1.25} />
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}
