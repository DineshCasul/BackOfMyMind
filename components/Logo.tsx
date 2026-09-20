import type { SVGProps } from "react";

// The app's mark: a crescent moon with a small gold star sitting in the
// hollow of it, the thing at the back of your mind. Drawn on a 24-unit grid
// with a filled crescent (not an outline) so it stays legible at favicon
// size. The moon follows `currentColor`, the star uses the gold accent.
export default function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" />
      <path d="M16.2 4.6l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" fill="var(--color-gold)" />
    </svg>
  );
}
