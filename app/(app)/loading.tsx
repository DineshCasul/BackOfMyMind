import LoadingState from "@/components/LoadingState";

// Next's file-convention loading UI: automatically wraps every page in this
// route group in a Suspense boundary, so server-fetched pages (this one,
// dream/[id]) show this instead of a frozen screen while their Supabase
// queries are in flight. Client-driven pages (Journal, Analytics) resolve
// instantly server-side, so this never flashes for them. Only wraps the
// page slot, not the shared layout, Navbar (in app/(app)/layout.tsx)
// keeps rendering as-is underneath, it doesn't remount for this.
// Refer: https://nextjs.org/docs/app/api-reference/file-conventions/loading
export default function Loading() {
  return <LoadingState label="Drifting in…" />;
}
