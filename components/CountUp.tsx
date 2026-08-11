"use client";

import { useEffect, useRef, useState } from "react";

// Animates from 0 to `value` once (or again whenever `value` changes) via
// requestAnimationFrame, a fixed-duration tween rather than a CSS
// transition, since there's no CSS way to transition the text content of a
// number. Stops itself once it reaches the target, it isn't a continuous
// per-frame cost.
export default function CountUp({
  value,
  duration = 900,
  decimals = 0,
}: {
  value: number;
  duration?: number;
  decimals?: number;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const scale = 10 ** decimals;

  useEffect(() => {
    const from = fromRef.current;
    const delta = value - from;
    if (delta === 0) return;

    let frameId: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round((from + delta * eased) * scale) / scale);
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, scale]);

  return <>{display.toFixed(decimals)}</>;
}
