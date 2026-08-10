"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Moon } from "lucide-react";
import { signup, type AuthState } from "../login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { error: null };

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
          <Moon className="size-8 text-primary" strokeWidth={1.5} />
          <h1 className="text-xl font-logo italic tracking-wide">back of my mind</h1>
        </div>

        {state.message ? (
          <div className="border border-border rounded-lg bg-card p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both">
            <p className="text-sm">{state.message}</p>
            <Link href="/login" className="inline-block mt-4 text-primary hover:underline text-sm">
              Go to login
            </Link>
          </div>
        ) : (
          <form
            action={formAction}
            className="border border-border rounded-lg bg-card p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both"
          >
            <h2 className="text-lg font-serif text-center mb-1">Start your journal</h2>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="displayName">
                Name <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <Input id="displayName" name="displayName" type="text" autoComplete="nickname" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="email">
                Email
              </label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>

            {state.error && <p className="text-destructive text-sm">{state.error}</p>}

            <Button type="submit" disabled={isPending} className="mt-1">
              {isPending ? "Creating account…" : "Sign Up"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
