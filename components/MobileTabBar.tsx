"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, BookOpen, BarChart3, Award, type LucideIcon } from "lucide-react";
import QuickLog from "@/components/QuickLog";
import { cn } from "@/lib/utils";

const LEFT: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Home", icon: Sparkles },
  { href: "/journal", label: "Dreambook", icon: BookOpen },
];
const RIGHT: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/analytics", label: "Patterns", icon: BarChart3 },
  { href: "/profile", label: "Badges", icon: Award },
];

function Tab({ href, label, icon: Icon, active }: { href: string; label: string; icon: LucideIcon; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[10px] font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground active:text-foreground"
      )}
    >
      {/* A small glow above the active tab, in place of a filled box. */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-0 h-0.5 w-8 rounded-full bg-primary shadow-[0_0_12px_2px_var(--color-primary)] transition-all duration-300",
          active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
        )}
      />
      <Icon className={cn("size-5 transition-transform duration-300", active && "text-primary -translate-y-0.5")} strokeWidth={1.75} />
      {label}
    </Link>
  );
}

// Phones get the navigation at the bottom, where a thumb is, instead of
// behind a hamburger at the top: every page is one tap away and the current
// one is always visible. The centre button is the journal's main action.
// `env(safe-area-inset-bottom)` keeps it clear of the home indicator on
// phones that have one.
export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-background/70 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-md items-end px-2">
        {LEFT.map((t) => (
          <Tab key={t.href} {...t} active={pathname === t.href} />
        ))}
        <div className="flex flex-1 justify-center">
          <div className="-mt-6">
            <QuickLog variant="fab" />
          </div>
        </div>
        {RIGHT.map((t) => (
          <Tab key={t.href} {...t} active={pathname === t.href} />
        ))}
      </div>
    </nav>
  );
}
