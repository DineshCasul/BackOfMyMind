import Logo from "@/components/Logo";
import type { CSSProperties, ReactNode } from "react";

// A fixed handful of drifting specks (not Math.random(): that would render
// different positions on the server and the client and cause a hydration
// mismatch). Each one rises slowly and fades, staggered so there's always
// something mid-flight. Transform and opacity only.
const MOTES = [
  { left: 8, size: 3, duration: 14, delay: 0 },
  { left: 18, size: 2, duration: 18, delay: 4 },
  { left: 27, size: 4, duration: 16, delay: 9 },
  { left: 38, size: 2, duration: 20, delay: 2 },
  { left: 47, size: 3, duration: 15, delay: 7 },
  { left: 58, size: 2, duration: 19, delay: 11 },
  { left: 66, size: 4, duration: 17, delay: 1 },
  { left: 74, size: 2, duration: 21, delay: 6 },
  { left: 83, size: 3, duration: 15, delay: 10 },
  { left: 92, size: 2, duration: 18, delay: 3 },
] as const;

interface AuthShellProps {
  title: string;
  /** A handwritten line under the title. */
  note: string;
  children: ReactNode;
  footer: ReactNode;
}

// The shared frame for login and signup: the brand mark on a soft moon halo,
// then a "journal cover" card, a gold bookmark ribbon at the top and a
// dashed inner border like stitching on a notebook, so opening the app feels
// like opening a book rather than filling in a form.
export default function AuthShell({ title, note, children, footer }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* The colour comes from the app-wide dream sky (components/Starfield.tsx);
          this layer only adds the specks that drift up behind the card. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {MOTES.map((m, i) => (
          <span
            key={i}
            className="absolute bottom-0 rounded-full bg-primary/80 animate-mote"
            style={{ left: `${m.left}%`, width: m.size, height: m.size, animationDuration: `${m.duration}s`, animationDelay: `${m.delay}s` }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center gap-3 mb-8 animate-focus-in">
          <span className="relative flex items-center justify-center size-16">
            <span className="absolute inset-0 rounded-full bg-primary/35 blur-xl animate-halo" aria-hidden="true" />
            <span className="relative flex items-center justify-center size-14 rounded-full border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_oklch(1_0_0/20%)]">
              <Logo className="size-8 text-primary" />
            </span>
          </span>
          <h1 className="text-3xl font-logo italic tracking-wide text-moonglow">back of my mind</h1>
          <p className="font-hand text-xl text-muted-foreground -mt-1">a quiet place for the things you dreamed</p>
        </div>

        <div
          className="reveal relative rounded-2xl border border-white/10 bg-card/70 backdrop-blur-xl p-7 sm:p-8 shadow-[inset_0_1px_0_oklch(1_0_0/8%),0_40px_80px_-40px_oklch(0_0_0/90%)]"
          style={{ "--i": 1 } as CSSProperties}
        >
          <span className="ribbon" style={{ "--ribbon": "var(--gold)" } as CSSProperties} aria-hidden="true" />
          <span className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-white/[0.07]" aria-hidden="true" />

          <div className="relative">
            <h2 className="text-2xl font-serif text-center">{title}</h2>
            <p className="font-hand text-xl text-primary/90 text-center mt-1 mb-6">{note}</p>
            {children}
          </div>
        </div>

        <div className="reveal mt-6 text-center text-sm text-muted-foreground" style={{ "--i": 2 } as CSSProperties}>
          {footer}
        </div>
      </div>
    </div>
  );
}
