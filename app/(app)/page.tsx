import { createClient } from "@/lib/supabase/server";
import { fetchPublicDreamsForDate, fetchFavoritePublicDreamsForMonth } from "@/lib/publicFeed";
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

  const [{ data: profile }, dreams, favoriteDreams] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    fetchPublicDreamsForDate(supabase, today, user.id),
    fetchFavoritePublicDreamsForMonth(supabase, monthStart, monthEnd, user.id),
  ]);

  return (
    <>
      <Greeting name={profile?.display_name} extra={<PresenceBadge viewerId={user.id} />} />
      <LiveFeed
        initialDreams={dreams}
        initialFavoriteDreams={favoriteDreams}
        initialDate={today}
        viewerId={user.id}
      />
    </>
  );
}
