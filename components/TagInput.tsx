"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  knownOptions?: string[];
  placeholder?: string;
};

function distinctSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

// Toggleable chips sourced from values already used elsewhere (so typo
// variants don't multiply), plus free-text add for anything new — used for
// both tags and people in the dream form.
export default function TagInput({ label, value, onChange, knownOptions = [], placeholder = "Add…" }: Props) {
  const [draft, setDraft] = useState("");

  const allOptions = useMemo(() => distinctSorted([...knownOptions, ...value]), [knownOptions, value]);

  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);
  }

  function addDraft() {
    const next = draft.trim();
    if (next && !value.includes(next)) onChange([...value, next]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addDraft();
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      {allOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {allOptions.map((option) => {
            const selected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                aria-pressed={selected}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs border transition-all duration-200 hover:scale-105 cursor-pointer",
                  selected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" size="sm" onClick={addDraft}>
          Add
        </Button>
      </div>
    </div>
  );
}
