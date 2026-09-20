"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import { format } from "date-fns";
import { Trash2, Share2, Star, Globe, Lock, Flame, Check } from "lucide-react";
import { toPng } from "html-to-image";
import FormModal from "./FormModal";
import DreamShareCard from "./DreamShareCard";
import { useToast } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Dream, DreamInput } from "@/context/DreamContext";
import { MOOD_META } from "@/lib/moods";
import { DREAM_TYPE_META } from "@/lib/dreamTypes";
import { computeStreaks } from "@/lib/streaks";
import { cn, parseLocalDateString } from "@/lib/utils";

interface DreamCardProps extends Dream {
  onEdit: (id: string, values: Omit<DreamInput, "date">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePublic: (id: string, isPublic: boolean) => Promise<void>;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void>;
  // Every one of the user's dreams, not just this day's, so the delete
  // confirmation can simulate "what would the streak be without this
  // dream" rather than only knowing about the day it's on.
  allDreams: Dream[];
  className?: string;
}

export default function DreamCard({
  id,
  title,
  description,
  mood,
  date,
  tags,
  dreamType,
  people,
  setting,
  vividness,
  isPublic,
  isFavorite,
  onEdit,
  onDelete,
  onTogglePublic,
  onToggleFavorite,
  allDreams,
  className,
}: DreamCardProps) {
  const toast = useToast();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [justCopiedLink, setJustCopiedLink] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dreamType];
  // Short form on the card, the long form as the edit form's page heading.
  const dateStamp = format(parseLocalDateString(date), "EEE d MMM");
  const dateLabel = format(parseLocalDateString(date), "EEEE, d MMMM");

  // Only worth computing while the dialog asking about it is actually
  // open. Naturally comes out "no impact" unless this is the only dream
  // logged on `date`, removing it is what drops that date out of the
  // streak's set of unique days, no separate "last dream of the day"
  // check needed, this simulation already implies it.
  const streakImpact = useMemo(() => {
    if (!isConfirmingDelete) return null;
    const before = computeStreaks(allDreams.map((d) => d.date));
    const after = computeStreaks(allDreams.filter((d) => d.id !== id).map((d) => d.date));
    if (after.current >= before.current && after.longest >= before.longest) return null;
    return { before, after };
  }, [isConfirmingDelete, allDreams, id]);

  const dream: Dream = {
    id,
    title,
    description,
    mood,
    date,
    tags,
    dreamType,
    people,
    setting,
    vividness,
    isPublic,
    isFavorite,
  };

  async function handleTogglePublic(e: React.MouseEvent) {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onTogglePublic(id, !isPublic);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update that dream.", "error");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation();
    if (isFavoriting) return;
    setIsFavoriting(true);
    try {
      await onToggleFavorite(id, !isFavorite);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update that dream.", "error");
    } finally {
      setIsFavoriting(false);
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await onDelete(id);
      setIsConfirmingDelete(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't delete that dream.", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (!shareCardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      // html-to-image's canvas defaults to a plain white fill wherever the
      // node itself doesn't paint anything, the rounded corners clipped by
      // the card's own border-radius included, so without an explicit
      // backgroundColor those corners come out white instead of matching
      // the card. Reading it off the actual node keeps this correct
      // automatically if the theme ever changes.
      const backgroundColor = getComputedStyle(shareCardRef.current).backgroundColor;
      const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 3, backgroundColor });
      const filename = `${title || "dream"}.png`;
      // Only worth sharing a link for dreams anyone else could actually
      // open, RLS blocks non-owners from a private dream's page.
      const dreamUrl = isPublic ? `${window.location.origin}/dream/${id}` : null;

      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title,
              ...(dreamUrl ? { url: dreamUrl, text: `"${title}" — read the full dream` } : {}),
            });
            return;
          } catch (shareErr) {
            // The user cancelling the OS share sheet also throws (AbortError),
            // that's a deliberate "never mind", not a failure to fall back
            // from, forcing a download + clipboard copy right after would
            // silently do the exact thing they just declined.
            if (shareErr instanceof Error && shareErr.name === "AbortError") return;
          }
        }
      } catch {
        // Building the file to share failed, fall through to a direct download.
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();

      if (dreamUrl) {
        try {
          await navigator.clipboard.writeText(dreamUrl);
          setJustCopiedLink(true);
          setTimeout(() => setJustCopiedLink(false), 1800);
        } catch {
          // Clipboard access can be blocked (permissions, insecure context),
          // the image download above already happened either way.
        }
      }
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <>
      {/* A page from the journal. The mood colour appears three quiet ways
          instead of one loud border: an aura in the top-left corner, the
          bookmark ribbon (gold once it's a favourite), and the glow it casts
          on hover. */}
      <div
        onClick={() => setIsEditModalOpen(true)}
        style={{ "--m": `var(--mood-${mood})`, "--ribbon": isFavorite ? "var(--gold)" : `var(--mood-${mood})` } as CSSProperties}
        className={cn(
          "group surface relative cursor-pointer flex flex-col justify-between gap-4 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-22px_var(--m)] hover:border-[color-mix(in_oklch,var(--m)_40%,transparent)]",
          className
        )}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-70 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(120% 90% at 0% 0%, color-mix(in oklch, var(--m) 16%, transparent), transparent 55%)" }}
        />
        <span className="ribbon" aria-hidden="true" />

        <div className="relative">
          <div className="flex items-center justify-between gap-2 pr-8">
            <span className="font-hand text-lg leading-none text-muted-foreground">{dateStamp}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <TypeIcon className="size-3" strokeWidth={1.75} />
              {typeLabel}
            </span>
          </div>

          <div className={cn("mt-2.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider", colorClass)}>
            <MoodIcon className="size-3.5" strokeWidth={2} />
            {moodLabel}
          </div>

          <h4 className="font-serif text-xl leading-snug mt-1 mb-2.5 text-card-foreground">{title}</h4>

          {/* Ruled like the page it's written on: the 26px rule spacing is
              also the line height, so text sits between the lines. */}
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
          {/* Slightly dimmed until the card is hovered or focused, so the
              resting list reads as pages, not a wall of toolbars. Still fully
              reachable by keyboard (focus-within), and never hidden, so touch
              screens (no hover) keep working. */}
          <div className="flex items-center gap-1 opacity-70 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoriting}
              aria-label={isFavorite ? `Remove "${title}" from favorites` : `Mark "${title}" as a favorite`}
              aria-pressed={isFavorite}
              title={isFavorite ? "Favorite" : "Mark as favorite"}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-50",
                isFavorite ? "text-gold hover:bg-gold/10" : "text-muted-foreground hover:text-gold hover:bg-white/[0.07]"
              )}
            >
              <Star className="size-4" fill={isFavorite ? "currentColor" : "none"} strokeWidth={1.75} />
            </button>
            <button
              onClick={handleTogglePublic}
              disabled={isToggling}
              aria-label={isPublic ? `Make "${title}" private` : `Share "${title}" to the public feed`}
              aria-pressed={isPublic}
              title={isPublic ? "On the public feed" : "Private, share to feed"}
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors cursor-pointer disabled:opacity-50",
                isPublic ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-white/[0.07]"
              )}
            >
              {isPublic ? <Globe className="size-4" strokeWidth={1.75} /> : <Lock className="size-4" strokeWidth={1.75} />}
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              aria-label={`Share "${title}"`}
              title={justCopiedLink ? "Link copied!" : undefined}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary hover:bg-white/[0.07] cursor-pointer disabled:opacity-50"
            >
              {justCopiedLink ? <Check className="size-4 text-primary" strokeWidth={1.75} /> : <Share2 className="size-4" strokeWidth={1.75} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent opening edit modal
                setIsConfirmingDelete(true);
              }}
              aria-label={`Delete "${title}"`}
              className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen, captured as an image by handleShare, never visible in normal layout. */}
      <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }} aria-hidden="true">
        <DreamShareCard ref={shareCardRef} dream={dream} />
      </div>

      {/* Edit Modal */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        dateLabel={dateLabel}
        initialTitle={title}
        initialDescription={description}
        initialMood={mood}
        initialTags={tags}
        initialDreamType={dreamType}
        initialPeople={people}
        initialSetting={setting}
        initialVividness={vividness}
        onAddDream={(values) => onEdit(id, values)}
      />

      {/* Delete confirmation */}
      <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete this dream?</DialogTitle>
            <DialogDescription>
              &ldquo;{title}&rdquo; will be permanently deleted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>

          {streakImpact && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <Flame className="size-4 shrink-0 mt-0.5" strokeWidth={1.75} />
              <span>
                This is your only dream logged on {date}.{" "}
                {[
                  streakImpact.after.current < streakImpact.before.current &&
                    `Your current streak will drop from ${streakImpact.before.current} to ${streakImpact.after.current} day${streakImpact.after.current === 1 ? "" : "s"}.`,
                  streakImpact.after.longest < streakImpact.before.longest &&
                    `Your longest streak will drop from ${streakImpact.before.longest} to ${streakImpact.after.longest} day${streakImpact.after.longest === 1 ? "" : "s"}.`,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
