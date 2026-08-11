import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import type { Dream } from "@/context/DreamContext";
import { MOOD_META } from "@/lib/moods";
import { DREAM_TYPE_META } from "@/lib/dreamTypes";
import { cn } from "@/lib/utils";
import LikeButton from "./LikeButton";

type Props = Dream & {
  authorName: string;
  viewerId: string;
  likeCount: number;
  likedByMe: boolean;
};

// Read-only, no click-to-edit, no delete, no share-to-feed toggle, since
// these belong to someone else. Visually related to DreamCard (same mood
// spine + icon language) but deliberately not interactive the same way.
// Clicking through to /dream/[id] is the one interaction, plus liking.
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
  viewerId,
  likeCount,
  likedByMe,
}: Props) {
  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dreamType];

  return (
    <Link
      href={`/dream/${id}`}
      style={
        {
          borderLeftColor: `var(--mood-${mood})`,
          borderLeftWidth: 3,
          "--card-glow": `var(--mood-${mood})`,
        } as React.CSSProperties & Record<string, string | number>
      }
      className="group flex flex-col gap-3 p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_-16px_var(--card-glow)]"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", colorClass)}>
            <MoodIcon className="size-3.5" strokeWidth={2} />
            <span className="uppercase tracking-wide">{moodLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <TypeIcon className="size-3" strokeWidth={1.75} />
              {typeLabel}
            </div>
            <ArrowUpRight
              className="size-3.5 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
              strokeWidth={2}
            />
          </div>
        </div>
        <h4 className="font-semibold text-lg mb-1 text-card-foreground">{title}</h4>
        <p className="text-muted-foreground text-sm line-clamp-3">{description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5" aria-label={`Vividness ${vividness} out of 5`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn("size-3", n <= vividness ? "text-primary" : "text-muted-foreground/40")}
              fill={n <= vividness ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          ))}
        </div>
        <LikeButton dreamId={id} userId={viewerId} initialCount={likeCount} initialLiked={likedByMe} />
      </div>

      <div className="text-[11px] text-muted-foreground -mt-1">
        {authorName} &middot; {date}
      </div>
    </Link>
  );
}
