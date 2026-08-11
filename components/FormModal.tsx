"use client";

import { useState, useEffect, useMemo } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import TagInput from "@/components/TagInput";
import { useDreams, type MoodType, type DreamType, type DreamInput } from "@/context/DreamContext";
import { MOOD_META, MOOD_ORDER } from "@/lib/moods";
import { DREAM_TYPE_META, DREAM_TYPE_ORDER } from "@/lib/dreamTypes";
import { cn } from "@/lib/utils";

type FormValues = Omit<DreamInput, "date">;

interface FormModalProps {
  onAddDream: (values: FormValues) => void | Promise<void>;
  children?: React.ReactNode; // for add button
  open?: boolean; // controlled open
  onOpenChange?: (open: boolean) => void; // controlled handler
  initialTitle?: string;
  initialDescription?: string;
  initialMood?: MoodType;
  initialTags?: string[];
  initialDreamType?: DreamType;
  initialPeople?: string[];
  initialSetting?: string;
  initialVividness?: number;
}

export default function FormModal({
  onAddDream,
  children,
  open,
  onOpenChange,
  initialTitle = "",
  initialDescription = "",
  initialMood = "neutral",
  initialTags = [],
  initialDreamType = "normal",
  initialPeople = [],
  initialSetting = "",
  initialVividness = 3,
}: FormModalProps) {
  const { dreams } = useDreams();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [mood, setMood] = useState<MoodType>(initialMood);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [dreamType, setDreamType] = useState<DreamType>(initialDreamType);
  const [people, setPeople] = useState<string[]>(initialPeople);
  const [setting, setSetting] = useState(initialSetting);
  const [vividness, setVividness] = useState(initialVividness);
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  const knownTags = useMemo(() => Array.from(new Set(dreams.flatMap((d) => d.tags ?? []))), [dreams]);
  const knownPeople = useMemo(() => Array.from(new Set(dreams.flatMap((d) => d.people ?? []))), [dreams]);

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setMood(initialMood);
      setTags(initialTags);
      setDreamType(initialDreamType);
      setPeople(initialPeople);
      setSetting(initialSetting);
      setVividness(initialVividness);
      setError(null);
      setFieldErrors({});
    }
    // initialTags/initialPeople are arrays, re-created each render by the
    // caller, so they're deliberately left out of the deps to avoid
    // resetting the form on every keystroke; isOpen toggling is what
    // actually matters here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialTitle, initialDescription, initialMood, initialDreamType, initialSetting, initialVividness]);

  const handleSubmit = async () => {
    const nextFieldErrors: typeof fieldErrors = {};
    if (!title.trim()) nextFieldErrors.title = "Give your dream a title.";
    if (!description.trim()) nextFieldErrors.description = "Describe what happened.";
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onAddDream({ title: title.trim(), description: description.trim(), mood, tags, dreamType, people, setting, vividness });
      if (isControlled) onOpenChange?.(false);
      else setInternalOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isControlled ? open : internalOpen} onOpenChange={isControlled ? onOpenChange : setInternalOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{children ? "Add New Dream" : "Edit Dream"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="dreamTitle">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="dreamTitle"
              placeholder="Dream Title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              aria-invalid={!!fieldErrors.title}
            />
            {fieldErrors.title && <p className="text-destructive text-xs mt-1">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" htmlFor="dreamDescription">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="dreamDescription"
              placeholder="Describe your dream..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }}
              aria-invalid={!!fieldErrors.description}
            />
            {fieldErrors.description && <p className="text-destructive text-xs mt-1">{fieldErrors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mood</label>
            <div className="flex flex-wrap gap-2">
              {MOOD_ORDER.map((option) => {
                const { icon: Icon, label, colorClass } = MOOD_META[option];
                const selected = mood === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMood(option)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-200 hover:scale-105 cursor-pointer",
                      selected ? "border-current bg-accent" : "border-border hover:bg-accent/50",
                      selected ? colorClass : "text-muted-foreground"
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Dream Type</label>
            <div className="flex flex-wrap gap-2">
              {DREAM_TYPE_ORDER.map((option) => {
                const { icon: Icon, label } = DREAM_TYPE_META[option];
                const selected = dreamType === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDreamType(option)}
                    aria-pressed={selected}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-200 hover:scale-105 cursor-pointer",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Vividness</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVividness(n)}
                  aria-label={`${n} out of 5`}
                  className="cursor-pointer transition-transform duration-150 hover:scale-110"
                >
                  <Star
                    className={cn("size-6", n <= vividness ? "text-primary" : "text-muted-foreground")}
                    fill={n <= vividness ? "currentColor" : "none"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </div>

          <TagInput label="Tags" value={tags} onChange={setTags} knownOptions={knownTags} placeholder="flying, water, chased…" />
          <TagInput label="People" value={people} onChange={setPeople} knownOptions={knownPeople} placeholder="who showed up…" />

          <div>
            <label className="block text-sm font-medium mb-1.5">Setting</label>
            <Input
              placeholder="Where did it take place?"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
