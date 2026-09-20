import Link from "next/link";
import type { CSSProperties } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Star, ArrowUpRight } from "lucide-react";
import type { Dream } from "@/context/DreamContext";
import { MOOD_META } from "@/lib/moods";
import { DREAM_TYPE_META } from "@/lib/dreamTypes";
import { cn, parseLocalDateString } from "@/lib/utils";
import LikeButton from "./LikeButton";

type Props = Dream & {
  authorName: string;
  authorId: string;
  viewerId: string;
  likeCount: number;
  likedByMe: boolean;
  /** Show "3 minutes ago" instead of the calendar date (used by the Latest list). */
  showRelativeTime?: boolean;
};

// Read-only, no click-to-edit, no delete, no share-to-feed toggle, since
// these belong to someone else. Same journal-page language as DreamCard (mood
// aura, ribbon, ruled text, handwritten details) but deliberately not
// interactive the same way. Clicking through to /dream/[id] is the one
// interaction, plus liking. It reads as a page someone shared with you:
// signed at the bottom in their name, with a little initial for a face.
export default function PublicDreamCard({
  id,
  title,
  description,
  mood,
  date,
  tags,
  dreamType,
  vividness,
  authorName,
  authorId,
  viewerId,
  likeCount,
  likedByMe,
  createdAt,
  showRelativeTime = false,
}: Props) {
  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dreamType];
  const dateStamp = format(parseLocalDateString(date), "EEE d MMM");
  // In "Latest", how long ago it was shared matters more than which night it
  // was dreamt. Within the hour it also gets a NEW pill.
  const created = createdAt ? new Date(createdAt) : null;
  const ageMs = created ? Date.now() - created.getTime() : null;
  const relative = showRelativeTime && created ? formatDistanceToNowStrict(created, { addSuffix: true }) : null;
  const isNew = ageMs !== null && ageMs >= 0 && ageMs < 60 * 60 * 1000;

  return (
    <Link
      href={`/dream/${id}`}
      style={{ "--m": `var(--mood-${mood})`, "--ribbon": `var(--mood-${mood})` } as CSSProperties}
      className="group surface relative flex flex-col gap-4 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-22px_var(--m)] hover:border-[color-mix(in_oklch,var(--m)_40%,transparent)]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(120% 90% at 0% 0%, color-mix(in oklch, var(--m) 16%, transparent), transparent 55%)" }}
      />
      <span className="ribbon" aria-hidden="true" />

      {/* Nested overflow-hidden wrapper rather than putting it on the root:
          the root also carries the hover box-shadow above, and clipping
          overflow on the same element that paints a shadow risks clipping
          the shadow too in some browsers. */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -skew-x-12 transition-transform duration-700 ease-out group-hover:translate-x-[400%]" />
      </div>

      <div className="relative">
        <div className="flex items-center justify-between gap-2 pr-8">
          <span className="flex items-center gap-2 font-hand text-lg leading-none text-muted-foreground">
            {/* The clock differs by a moment between the server render and
                the browser, so this text is allowed to differ on hydration. */}
            <span suppressHydrationWarning>{relative ?? dateStamp}</span>
            {showRelativeTime && isNew && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 font-sans text-[9px] font-semibold uppercase tracking-wider text-primary">New</span>
            )}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TypeIcon className="size-3" strokeWidth={1.75} />
              {typeLabel}
            </span>
            <ArrowUpRight
              className="size-3.5 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
              strokeWidth={2}
            />
          </div>
        </div>

        <div className={cn("mt-2.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider", colorClass)}>
          <MoodIcon className="size-3.5" strokeWidth={2} />
          {moodLabel}
        </div>

        <h4 className="font-serif text-xl leading-snug mt-1 mb-2.5 text-card-foreground">{title}</h4>
        <p className="ruled-lines line-clamp-3 text-sm text-muted-foreground [--line:26px]">{description}</p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-3">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="font-hand text-lg leading-6 text-primary/80">
                #{tag}
              </span>
            ))}
            {tags.length > 3 && <span className="font-hand text-lg leading-6 text-muted-foreground">+{tags.length - 3}</span>}
          </div>
        )}
      </div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-0.5" aria-label={`Vividness ${vividness} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn("size-3.5", n <= vividness ? "text-gold" : "text-muted-foreground/30")}
              fill={n <= vividness ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <LikeButton
          dreamId={id}
          userId={viewerId}
          ownerId={authorId}
          initialCount={likeCount}
          initialLiked={likedByMe}
        />
      </div>

      <div className="relative flex items-center gap-2 border-t border-dashed border-white/10 pt-3 -mb-1">
        <span
          aria-hidden="true"
          className="flex size-6 items-center justify-center rounded-full bg-primary/20 text-[11px] font-semibold uppercase text-primary"
        >
          {authorName.trim().charAt(0) || "?"}
        </span>
        <span className="font-hand text-lg leading-none text-muted-foreground">{authorName}</span>
      </div>
    </Link>
  );
}
