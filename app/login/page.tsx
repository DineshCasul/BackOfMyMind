"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, Mail, TriangleAlert } from "lucide-react";
import { login, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
import AuthField from "@/components/auth/AuthField";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <AuthShell
      title="Welcome back"
      note="your dreams kept the light on"
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-primary font-medium underline-offset-4 hover:underline">
            Start a journal
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <AuthField label="Email" icon={Mail} name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        <AuthField label="Password" icon={Lock} name="password" type="password" autoComplete="current-password" placeholder="Your password" required />

        {/* Keyed by the message so a second failed attempt replays the shake
            (React sees a new element) instead of sitting there unchanged. */}
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
              <Loader2 className="animate-spin" /> Opening your journal…
            </>
          ) : (
            <>
              Open my journal <ArrowRight />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
