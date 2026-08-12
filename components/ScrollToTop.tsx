"use client";

import { useEffect } from "react";

// Next's default Link navigation already scrolls to top, but on this page
// that wasn't reliably happening (came in scrolled to the bottom), so this
// forces it explicitly rather than relying on that default.
export default function ScrollToTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return null;
}
