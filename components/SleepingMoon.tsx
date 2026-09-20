import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

// Where the dream bubbles start and how long they wait, fixed so the server
// and the browser draw the same picture.
const BUBBLES = [
  { cx: 92, cy: 40, r: 4, delay: "0s" },
  { cx: 104, cy: 30, r: 6, delay: "1.7s" },
  { cx: 116, cy: 16, r: 8, delay: "3.3s" },
] as const;

const STARS = [
  { x: 22, y: 26, s: 5, delay: "0s" },
  { x: 132, y: 62, s: 4, delay: "1.2s" },
  { x: 14, y: 70, s: 3, delay: "2.1s" },
  { x: 68, y: 8, s: 4, delay: "0.7s" },
] as const;

// A four-point sparkle path centred on (0,0) with radius 1.
const SPARKLE = "M0 -1 Q0.12 -0.12 1 0 Q0.12 0.12 0 1 Q-0.12 0.12 -1 0 Q-0.12 -0.12 0 -1Z";

// The empty-state picture: a crescent moon, fast asleep on a cloud, dreaming
// (small bubbles float up from it). It is meant to make an empty page feel
// like a quiet night instead of an error: nothing here is broken, everyone
// is just asleep. Pure SVG + CSS animation, no images, and it stills itself
// for people who prefer reduced motion (see the global rule in globals.css).
export default function SleepingMoon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 150 130"
      role="img"
      aria-label="A crescent moon asleep on a cloud, dreaming"
      className={cn("w-40 h-auto overflow-visible", className)}
    >
      <defs>
        <radialGradient id="sm-moon" cx="32%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff7dc" />
          <stop offset="55%" stopColor="#e6dcff" />
          <stop offset="100%" stopColor="#a99bf0" />
        </radialGradient>
        <radialGradient id="sm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#b5a6ff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#b5a6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sm-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3efff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#b9adf5" stopOpacity="0.85" />
        </linearGradient>
        <mask id="sm-crescent">
          <rect width="150" height="130" fill="white" />
          <circle cx="70" cy="44" r="31" fill="black" />
        </mask>
      </defs>

      {STARS.map((st, i) => (
        <path
          key={i}
          d={SPARKLE}
          fill="#fff"
          className="animate-sparkle"
          style={{ transform: `translate(${st.x}px, ${st.y}px) scale(${st.s})`, animationDelay: st.delay, transformOrigin: "0 0" } as CSSProperties}
        />
      ))}

      {BUBBLES.map((b, i) => (
        <g key={i} className="animate-bubble-rise" style={{ animationDelay: b.delay }}>
          <circle cx={b.cx} cy={b.cy} r={b.r} fill="none" stroke="#cfc6ff" strokeOpacity="0.8" strokeWidth="1.2" />
          <circle cx={b.cx - b.r * 0.3} cy={b.cy - b.r * 0.3} r={b.r * 0.22} fill="#fff" fillOpacity="0.8" />
        </g>
      ))}

      <g className="animate-moon-breathe">
        <circle cx="52" cy="62" r="52" fill="url(#sm-glow)" />
        <circle cx="52" cy="62" r="36" fill="url(#sm-moon)" mask="url(#sm-crescent)" />
        {/* The sleeping face: a closed, downturned eye, a small smile, a blush. */}
        <path d="M30 60 q4.5 5 9 0" fill="none" stroke="#5b4da8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M32 73 q4.5 3.5 9 0" fill="none" stroke="#5b4da8" strokeWidth="1.6" strokeLinecap="round" />
        <ellipse cx="28" cy="68" rx="3.4" ry="2" fill="#ff9db8" fillOpacity="0.55" />
      </g>

      <g className="animate-cloud-drift">
        <ellipse cx="60" cy="104" rx="46" ry="12" fill="url(#sm-cloud)" />
        <circle cx="34" cy="99" r="12" fill="url(#sm-cloud)" />
        <circle cx="58" cy="94" r="15" fill="url(#sm-cloud)" />
        <circle cx="84" cy="99" r="11" fill="url(#sm-cloud)" />
      </g>
    </svg>
  );
}
