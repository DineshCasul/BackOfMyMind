import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fromRow, type DreamRow } from "@/lib/dreams";
import Layout from "@/components/Layout";
import Greeting from "@/components/Greeting";
import PublicDreamCard from "@/components/PublicDreamCard";

export default async function WelcomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the (app) layout already redirects unauthenticated visitors

  const [{ data: profile }, { data: dreamRows }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase
      .from("dreams")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const rows = (dreamRows ?? []) as DreamRow[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const { data: authorRows } = userIds.length
    ? await supabase.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [] as { id: string; display_name: string | null }[] };

  const nameById = new Map((authorRows ?? []).map((p) => [p.id, p.display_name ?? "Someone"]));

  const dreams = rows.map((row) => ({
    ...fromRow(row),
    authorName: nameById.get(row.user_id) ?? "Someone",
  }));

  return (
    <Layout>
      <Greeting name={profile?.display_name} />

      <div className="flex items-center gap-2.5 mt-10 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150 fill-mode-both">
        <Users className="size-6 text-primary" strokeWidth={1.5} />
        <h2 className="text-2xl font-serif">From Everyone</h2>
      </div>

      {dreams.length === 0 ? (
        <p className="text-muted-foreground text-center py-16 animate-in fade-in duration-500">
          No dreams shared yet — be the first from your journal.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dreams.map((dream, i) => (
            <div
              key={dream.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
              style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
            >
              <PublicDreamCard {...dream} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
