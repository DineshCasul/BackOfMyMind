"use client";

import { useEffect, useRef } from "react";

// A handful of small, individually-twinkling stars — plain SVG circles, not
// a CSS background-image, so there's nothing expensive to rasterize (see
// globals.css for why the earlier tiled-gradient approach stuttered).
// Split into two depth layers: bigger circles ("near") drift a bit more on
// scroll than smaller ones ("far"), for a subtle parallax depth cue.
const NEAR_STARS = [
  { x: 8, y: 12, r: 1.3, duration: 5, delay: 0 },
  { x: 27, y: 78, r: 1.3, duration: 4.2, delay: 0.6 },
  { x: 58, y: 35, r: 1.2, duration: 4.8, delay: 0.9 },
  { x: 76, y: 52, r: 1.3, duration: 4.5, delay: 0.2 },
  { x: 88, y: 68, r: 1.1, duration: 5.8, delay: 2.8 },
  { x: 96, y: 45, r: 1.2, duration: 4.9, delay: 2.2 },
  { x: 42, y: 60, r: 1, duration: 5.5, delay: 0.3 },
  { x: 70, y: 15, r: 1, duration: 5.2, delay: 1.5 },
] as const;

const FAR_STARS = [
  { x: 18, y: 42, r: 0.8, duration: 6.5, delay: 1.2 },
  { x: 35, y: 20, r: 0.9, duration: 7, delay: 2.1 },
  { x: 50, y: 8, r: 0.8, duration: 6, delay: 1.8 },
  { x: 63, y: 88, r: 0.9, duration: 6.8, delay: 2.5 },
  { x: 82, y: 30, r: 0.8, duration: 7.2, delay: 1.1 },
  { x: 93, y: 10, r: 0.9, duration: 6.2, delay: 0.7 },
  { x: 12, y: 90, r: 1, duration: 5.4, delay: 1.9 },
  { x: 46, y: 92, r: 0.8, duration: 6.6, delay: 0.4 },
] as const;

// Max px each layer will ever shift, however far the page scrolls — capped
// rather than unbounded, so it reads as a gentle settle rather than stars
// drifting off into nowhere on a long page.
const NEAR_MAX_SHIFT = 60;
const FAR_MAX_SHIFT = 24;

function Layer({
  stars,
  layerRef,
}: {
  stars: readonly { x: number; y: number; r: number; duration: number; delay: number }[];
  layerRef: React.RefObject<SVGGElement | null>;
}) {
  return (
    <g ref={layerRef}>
      {stars.map((star, i) => (
        <circle
          key={i}
          cx={`${star.x}%`}
          cy={`${star.y}%`}
          r={star.r}
          fill="white"
          opacity={0.6}
          style={{
            animation: `star-twinkle ${star.duration}s ease-in-out infinite alternate`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </g>
  );
}

export default function Starfield() {
  const nearRef = useRef<SVGGElement>(null);
  const farRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let ticking = false;

    function apply() {
      const y = window.scrollY;
      const nearShift = Math.min(y * 0.06, NEAR_MAX_SHIFT);
      const farShift = Math.min(y * 0.02, FAR_MAX_SHIFT);
      if (nearRef.current) nearRef.current.style.transform = `translate3d(0, ${nearShift}px, 0)`;
      if (farRef.current) farRef.current.style.transform = `translate3d(0, ${farShift}px, 0)`;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <svg className="fixed inset-0 -z-10 w-full h-full" pointerEvents="none" aria-hidden="true">
      <Layer stars={FAR_STARS} layerRef={farRef} />
      <Layer stars={NEAR_STARS} layerRef={nearRef} />
    </svg>
  );
}
