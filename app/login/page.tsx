"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Moon } from "lucide-react";
import { login, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-2 duration-500 fill-mode-both">
          <Moon className="size-8 text-primary" strokeWidth={1.5} />
          <h1 className="text-xl font-logo italic tracking-wide">back of my mind</h1>
        </div>

        <form
          action={formAction}
          className="border border-border rounded-lg bg-card p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75 fill-mode-both"
        >
          <h2 className="text-lg font-serif text-center mb-1">Welcome back</h2>

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
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>

          {state.error && <p className="text-destructive text-sm">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="mt-1">
            {isPending ? "Signing in…" : "Log In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
