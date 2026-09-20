"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function EditProfileDialog({
  open,
  onOpenChange,
  currentName,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset only on the closed-to-open change. Depending on `currentName` too
  // would wipe what someone is typing whenever the saved name changes in the
  // background (a late profile load, a refresh).
  const currentNameRef = useRef(currentName);
  currentNameRef.current = currentName;
  useEffect(() => {
    if (open) {
      setName(currentNameRef.current);
      setError(null);
    }
  }, [open]);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await onSave(name);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>This is the name shown next to dreams you share publicly.</DialogDescription>
        </DialogHeader>

        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="profileDisplayName">
            Name
          </label>
          <Input
            id="profileDisplayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            maxLength={40}
            autoFocus
          />
          {error && <p className="text-destructive text-sm mt-1.5">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
