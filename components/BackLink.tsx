"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

// "Back" should mean back to where you came from. A plain link to "/" sends
// someone who opened a dream from the Dreambook, or from a search, to the
// home page instead, and loses their place. If they arrived from another
// page of this app, this goes back in history; only if they didn't (a shared
// link opened directly) does it fall back to a fixed page. The href is still
// a real link, so opening it in a new tab or with a screen reader works.
export default function BackLink({ fallback, className, children }: { fallback: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  return (
    <Link
      href={fallback}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        const cameFromHere = document.referrer.startsWith(window.location.origin) && window.history.length > 1;
        if (cameFromHere) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
