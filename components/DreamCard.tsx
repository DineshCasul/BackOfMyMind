"use client";

import { useRef, useState } from "react";
import { Trash2, Share2, Star, Globe, Lock } from "lucide-react";
import { toPng } from "html-to-image";
import FormModal from "./FormModal";
import DreamShareCard from "./DreamShareCard";
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
import { cn } from "@/lib/utils";

interface DreamCardProps extends Dream {
  onEdit: (id: string, values: Omit<DreamInput, "date">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onTogglePublic: (id: string, isPublic: boolean) => Promise<void>;
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
  onEdit,
  onDelete,
  onTogglePublic,
  className,
}: DreamCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const { icon: MoodIcon, label: moodLabel, colorClass } = MOOD_META[mood];
  const { icon: TypeIcon, label: typeLabel } = DREAM_TYPE_META[dreamType];

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
  };

  async function handleTogglePublic(e: React.MouseEvent) {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    try {
      await onTogglePublic(id, !isPublic);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setIsToggling(false);
    }
  }

  async function handleConfirmDelete() {
    setIsDeleting(true);
    try {
      await onDelete(id);
      setIsConfirmingDelete(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    if (!shareCardRef.current || isSharing) return;
    setIsSharing(true);
    try {
      const dataUrl = await toPng(shareCardRef.current, { pixelRatio: 3 });
      const filename = `${title || "dream"}.png`;

      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title });
          return;
        }
      } catch {
        // Share cancelled or unsupported — fall through to a direct download.
      }

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <>
      <div
        onClick={() => setIsEditModalOpen(true)}
        style={{ borderLeftColor: `var(--mood-${mood})`, borderLeftWidth: 3 }}
        className={cn(
          "cursor-pointer flex flex-col justify-between gap-3 p-4 rounded-lg border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
          className
        )}
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleTogglePublic}
              disabled={isToggling}
              aria-label={isPublic ? `Make "${title}" private` : `Share "${title}" to the public feed`}
              aria-pressed={isPublic}
              title={isPublic ? "On the public feed" : "Private — share to feed"}
              className={cn(
                "transition-colors p-1 -m-1 rounded cursor-pointer disabled:opacity-50",
                isPublic ? "text-primary hover:text-muted-foreground" : "text-muted-foreground hover:text-primary"
              )}
            >
              {isPublic ? (
                <Globe className="size-4" strokeWidth={1.75} />
              ) : (
                <Lock className="size-4" strokeWidth={1.75} />
              )}
            </button>
            <button
              onClick={handleShare}
              disabled={isSharing}
              aria-label={`Share "${title}"`}
              className="text-muted-foreground hover:text-primary transition-colors p-1 -m-1 rounded cursor-pointer disabled:opacity-50"
            >
              <Share2 className="size-4" strokeWidth={1.75} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // prevent opening edit modal
                setIsConfirmingDelete(true);
              }}
              aria-label={`Delete "${title}"`}
              className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1 rounded cursor-pointer"
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Off-screen, captured as an image by handleShare — never visible in normal layout. */}
      <div style={{ position: "fixed", top: -9999, left: -9999, pointerEvents: "none" }} aria-hidden="true">
        <DreamShareCard ref={shareCardRef} dream={dream} />
      </div>

      {/* Edit Modal */}
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
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
