import { forwardRef } from "react";
import { Moon } from "lucide-react";
import type { Dream } from "@/context/DreamContext";
import { MOOD_META } from "@/lib/moods";
import { DREAM_TYPE_META } from "@/lib/dreamTypes";

type Props = {
  dream: Dream;
};

// Dreams are free-text with no length limit, and this card's height is
// otherwise unbounded (see the description below) to fit the whole thing.
// Without some ceiling, an extreme outlier could produce a card tall
// enough that toPng's canvas (already tripled by pixelRatio: 3 in
// DreamCard's handleShare) hits browser canvas size limits and silently
// fails. ~1400 characters is still far more than the old 6-line clamp
// allowed, just not literally unbounded.
const MAX_SHARE_DESCRIPTION = 1400;

function forShareCard(description: string): string {
  if (description.length <= MAX_SHARE_DESCRIPTION) return description;
  return description.slice(0, MAX_SHARE_DESCRIPTION).trimEnd() + "…";
}

// Rendered off-screen (see DreamCard's handleShare) and captured via
// html-to-image, not meant to ever be visible in normal page layout, so
// it deliberately doesn't share styling with the on-page DreamCard beyond
// the same design tokens.
const DreamShareCard = forwardRef<HTMLDivElement, Props>(function DreamShareCard({ dream }, ref) {
  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[dream.mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dream.dreamType];

  return (
    <div
      ref={ref}
      className="w-[420px] min-h-[450px] flex flex-col justify-between p-7 bg-background text-foreground font-sans relative overflow-hidden rounded-[20px]"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 20%, var(--mood-${dream.mood}) 0%, transparent 60%)`,
          opacity: 0.18,
        }}
      />

      <div className="relative flex items-center gap-1.5">
        <Moon className="size-4 text-primary" strokeWidth={1.75} />
        <span className="text-xs font-logo italic tracking-wide text-muted-foreground">
          back of my mind
        </span>
      </div>

      <div className="relative flex-1 flex flex-col justify-center gap-4 py-4">
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
            <MoodIcon className="size-3.5" strokeWidth={2} />
            {moodLabel}
          </span>
          <span className="text-muted-foreground text-xs">&middot;</span>
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <TypeIcon className="size-3.5" strokeWidth={1.75} />
            {typeLabel}
          </span>
        </div>

        <h3 className="text-2xl font-serif leading-tight">{dream.title}</h3>

        {/* No line-clamp: the card's height is auto (min-h only, see the
            root div), so it just grows to fit the whole description
            instead of cutting it off at a fixed number of lines. Still
            capped in length, see forShareCard above. */}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {forShareCard(dream.description)}
        </p>

        {dream.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dream.tags.slice(0, 5).map((tag) => (
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

      <div className="relative text-xs text-muted-foreground">{dream.date}</div>
    </div>
  );
});

export default DreamShareCard;
