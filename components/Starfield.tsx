// A handful of small, individually-twinkling stars, plain SVG circles, not
// a CSS background-image, so there's nothing expensive to rasterize (see
// globals.css for why the earlier tiled-gradient approach stuttered).
// Two depth layers (bigger/smaller circles) purely for visual variety, no
// scroll-linked parallax: that used to run an unconditional
// requestAnimationFrame loop for the entire life of the app on any browser
// without `animation-timeline: scroll()` support, competing with every
// other animation on the main thread for a purely decorative depth cue.
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

function Layer({ stars }: { stars: readonly { x: number; y: number; r: number; duration: number; delay: number }[] }) {
  return (
    <g>
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
  return (
    <svg className="fixed inset-0 -z-10 w-full h-full" pointerEvents="none" aria-hidden="true">
      <Layer stars={FAR_STARS} />
      <Layer stars={NEAR_STARS} />
    </svg>
  );
}
