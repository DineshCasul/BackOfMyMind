"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Moon, LogOut, Menu, X, User } from "lucide-react";
import { logout } from "@/app/login/actions";
import { useDreams } from "@/context/DreamContext";
import EditProfileDialog from "./EditProfileDialog";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Starfield" },
  { href: "/journal", label: "Journal" },
  { href: "/analytics", label: "Analytics" },
];

// A few fixed positions rather than random-per-render, so they don't
// reshuffle on every re-render (state updates, hover, etc).
const NAV_STARS = [
  { x: 15, y: 30, r: 2, duration: 4.5, delay: 0 },
  { x: 38, y: 70, r: 1.5, duration: 5, delay: 1.2 },
  { x: 62, y: 20, r: 1.5, duration: 4, delay: 0.6 },
  { x: 80, y: 60, r: 2, duration: 5.5, delay: 2 },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const { displayName, updateDisplayName } = useDreams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // A single dot that slides between links, rather than each link owning
  // its own always-present-but-faded dot, measured via refs since there's
  // no animation library in this project to hand a shared layout id to.
  const navLinksRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [dotX, setDotX] = useState<number | null>(null);

  useEffect(() => {
    function measure() {
      const activeLink = linkRefs.current[pathname];
      const container = navLinksRef.current;
      if (!activeLink || !container) {
        setDotX(null);
        return;
      }
      const linkRect = activeLink.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setDotX(linkRect.left - containerRect.left + linkRect.width / 2);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <nav className="relative border-b border-border/60 bg-background/85 backdrop-blur-md sticky top-0 z-40 shadow-[0_12px_30px_-20px_var(--color-primary)] animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
      {/* A handful of tiny fixed stars echoing the page-level Starfield, so
          the chrome feels like part of the same sky rather than a plain
          UI bar sitting on top of it. */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {NAV_STARS.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.r,
              height: star.r,
              opacity: 0.6,
              animation: `star-twinkle ${star.duration}s ease-in-out infinite alternate`,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center relative">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 min-w-0 transition-transform duration-200 hover:scale-105"
        >
          <span className="relative flex items-center justify-center shrink-0">
            <span className="absolute inset-0 rounded-full bg-primary/40 blur-md animate-breathe" aria-hidden="true" />
            <Moon className="relative size-5 text-primary" strokeWidth={1.75} />
          </span>
          <span className="text-lg sm:text-xl font-logo italic tracking-wide truncate">
            back of my mind
          </span>
        </Link>

        {/* Desktop nav links, absolutely centered against the whole bar
            (not just the space between logo and profile/logout) so it
            reads as a true centered nav regardless of how wide either
            side happens to be. */}
        <div
          ref={navLinksRef}
          className="hidden sm:flex absolute left-1/2 -translate-x-1/2 items-center gap-5 sm:gap-6"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                className={cn(
                  "text-sm sm:text-base transition-all duration-200 hover:scale-105",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 -bottom-2 size-1 rounded-full bg-primary shadow-[0_0_8px_2px_var(--color-primary)] transition-[opacity,transform] duration-300 ease-out",
              dotX === null ? "opacity-0" : "opacity-100"
            )}
            style={{ transform: `translateX(${(dotX ?? 0) - 2}px)` }}
          />
        </div>

        {/* Profile + logout, pinned right */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <button
            onClick={() => setIsEditProfileOpen(true)}
            aria-label="Edit profile"
            title={displayName || "Edit profile"}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-105 cursor-pointer max-w-[10rem]"
          >
            <User className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{displayName}</span>
          </button>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Log out"
              className="text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-110 cursor-pointer"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          className="sm:hidden -m-2 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer shrink-0"
        >
          {isMenuOpen ? (
            <X className="size-5" strokeWidth={1.75} />
          ) : (
            <Menu className="size-5" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="sm:hidden absolute top-full left-0 right-0 mx-4 mt-2 bg-background/95 backdrop-blur-md border border-border/60 rounded-2xl p-4 flex flex-col gap-4 shadow-lg shadow-primary/10 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "text-base transition-colors",
                  isActive ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="border-t border-border pt-4 flex flex-col gap-4">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditProfileOpen(true);
              }}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <User className="size-4" strokeWidth={1.75} />
              {displayName || "Edit profile"}
            </button>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-2 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              >
                <LogOut className="size-4" strokeWidth={1.75} />
                Log out
              </button>
            </form>
          </div>
        </div>
      )}

      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        currentName={displayName}
        onSave={updateDisplayName}
      />
    </nav>
  );
}
