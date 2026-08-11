"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// A plain CSS scroll-snap row plus two buttons that nudge it, rather than
// a carousel library, this project doesn't have one installed and this is
// the whole feature set actually needed here.
export default function Carousel({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // Re-checked on scroll and on resize/content-size change, so the
    // arrows only ever show when there's actually somewhere to scroll to,
    // and the right arrow disappears once you've reached the end.
    function update() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    // -my-4 on the wrapper cancels out the py-4 added to the scroller
    // below, so the extra space doesn't push surrounding content around,
    // it exists purely to give `overflow-x: auto` some vertical room: per
    // spec, overflow-x set to anything but visible forces overflow-y to
    // auto too if it was visible, which was clipping each card's hover
    // lift and glow shadow at the container edge.
    <div className="relative -my-4">
      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label="Scroll left"
          className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 items-center justify-center size-8 rounded-full border border-border bg-background/90 backdrop-blur shadow-md cursor-pointer hover:scale-105 transition-transform duration-150"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label="Scroll right"
          className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 items-center justify-center size-8 rounded-full border border-border bg-background/90 backdrop-blur shadow-md cursor-pointer hover:scale-105 transition-transform duration-150"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
