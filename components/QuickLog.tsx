"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormModal from "@/components/FormModal";
import { useToast } from "@/components/Toast";
import { useDreams } from "@/context/DreamContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { parseLocalDateString } from "@/lib/utils";

// "Log a dream" from anywhere in the app. Writing a dream down is the one
// thing this app is for, and it used to be reachable only from the Dreambook
// page; a person who has just woken up should not have to navigate first.
// It logs onto whichever day is currently selected (today, unless the
// Dreambook has been pointed at another day).
export default function QuickLog({ variant }: { variant: "nav" | "fab" }) {
  const { addDream, selectedDate } = useDreams();
  const toast = useToast();
  const dateLabel = format(parseLocalDateString(selectedDate), "EEEE, d MMMM");

  return (
    <FormModal
      dateLabel={dateLabel}
      onAddDream={async (values) => {
        await addDream({ ...values, date: selectedDate });
        toast("Dream saved to your journal.", "success");
      }}
    >
      {variant === "fab" ? (
        <Button
          size="icon"
          aria-label="Log a dream"
          className={cn("size-14 rounded-full shadow-[inset_0_1px_0_oklch(1_0_0/40%),0_10px_30px_-8px_var(--color-primary)] ring-4 ring-background/80")}
        >
          <Plus className="size-6" strokeWidth={2.25} />
        </Button>
      ) : (
        <Button size="sm" className="rounded-full h-9 px-3.5" aria-label="Log a dream">
          <Plus className="size-4" strokeWidth={2.25} />
          <span className="hidden lg:inline">Log a dream</span>
        </Button>
      )}
    </FormModal>
  );
}
