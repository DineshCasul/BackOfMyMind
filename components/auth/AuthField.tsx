"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends Omit<ComponentProps<"input">, "id"> {
  label: string;
  icon: LucideIcon;
  /** Small text under the field (a hint, or a live strength note). */
  hint?: ReactNode;
  optional?: boolean;
}

// An input with a leading icon and a label above it. Password fields get a
// show/hide toggle: on a phone, typing a password blind is the top reason for
// a failed login, and the toggle is a real <button> so it works with keyboard
// and screen readers ("aria-pressed" says whether it is showing).
export default function AuthField({ label, icon: Icon, hint, optional, type = "text", className, ...props }: AuthFieldProps) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-medium mb-1.5">
        <span>{label}</span>
        {optional && <span className="font-hand text-base text-muted-foreground font-normal">optional</span>}
      </label>
      <div className="relative group">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary"
          strokeWidth={1.75}
        />
        <Input
          id={id}
          type={isPassword && reveal ? "text" : type}
          className={cn("pl-10", isPassword && "pr-11", className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            aria-pressed={reveal}
            aria-label={reveal ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground cursor-pointer"
          >
            {reveal ? <EyeOff className="size-4" strokeWidth={1.75} /> : <Eye className="size-4" strokeWidth={1.75} />}
          </button>
        )}
      </div>
      {hint && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
