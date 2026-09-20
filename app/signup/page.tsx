"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Loader2, Lock, Mail, MailCheck, TriangleAlert, User } from "lucide-react";
import { signup, type AuthState } from "../login/actions";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";
import { cn } from "@/lib/utils";

const initialState: AuthState = { error: null };
const MIN_LENGTH = 6; // matches the input's minLength below and Supabase's minimum

// Three bars, not a score: 6+ characters is required, 10+ is better, and
// mixing letters with numbers or symbols is best. Only the first one is
// enforced; the rest is encouragement, so it never blocks a valid password.
function strength(pw: string): number {
  if (pw.length < MIN_LENGTH) return 0;
  let s = 1;
  if (pw.length >= 10) s++;
  if (/[a-z]/i.test(pw) && /[\d\W_]/.test(pw)) s++;
  return s;
}

const STRENGTH_LABEL = ["", "Good enough to start", "Solid", "Strong"];

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);
  const [password, setPassword] = useState("");
  const level = strength(password);

  return (
    <AuthShell
      title={state.message ? "Check your inbox" : "Start your journal"}
      note={state.message ? "one small step left" : "every dream starts as a blank page"}
      footer={
        <>
          Already keeping one?{" "}
          <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      {state.message ? (
        <div className="text-center animate-in fade-in duration-500">
          <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MailCheck className="size-7" strokeWidth={1.5} />
          </span>
          <p className="text-sm text-muted-foreground leading-relaxed">{state.message}</p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/login">
              Go to login <ArrowRight />
            </Link>
          </Button>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <AuthField label="Name" icon={User} name="displayName" type="text" autoComplete="nickname" placeholder="What should we call you?" optional />
          <AuthField label="Email" icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          <AuthField
            label="Password"
            icon={Lock}
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={`At least ${MIN_LENGTH} characters`}
            minLength={MIN_LENGTH}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            hint={
              <div className="flex items-center gap-2" aria-live="polite">
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {[1, 2, 3].map((n) => (
                    <span
                      key={n}
                      className={cn("h-1 flex-1 rounded-full transition-colors duration-300", n <= level ? "bg-primary" : "bg-white/10")}
                    />
                  ))}
                </div>
                <span className="flex items-center gap-1 shrink-0">
                  {level > 0 && <Check className="size-3 text-primary" strokeWidth={2.5} />}
                  {level > 0 ? STRENGTH_LABEL[level] : `${MIN_LENGTH}+ characters`}
                </span>
              </div>
            }
          />

          {state.error && (
            <div
              key={state.error}
              role="alert"
              className="animate-shake flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              <TriangleAlert className="size-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>{state.error}</span>
            </div>
          )}

          <Button type="submit" size="lg" disabled={isPending} className="mt-1 w-full">
            {isPending ? (
              <>
                <Loader2 className="animate-spin" /> Creating your journal…
              </>
            ) : (
              <>
                Begin <ArrowRight />
              </>
            )}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
