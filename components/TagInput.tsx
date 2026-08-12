"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  knownOptions?: string[];
  placeholder?: string;
};

// Past this many chips the row starts crowding the form, everything past
// it moves into the "see all" picker instead.
const VISIBLE_LIMIT = 6;

function distinctSorted(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

function Chip({ option, selected, onClick }: { option: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
}

// Toggleable chips sourced from values already used elsewhere (so typo
// variants don't multiply), plus free-text add for anything new, used for
// both tags and people in the dream form.
export default function TagInput({ label, value, onChange, knownOptions = [], placeholder = "Add…" }: Props) {
  const [draft, setDraft] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [filter, setFilter] = useState("");

  const allOptions = useMemo(() => distinctSorted([...knownOptions, ...value]), [knownOptions, value]);

  // Selected options always stay visible (so toggling one off never
  // requires opening the picker first), unselected ones fill whatever
  // room is left up to VISIBLE_LIMIT, alphabetical order preserved
  // throughout rather than grouping selected-first.
  const { visibleOptions, hiddenCount } = useMemo(() => {
    const selectedCount = allOptions.filter((o) => value.includes(o)).length;
    let unselectedBudget = Math.max(0, VISIBLE_LIMIT - selectedCount);
    const visible: string[] = [];
    let hidden = 0;
    for (const option of allOptions) {
      if (value.includes(option)) {
        visible.push(option);
      } else if (unselectedBudget > 0) {
        visible.push(option);
        unselectedBudget--;
      } else {
        hidden++;
      }
    }
    return { visibleOptions: visible, hiddenCount: hidden };
  }, [allOptions, value]);

  const filteredAllOptions = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? allOptions.filter((o) => o.toLowerCase().includes(q)) : allOptions;
  }, [allOptions, filter]);

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
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {visibleOptions.map((option) => (
            <Chip key={option} option={option} selected={value.includes(option)} onClick={() => toggle(option)} />
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className="px-2.5 py-1 rounded-full text-xs border border-dashed border-border text-muted-foreground hover:bg-accent transition-all duration-200 hover:scale-105 cursor-pointer"
            >
              +{hiddenCount} more
            </button>
          )}
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

      <Dialog open={isPickerOpen} onOpenChange={(open) => { setIsPickerOpen(open); if (!open) setFilter(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>All {label.toLowerCase()}</DialogTitle>
          </DialogHeader>

          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Filter ${label.toLowerCase()}…`}
            autoFocus
          />

          <div className="flex flex-wrap gap-1.5 max-h-72 overflow-y-auto py-1">
            {filteredAllOptions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No matches.</p>
            ) : (
              filteredAllOptions.map((option) => (
                <Chip key={option} option={option} selected={value.includes(option)} onClick={() => toggle(option)} />
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsPickerOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
