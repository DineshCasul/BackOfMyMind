"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// A thin line of light along the top edge that fills while a page is on its
// way. The App Router gives no "navigation started" event, so it listens for
// clicks on in-app links to start, and the pathname changing means the new
// page has arrived. It moves by transform only (scaleX), so it costs nothing.
//
// Its job is to answer "did my tap do anything?" on slow connections, where
// a page that takes a second to arrive otherwise looks frozen.
export default function NavProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");
  const firstRun = useRef(true);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Not checking `defaultPrevented`: Next's <Link> always prevents the
      // browser's own navigation (it navigates client-side instead), so a
      // prevented click is exactly what an in-app navigation looks like.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setPhase("loading");
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The path changed: the page is here. Finish the line, then fade it out.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setPhase("done");
    const id = setTimeout(() => setPhase("idle"), 500);
    return () => clearTimeout(id);
  }, [pathname]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5">
      <div
        className={cn(
          "h-full origin-left bg-gradient-to-r from-primary via-gold to-primary shadow-[0_0_10px_var(--color-primary)]",
          phase === "idle" && "scale-x-0 opacity-0 transition-none",
          phase === "loading" && "scale-x-[0.8] opacity-100 transition-transform duration-[6000ms] ease-[cubic-bezier(0.1,0.7,0.2,1)]",
          phase === "done" && "scale-x-100 opacity-0 transition-[transform,opacity] duration-500 ease-out"
        )}
      />
    </div>
  );
}
