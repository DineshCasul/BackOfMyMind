import type { CSSProperties } from "react";

// The backdrop for the whole app: a layered "dream sky". From back to front:
//   1. a deep indigo-to-violet gradient sky with soft coloured glows,
//   2. aurora curtains: tall bands of coloured light that sway and breathe,
//   3. the tiled static stars that scroll with the page (.star-bg),
//   4. two star layers that twinkle out of step with each other,
//   5. a few bright stars that glint,
//   6. one shooting star every so often,
//   7. very faint film grain over the top.
// Everything is `position: fixed` (except the tiled stars) and moves only by
// transform or opacity, so scrolling never repaints it. The comments in
// globals.css explain why that matters (an earlier animated tiled-gradient
// version made scrolling stutter). Reduced-motion users get the still sky:
// the global rule there switches every animation off.

// Fixed lists, not Math.random(), so the server and the client render the
// same sky (random values would differ between the two and cause a
// hydration mismatch).
const BANDS = [
  { left: "2%", c: "oklch(0.78 0.14 178)", dur: "17s", delay: "-4s" },
  { left: "24%", c: "oklch(0.68 0.18 300)", dur: "23s", delay: "-11s" },
  { left: "47%", c: "oklch(0.72 0.13 235)", dur: "19s", delay: "-2s" },
  { left: "68%", c: "oklch(0.76 0.15 340)", dur: "26s", delay: "-15s" },
  { left: "84%", c: "oklch(0.78 0.13 165)", dur: "21s", delay: "-8s" },
] as const;

const GLINTS = [
  { left: "7%", top: "14%", s: 20, dur: "6.5s", delay: "0s" },
  { left: "19%", top: "58%", s: 12, dur: "8s", delay: "-3s" },
  { left: "31%", top: "8%", s: 16, dur: "7s", delay: "-5s" },
  { left: "44%", top: "36%", s: 10, dur: "9s", delay: "-1s" },
  { left: "58%", top: "16%", s: 22, dur: "7.5s", delay: "-6s" },
  { left: "71%", top: "48%", s: 12, dur: "8.5s", delay: "-2s" },
  { left: "83%", top: "10%", s: 18, dur: "6s", delay: "-4s" },
  { left: "92%", top: "40%", s: 12, dur: "9.5s", delay: "-7s" },
  { left: "12%", top: "82%", s: 14, dur: "7s", delay: "-3.5s" },
  { left: "64%", top: "84%", s: 16, dur: "8s", delay: "-5.5s" },
] as const;

export default function Starfield() {
  return (
    <>
      <div className="dream-sky" aria-hidden="true" />
      <div className="aurora" aria-hidden="true">
        {BANDS.map((b, i) => (
          <span
            key={i}
            className="aurora-band"
            style={{ left: b.left, "--c": b.c, "--dur": b.dur, "--delay": b.delay } as CSSProperties}
          />
        ))}
      </div>
      <div className="star-bg absolute inset-0 -z-10 pointer-events-none" aria-hidden="true" />
      <div className="sky-twinkle sky-twinkle-a" aria-hidden="true" />
      <div className="sky-twinkle sky-twinkle-b" aria-hidden="true" />
      {GLINTS.map((g, i) => (
        <span
          key={i}
          className="glint"
          aria-hidden="true"
          style={{ left: g.left, top: g.top, "--s": `${g.s}px`, "--dur": g.dur, "--delay": g.delay } as CSSProperties}
        />
      ))}
      <div className="shooting-star" aria-hidden="true" />
      <div className="sky-grain" aria-hidden="true" />
    </>
  );
}
