"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Moon, LogOut, Menu, X } from "lucide-react";
import { logout } from "@/app/login/actions";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/journal", label: "Journal" },
  { href: "/calendar", label: "Calendar" },
  { href: "/analytics", label: "Analytics" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    <nav className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40 animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center relative">
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 min-w-0 transition-transform duration-200 hover:scale-105"
        >
          <Moon className="size-5 text-primary shrink-0" strokeWidth={1.75} />
          <span className="text-lg sm:text-xl font-logo italic tracking-wide truncate">
            back of my mind
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-5 sm:gap-6 shrink-0">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative inline-block text-sm sm:text-base transition-all duration-200 hover:scale-105",
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
                <span
                  className={cn(
                    "absolute left-0 -bottom-1 h-px bg-primary transition-all duration-300",
                    isActive ? "w-full" : "w-0"
                  )}
                />
              </Link>
            );
          })}
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
          className="sm:hidden absolute top-full left-0 right-0 mx-4 bg-background border border-border rounded-b-lg p-4 flex flex-col gap-4 shadow-lg shadow-black/20 animate-in fade-in slide-in-from-top-2 duration-200"
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
          <div className="border-t border-border pt-4">
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
    </nav>
  );
}
