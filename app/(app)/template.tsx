// A template (unlike a layout) remounts on every navigation, so this entrance
// replays each time you move between pages instead of the new page just
// snapping in: a fade with a short rise. It ends with no transform applied, so
// nothing inside keeps a containing block for `position: fixed` or sticky
// elements (the Dreambook's sidebar is sticky). The Navbar and tab bar live in
// the layout above, so they never re-animate.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-out fill-mode-both">{children}</div>;
}
