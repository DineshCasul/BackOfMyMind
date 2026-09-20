"use client";

import { useEffect, useRef, useState } from "react";

// Animates from the last shown number to `value` via requestAnimationFrame, a
// fixed-duration tween rather than a CSS transition, since there's no CSS way
// to transition the text content of a number. It stops itself on arrival, so
// it isn't a continuous per-frame cost. With "reduce motion" on, it skips the
// tween and just shows the number.
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

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    let frameId: number;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const next = Math.round((from + delta * eased) * scale) / scale;
      // Skip the render when the rounded number hasn't changed (most frames,
      // for small numbers like a streak of 3).
      setDisplay((prev) => (prev === next ? prev : next));
      if (progress < 1) frameId = requestAnimationFrame(tick);
      else fromRef.current = value;
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, scale]);

  return <>{display.toFixed(decimals)}</>;
}
