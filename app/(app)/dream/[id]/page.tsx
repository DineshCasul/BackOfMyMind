import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Users, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fromRow, type DreamRow } from "@/lib/dreams";
import { getLikeInfo } from "@/lib/likes";
import { MOOD_META } from "@/lib/moods";
import { DREAM_TYPE_META } from "@/lib/dreamTypes";
import LikeButton from "@/components/LikeButton";
import ScrollToTop from "@/components/ScrollToTop";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export default async function DreamPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the (app) layout already redirects unauthenticated visitors

  // RLS already limits this to dreams that are either public or the
  // viewer's own, a private dream owned by someone else simply won't come
  // back as a row here, which is exactly the "not found" case below wants.
  const { data: row } = await supabase.from("dreams").select("*").eq("id", id).single();
  if (!row) notFound();

  const dream = fromRow(row as DreamRow);

  const [{ data: authorRow }, likeInfoByDream] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", row.user_id).single(),
    getLikeInfo(supabase, [id], user.id),
  ]);

  const authorName = authorRow?.display_name ?? "Someone";
  const { count: likeCount = 0, likedByMe = false } = likeInfoByDream.get(id) ?? {};

  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[dream.mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dream.dreamType];

  return (
    <>
      <ScrollToTop />
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back
        </Link>

        <div
          style={{ borderLeftColor: `var(--mood-${dream.mood})`, borderLeftWidth: 3 }}
          className="rounded-lg border border-border bg-card p-6 sm:p-8"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className={cn("flex items-center gap-1.5 text-sm font-medium", colorClass)}>
              <MoodIcon className="size-4" strokeWidth={2} />
              <span className="uppercase tracking-wide">{moodLabel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TypeIcon className="size-3.5" strokeWidth={1.75} />
              {typeLabel}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif mb-2">{dream.title}</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {authorName} &middot; {dream.date}
          </p>

          <p className="leading-relaxed mb-6 whitespace-pre-line">{dream.description}</p>

          {(dream.people.length > 0 || dream.setting) && (
            <div className="flex flex-col gap-2 mb-6 text-sm text-muted-foreground">
              {dream.setting && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} />
                  {dream.setting}
                </div>
              )}
              {dream.people.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="size-3.5 shrink-0" strokeWidth={1.75} />
                  {dream.people.join(", ")}
                </div>
              )}
            </div>
          )}

          {dream.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-6">
              {dream.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-0.5" aria-label={`Vividness ${dream.vividness} out of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  className={cn("size-4", n <= dream.vividness ? "text-primary" : "text-muted-foreground/40")}
                  fill={n <= dream.vividness ? "currentColor" : "none"}
                  strokeWidth={1.5}
                />
              ))}
            </div>
            {dream.isPublic ? (
              <LikeButton
                dreamId={dream.id}
                userId={user.id}
                ownerId={row.user_id}
                initialCount={likeCount}
                initialLiked={likedByMe}
                size="md"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Private, not shared to the feed</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
