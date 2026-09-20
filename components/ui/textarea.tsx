import * as React from "react"

import { cn } from "@/lib/utils"

// `field-sizing-content` makes the box grow with what's typed (no fixed
// height to scroll inside while writing a long dream), capped so it can't
// push the form's Save button off the screen.
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field placeholder:text-muted-foreground/60 flex field-sizing-content min-h-28 max-h-72 w-full px-3.5 py-3 text-base leading-relaxed disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
