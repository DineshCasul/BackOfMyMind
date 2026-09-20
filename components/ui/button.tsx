import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// The primary button is a soft lavender gradient with a 1px inner highlight
// along the top edge and a coloured glow underneath, so it reads as a lit
// object on the dark sky rather than a flat rectangle. Hover brightens and
// lifts it a hair; pressing sinks it back down (`active:scale`), which is
// what makes it feel clickable.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 hover:-translate-y-px active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/60 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-primary to-[oklch(0.7_0.115_283)] text-primary-foreground shadow-[inset_0_1px_0_oklch(1_0_0/40%),0_8px_20px_-10px_var(--color-primary)] hover:brightness-110 hover:shadow-[inset_0_1px_0_oklch(1_0_0/45%),0_12px_26px_-10px_var(--color-primary)]",
        destructive:
          "bg-gradient-to-b from-destructive to-[oklch(0.55_0.2_25)] text-white shadow-[inset_0_1px_0_oklch(1_0_0/25%),0_8px_20px_-10px_var(--color-destructive)] hover:brightness-110",
        outline:
          "border border-white/12 bg-white/[0.03] text-foreground hover:bg-white/[0.08] hover:border-white/25",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "text-foreground/80 hover:bg-white/[0.07] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline hover:translate-y-0",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3.5",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-12 rounded-xl px-6 text-base has-[>svg]:px-5",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
