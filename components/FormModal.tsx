"use client";

import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { Feather, Loader2, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  /** Shown as the entry's date at the top of the page, e.g. "Sunday, 20 September". */
  dateLabel?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialMood?: MoodType;
  initialTags?: string[];
  initialDreamType?: DreamType;
  initialPeople?: string[];
  initialSetting?: string;
  initialVividness?: number;
}

// Words for the five stars, so "3 out of 5" becomes something a person would
// actually say about a dream.
const VIVIDNESS_WORDS = ["Faint", "Hazy", "Clear", "Vivid", "Unforgettable"];

function Section({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="font-hand text-base text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function FormModal({
  onAddDream,
  children,
  open,
  onOpenChange,
  dateLabel,
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
  const [hoverVividness, setHoverVividness] = useState<number | null>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (next: boolean) => (isControlled ? onOpenChange?.(next) : setInternalOpen(next));
  const isNew = Boolean(children);

  const knownTags = useMemo(() => Array.from(new Set(dreams.flatMap((d) => d.tags ?? []))), [dreams]);
  const knownPeople = useMemo(() => Array.from(new Set(dreams.flatMap((d) => d.people ?? []))), [dreams]);

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const shownVividness = hoverVividness ?? vividness;

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
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="max-h-[90vh] overflow-y-auto gap-0 p-0 sm:max-w-xl"
        // Ctrl/Cmd + Enter saves from anywhere in the form, so you can keep
        // typing a long dream and finish without reaching for the mouse.
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
      >
        <span className="ribbon !right-16" style={{ "--ribbon": "var(--gold)" } as CSSProperties} aria-hidden="true" />

        <DialogHeader className="px-6 pt-6 pb-4">
          <p className="font-hand text-lg text-primary/90 flex items-center gap-1.5">
            <Feather className="size-4" strokeWidth={1.75} />
            {dateLabel ?? "A new page"}
          </p>
          <DialogTitle className="text-2xl">{isNew ? "Log a dream" : "Edit this dream"}</DialogTitle>
          <DialogDescription>{isNew ? "Write it down before it fades. Rough notes are fine." : "Change anything you remember differently now."}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6">
          <div>
            <label className="sr-only" htmlFor="dreamTitle">
              Title
            </label>
            <Input
              id="dreamTitle"
              placeholder="Give it a title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              aria-invalid={!!fieldErrors.title}
              className="h-12 font-serif text-lg md:text-lg"
            />
            {fieldErrors.title && <p className="text-destructive text-xs mt-1.5">{fieldErrors.title}</p>}
          </div>

          <div>
            <label className="sr-only" htmlFor="dreamDescription">
              Description
            </label>
            {/* Ruled like a notebook page. The 28px line height and the 12px
                top padding match the --line spacing in globals.css, so each
                line of text sits exactly on a rule as you type. */}
            <Textarea
              id="dreamDescription"
              placeholder="Last night, I was…"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }}
              aria-invalid={!!fieldErrors.description}
              className="ruled min-h-[9.5rem] pl-14 pr-4 !py-3 font-serif text-base md:text-base"
              style={{ backgroundPosition: "0 0, 0 12px" }}
            />
            <div className="flex items-center justify-between mt-1.5 text-xs">
              <span className="text-destructive">{fieldErrors.description}</span>
              <span className="font-hand text-base text-muted-foreground">{wordCount} {wordCount === 1 ? "word" : "words"}</span>
            </div>
          </div>

          <Section label="How did it feel?">
            <div className="flex flex-wrap gap-2">
              {MOOD_ORDER.map((option) => {
                const { icon: Icon, label } = MOOD_META[option];
                const selected = mood === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMood(option)}
                    aria-pressed={selected}
                    style={{ "--m": `var(--mood-${option})` } as CSSProperties}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-200 cursor-pointer active:scale-95",
                      selected
                        ? "border-[var(--m)] text-[var(--m)] bg-[color-mix(in_oklch,var(--m)_16%,transparent)] shadow-[0_0_20px_-6px_var(--m)] scale-[1.04]"
                        : "border-white/10 text-muted-foreground hover:border-white/25 hover:text-foreground hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="What kind of dream?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
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
                      "flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer",
                      selected
                        ? "bg-primary text-primary-foreground shadow-[0_4px_14px_-6px_var(--color-primary)] font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.75} />
                    {label}
                  </button>
                );
              })}
            </div>
          </Section>

          <Section label="How vivid was it?" hint={VIVIDNESS_WORDS[shownVividness - 1]}>
            <div className="flex gap-1" onMouseLeave={() => setHoverVividness(null)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVividness(n)}
                  onMouseEnter={() => setHoverVividness(n)}
                  aria-label={`${n} out of 5: ${VIVIDNESS_WORDS[n - 1]}`}
                  aria-pressed={n === vividness}
                  className="cursor-pointer p-0.5 transition-transform duration-150 hover:scale-125 active:scale-95"
                >
                  <Star
                    className={cn("size-7 transition-colors", n <= shownVividness ? "text-gold drop-shadow-[0_0_8px_var(--color-gold)]" : "text-muted-foreground/50")}
                    fill={n <= shownVividness ? "currentColor" : "none"}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>
          </Section>

          <TagInput label="Tags" hint="themes, symbols, feelings" value={tags} onChange={setTags} knownOptions={knownTags} placeholder="flying, water, chased…" />
          <TagInput label="People" hint="who showed up" value={people} onChange={setPeople} knownOptions={knownPeople} placeholder="a name, a face you knew…" />

          <Section label="Where was it?">
            <div className="relative group">
              <MapPin
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground transition-colors group-focus-within:text-primary"
                strokeWidth={1.75}
              />
              <Input placeholder="A place, real or not" value={setting} onChange={(e) => setSetting(e.target.value)} className="pl-10" />
            </div>
          </Section>

          {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
        </div>

        {/* Sticks to the bottom of the scrolling dialog, so Save is always
            in reach however long the form (and the dream) gets. The gradient
            fades the form content out underneath instead of cutting it. */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-white/[0.07] bg-gradient-to-t from-[oklch(0.2_0.036_267)] to-[oklch(0.2_0.036_267/92%)] px-6 py-4 backdrop-blur-md">
          <span className="hidden sm:block font-hand text-base text-muted-foreground">Ctrl + Enter to save</span>
          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-28">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Feather /> Save dream
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
