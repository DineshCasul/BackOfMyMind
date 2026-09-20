import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DreamProvider, type ProfileState } from "@/context/DreamContext";
import { AchievementProvider } from "@/context/AchievementContext";
import Navbar from "@/components/Navbar";
import AchievementCelebration from "@/components/AchievementCelebration";
import { ToastProvider } from "@/components/Toast";
import { toLocalDateString } from "@/lib/utils";
import MobileTabBar from "@/components/MobileTabBar";
import NavProgress from "@/components/NavProgress";

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

  // The one place the profile is looked up for the shell of the app. The
  // outcome is passed down as facts (a name and what we found), so the client
  // never has to guess from an empty result whether "no name" means "no name
  // yet" or "the request failed".
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const profileName = profile?.display_name?.trim() ?? "";
  const profileState: ProfileState = profileError ? "error" : !profile ? "missing" : !profileName ? "unnamed" : "ok";

  return (
    <ToastProvider>
      <DreamProvider userId={user.id} userEmail={user.email ?? ""} serverToday={toLocalDateString(new Date())} initialProfile={{ name: profileName, state: profileState }}>
        <AchievementProvider userId={user.id}>
          <NavProgress />
          <Navbar />
          {/* pb-28 on phones leaves room for the fixed tab bar under the content. */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 md:pb-8">{children}</main>
          <MobileTabBar />
          <AchievementCelebration />
        </AchievementProvider>
      </DreamProvider>
    </ToastProvider>
  );
}
