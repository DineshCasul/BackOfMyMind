import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — for client components (auth forms, the
// dream context's CRUD calls). Session lives in cookies, kept fresh by
// middleware.ts.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
