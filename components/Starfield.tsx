// Plain static CSS background (see .star-bg in globals.css), not a fixed
// full-viewport layer: it lives in normal document flow and scrolls with
// the page like everything else, so there's no parallax vs. the content
// above it. No animation either, so it's a single paint the browser can
// reuse rather than something recomputed on scroll or over time.
export default function Starfield() {
  return <div className="star-bg absolute inset-0 -z-10 pointer-events-none" aria-hidden="true" />;
}
