import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DreamProvider } from "@/context/DreamContext";
import { AchievementProvider } from "@/context/AchievementContext";
import Navbar from "@/components/Navbar";
import AchievementCelebration from "@/components/AchievementCelebration";

// DreamProvider needs a real logged-in user (dreams are fetched scoped to
// them), which /login and /signup don't have, so this route group, not
// the root layout, is where it lives. Middleware already redirects
// unauthenticated requests before they get here; this check is just
// belt-and-suspenders against ever rendering DreamProvider with no user.
//
// Navbar lives here rather than in a per-page wrapper (the old
// components/Layout.tsx) so it mounts exactly once per session instead of
// remounting, and replaying its slide-in entrance animation, every time
// loading.tsx's Suspense fallback swaps out for the real page.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <DreamProvider userId={user.id} userEmail={user.email ?? ""}>
      <AchievementProvider userId={user.id}>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
        <AchievementCelebration />
      </AchievementProvider>
    </DreamProvider>
  );
}
