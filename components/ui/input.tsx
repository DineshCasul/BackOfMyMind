import * as React from "react"

import { cn } from "@/lib/utils"

// The look itself (`.field`) lives in globals.css so Input and Textarea can
// never drift apart. Height goes up to h-11: on a phone a 36px field is a
// small target, and taller fields also read as more "journal", less "admin
// form".
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "field placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground flex h-11 w-full min-w-0 px-3.5 py-1 text-base file:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
