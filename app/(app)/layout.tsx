import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DreamProvider } from "@/context/DreamContext";

// DreamProvider needs a real logged-in user (dreams are fetched scoped to
// them), which /login and /signup don't have — so this route group, not
// the root layout, is where it lives. Middleware already redirects
// unauthenticated requests before they get here; this check is just
// belt-and-suspenders against ever rendering DreamProvider with no user.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <DreamProvider userId={user.id}>{children}</DreamProvider>;
}
