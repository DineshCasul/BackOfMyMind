"use client";

import { useState, useEffect } from "react";
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
import { MoodType } from "@/context/DreamContext";

interface FormModalProps {
  onAddDream: (title: string, description: string, mood: MoodType) => void;
  children?: React.ReactNode; // for add button
  open?: boolean; // controlled open
  onOpenChange?: (open: boolean) => void; // controlled handler
  initialTitle?: string;
  initialDescription?: string;
  initialMood?: MoodType;
}

const moodOptions: MoodType[] = ["happy", "neutral", "sad"];

export default function FormModal({
  onAddDream,
  children,
  open,
  onOpenChange,
  initialTitle = "",
  initialDescription = "",
  initialMood = "neutral",
}: FormModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [mood, setMood] = useState<MoodType>(initialMood);
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const isOpen = isControlled ? open : internalOpen;

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setMood(initialMood);
    }
  }, [isOpen, initialTitle, initialDescription, initialMood]);

  const handleSubmit = () => {
    if (!title || !description) return;
    onAddDream(title, description, mood);
    if (isControlled) onOpenChange?.(false);
    else setInternalOpen(false);
  };

  return (
    <Dialog open={isControlled ? open : internalOpen} onOpenChange={isControlled ? onOpenChange : setInternalOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{children ? "Add New Dream" : "Edit Dream"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <Input
            placeholder="Dream Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Describe your dream..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            className="w-full p-2 border rounded"
            value={mood}
            onChange={(e) => setMood(e.target.value as MoodType)}
          >
            {moodOptions.map((option) => (
              <option key={option} value={option}>
                {option === "happy"
                  ? "😊 Happy"
                  : option === "neutral"
                  ? "😐 Neutral"
                  : "😢 Sad"}
              </option>
            ))}
          </select>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
