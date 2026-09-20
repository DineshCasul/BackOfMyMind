import { createClient } from "@/lib/supabase/server";
import { fetchPublicDreamsForDate, fetchFavoritePublicDreamsForMonth, fetchLatestPublicDreams } from "@/lib/publicFeed";
import { toLocalDateString } from "@/lib/utils";
import Greeting from "@/components/Greeting";
import LiveFeed from "@/components/LiveFeed";
import PresenceBadge from "@/components/PresenceBadge";

export default async function WelcomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the (app) layout already redirects unauthenticated visitors

  const today = toLocalDateString(new Date());
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthEnd = toLocalDateString(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0));

  const [{ data: profile }, dreams, favoriteDreams, latest] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    fetchPublicDreamsForDate(supabase, today, user.id),
    fetchFavoritePublicDreamsForMonth(supabase, monthStart, monthEnd, user.id),
    fetchLatestPublicDreams(supabase, user.id),
  ]);

  return (
    <>
      <div className="flex justify-end mb-2 animate-in fade-in duration-500 fill-mode-both">
        <PresenceBadge viewerId={user.id} />
      </div>
      <Greeting name={profile?.display_name} />
      <LiveFeed
        initialDreams={dreams}
        initialFavoriteDreams={favoriteDreams}
        initialLatest={latest}
        initialDate={today}
        viewerId={user.id}
      />
    </>
  );
}
