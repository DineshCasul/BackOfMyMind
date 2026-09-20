"use client";

import Logo from "@/components/Logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogOut, Sparkles, BookOpen, BarChart3, Award, type LucideIcon } from "lucide-react";
import { logout } from "@/app/login/actions";
import { useDreams } from "@/context/DreamContext";
import EditProfileDialog from "./EditProfileDialog";
import QuickLog from "./QuickLog";
import { cn } from "@/lib/utils";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Starfield", icon: Sparkles },
  { href: "/journal", label: "Dreambook", icon: BookOpen },
  { href: "/analytics", label: "Patterns", icon: BarChart3 },
  { href: "/profile", label: "Achievements", icon: Award },
];

// The bar is frosted glass over the sky (you can see the aurora move behind
// it), with a hairline of moonlight along its bottom edge instead of a heavy
// shadow. The centre navigation is a pill, and the highlight inside it is one
// element that glides to whichever page is active. Its position comes from
// measuring the active link, since there is no animation library here to hand
// a shared layout id to.
export default function Navbar() {
  const pathname = usePathname();
  const { displayName, updateDisplayName } = useDreams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const navLinksRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);

  useEffect(() => {
    function measure() {
      const activeLink = linkRefs.current[pathname];
      const container = navLinksRef.current;
      if (!activeLink || !container) {
        setPill(null);
        return;
      }
      const linkRect = activeLink.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setPill({ x: linkRect.left - containerRect.left, w: linkRect.width });
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

  const initial = (displayName || "?").trim().charAt(0).toUpperCase();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
      {/* The hairline of moonlight along the bottom edge: a gradient that
          fades out at both ends, brightest in the middle. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center relative">
        <Link href="/" className="group flex items-center gap-2.5 shrink-0 min-w-0" aria-label="back of my mind, home">
          <span className="relative flex size-9 items-center justify-center shrink-0">
            <span className="absolute inset-0 rounded-full bg-primary/40 blur-md animate-halo" aria-hidden="true" />
            <span className="relative flex size-9 items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.02] shadow-[inset_0_1px_0_oklch(1_0_0/20%)] transition-transform duration-300 group-hover:rotate-[-12deg]">
              <Logo className="size-5 text-primary" />
            </span>
          </span>
          <span className="text-lg sm:text-xl font-logo italic tracking-wide truncate text-moonglow">back of my mind</span>
        </Link>

        {/* Desktop nav: a pill, centred against the whole bar (not just the
            space between the logo and the profile) so it reads as centred
            whatever the width of either side. */}
        <div
          ref={navLinksRef}
          className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1 shadow-[inset_0_1px_0_oklch(1_0_0/6%)]"
        >
          <span
            aria-hidden="true"
            className={cn(
              "absolute left-0 top-1 bottom-1 rounded-full bg-gradient-to-b from-primary/30 to-primary/15 border border-primary/30 shadow-[0_0_20px_-4px_var(--color-primary)] transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.34,1.3,0.5,1)]",
              pill === null ? "opacity-0" : "opacity-100"
            )}
            style={{ transform: `translateX(${pill?.x ?? 0}px)`, width: pill?.w ?? 0 }}
          />
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                ref={(el) => {
                  linkRefs.current[link.href] = el;
                }}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("size-3.5 transition-colors", isActive && "text-primary")} strokeWidth={1.75} />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Profile + logout, pinned right */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <QuickLog variant="nav" />
          <button
            onClick={() => setIsEditProfileOpen(true)}
            aria-label="Edit profile"
            title={displayName || "Edit profile"}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3.5 text-sm text-muted-foreground transition-all duration-200 hover:border-white/25 hover:text-foreground cursor-pointer max-w-[11rem]"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-gradient-to-b from-primary/40 to-primary/20 text-xs font-semibold text-foreground">
              {initial}
            </span>
            <span className="truncate">{displayName || "You"}</span>
          </button>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Log out"
              title="Log out"
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <LogOut className="size-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>

        {/* Phones: the pages live in the bottom tab bar, so the top-right button
            is just the account menu (name and log out), shown as the avatar. */}
        <button
          ref={buttonRef}
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="Account menu"
          aria-expanded={isMenuOpen}
          className="md:hidden flex size-10 items-center justify-center rounded-full border border-white/10 bg-gradient-to-b from-primary/40 to-primary/20 text-sm font-semibold transition-transform active:scale-95 cursor-pointer shrink-0"
        >
          {initial}
        </button>
      </div>

      {/* Mobile slide-down menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="md:hidden absolute top-full left-0 right-0 mx-4 mt-2 surface backdrop-blur-xl rounded-2xl p-2 flex flex-col shadow-[0_30px_60px_-20px_oklch(0_0_0/85%)] animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditProfileOpen(true);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-colors hover:bg-white/[0.05] hover:text-foreground cursor-pointer"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/25 text-xs font-semibold text-foreground">{initial}</span>
              {displayName || "Edit profile"}
            </button>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
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
