import DreamListSkeleton from "@/components/DreamListSkeleton";

// Next's file-convention loading UI: automatically wraps every page in this
// route group in a Suspense boundary, so server-fetched pages (this one,
// dream/[id]) show this instead of a frozen screen while their Supabase
// queries are in flight. Client-driven pages (Journal, Analytics) resolve
// instantly server-side, so this rarely shows for them. Only wraps the
// page slot, not the shared layout, Navbar (in app/(app)/layout.tsx)
// keeps rendering as-is underneath, it doesn't remount for this.
//
// It shows the outline of a page (a heading and a row of cards, all
// shimmering) rather than a lone icon: the layout is already roughly right
// when the real content arrives, so nothing jumps.
// Refer: https://nextjs.org/docs/app/api-reference/file-conventions/loading
export default function Loading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Drifting in…</span>
      <div className="mb-8 space-y-3" aria-hidden="true">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-10 w-72 max-w-full" />
        <div className="skeleton h-4 w-56 max-w-full" />
      </div>
      <DreamListSkeleton />
    </div>
  );
}
