import { Star } from "lucide-react";
import type { Dream } from "@/context/DreamContext";
import { MOOD_META } from "@/lib/moods";
import { DREAM_TYPE_META } from "@/lib/dreamTypes";
import { cn } from "@/lib/utils";

type Props = Dream & {
  authorName: string;
};

// Read-only — no click-to-edit, no delete, no share-to-feed toggle, since
// these belong to someone else. Visually related to DreamCard (same mood
// spine + icon language) but deliberately not interactive the same way.
export default function PublicDreamCard({
  title,
  description,
  mood,
  date,
  tags,
  dreamType,
  vividness,
  authorName,
}: Props) {
  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dreamType];

  return (
    <div
      style={{ borderLeftColor: `var(--mood-${mood})`, borderLeftWidth: 3 }}
      className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className={cn("flex items-center gap-1.5 text-xs font-medium", colorClass)}>
            <MoodIcon className="size-3.5" strokeWidth={2} />
            <span className="uppercase tracking-wide">{moodLabel}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <TypeIcon className="size-3" strokeWidth={1.75} />
            {typeLabel}
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
        <span className="text-xs text-muted-foreground">
          {authorName} &middot; {date}
        </span>
      </div>
    </div>
  );
}
