import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

// One frame for every section of the Patterns page, so they read as pages of
// the same journal: a handwritten heading, an optional one-line explanation of
// what the picture shows, and the content. `index` staggers the entrance.
export default function PatternCard({
  title,
  note,
  children,
  className,
  index = 0,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <section className={cn("surface reveal rounded-2xl p-5 sm:p-6", className)} style={{ "--i": index } as CSSProperties}>
      <h3 className="font-hand text-2xl leading-none text-primary/90">{title}</h3>
      {note && <p className="mt-1.5 text-xs text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center font-hand text-xl text-muted-foreground">{children}</p>;
}
