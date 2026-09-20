import BackLink from "@/components/BackLink";
import type { CSSProperties } from "react";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, Users, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { fromRow, type DreamRow } from "@/lib/dreams";
import { getLikeInfo } from "@/lib/likes";
import { MOOD_META } from "@/lib/moods";
import { DREAM_TYPE_META } from "@/lib/dreamTypes";
import LikeButton from "@/components/LikeButton";
import ScrollToTop from "@/components/ScrollToTop";
import { cn, parseLocalDateString } from "@/lib/utils";

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
    supabase.from("profiles").select("display_name").eq("id", row.user_id).maybeSingle(),
    getLikeInfo(supabase, [id], user.id),
  ]);

  const authorName = authorRow?.display_name ?? "Someone";
  const { count: likeCount = 0, likedByMe = false } = likeInfoByDream.get(id) ?? {};

  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[dream.mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dream.dreamType];
  const longDate = format(parseLocalDateString(dream.date), "EEEE, d MMMM yyyy");

  return (
    <>
      <ScrollToTop />
      <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        <BackLink
          fallback="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" strokeWidth={1.75} />
          Back
        </BackLink>

        {/* An open page of the journal: the mood shows as an aura, a bookmark
            ribbon and the colour of the title's glow, and the dream itself is
            written on ruled paper with a margin line, like the entry it is. */}
        <article
          style={{ "--m": `var(--mood-${dream.mood})`, "--ribbon": `var(--mood-${dream.mood})` } as CSSProperties}
          className="surface relative overflow-hidden rounded-2xl p-6 sm:p-10"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(90% 60% at 0% 0%, color-mix(in oklch, var(--m) 16%, transparent), transparent 60%)" }}
          />
          <span className="ribbon !right-8" aria-hidden="true" />

          <div className="relative">
            <p className="font-hand text-2xl text-primary/90">{longDate}</p>

            <div className="flex items-center gap-3 mt-3 mb-1 text-sm">
              <span className={cn("flex items-center gap-1.5 font-medium uppercase tracking-wider", colorClass)}>
                <MoodIcon className="size-4" strokeWidth={2} />
                {moodLabel}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <TypeIcon className="size-3.5" strokeWidth={1.75} />
                {typeLabel}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-serif leading-tight text-moonglow">{dream.title}</h1>
            <p className="font-hand text-xl text-muted-foreground mt-1 mb-7">written by {authorName}</p>

            <p className="ruled pl-14 pr-1 font-serif text-[17px] whitespace-pre-line text-foreground/90 mb-8">{dream.description}</p>

            {(dream.people.length > 0 || dream.setting) && (
              <div className="flex flex-wrap gap-2 mb-6 text-sm">
                {dream.setting && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {dream.setting}
                  </span>
                )}
                {dream.people.length > 0 && (
                  <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-muted-foreground">
                    <Users className="size-3.5 shrink-0" strokeWidth={1.75} />
                    {dream.people.join(", ")}
                  </span>
                )}
              </div>
            )}

            {dream.tags.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-6">
                {dream.tags.map((tag) => (
                  <span key={tag} className="font-hand text-xl text-primary/80">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-5 border-t border-dashed border-white/10">
              <div className="flex items-center gap-0.5" aria-label={`Vividness ${dream.vividness} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn("size-4.5", n <= dream.vividness ? "text-gold" : "text-muted-foreground/30")}
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
                <span className="font-hand text-lg text-muted-foreground">Private, not shared to the feed</span>
              )}
            </div>
          </div>
        </article>
      </div>
    </>
  );
}
