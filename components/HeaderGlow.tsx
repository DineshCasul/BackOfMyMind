// Ambient aurora wash anchored to the top of the viewport, so it reads as
// light spilling down from the header rather than a decoration living
// inside the navbar itself, it stays fixed while the page scrolls under
// it. No z-index of its own: it paints behind normal in-flow content by
// virtue of sitting earlier in the DOM (see app/layout.tsx), and still
// shows through the navbar's translucent background above it.
export default function HeaderGlow() {
  return (
    <div
      className="fixed top-0 inset-x-0 h-72 sm:h-80 overflow-hidden pointer-events-none [mask-image:linear-gradient(to_bottom,black,transparent)]"
      aria-hidden="true"
    >
      <div className="absolute -top-24 left-[15%] size-80 sm:size-96 rounded-full bg-primary/30 blur-[70px] animate-aurora-a" />
      <div className="absolute -top-28 right-[15%] size-72 sm:size-80 rounded-full bg-mood-happy/25 blur-[70px] animate-aurora-b" />
    </div>
  );
}
