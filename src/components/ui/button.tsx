import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-button-ring focus-visible:ring-button focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-button text-button border border-button hover:bg-button-hover font-medium",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 transition-colors",
        outline:
          "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium bg-button-outline-bg text-sidebar-foreground border border-button-outline-border hover:bg-button-outline-hover-bg hover:border-button-outline-hover-border transition-all duration-200",
        error:
          "cursor-pointer text-button-error-text border-2 bg-button-error-bg border-button-error-border hover:bg-button-error-hover-bg hover:border-button-error-hover-border hover:text-button-error-hover-text focus-visible:ring-button-error-ring transition-all duration-300",
        transparent:
          "px-4 py-2 hover:bg-sidebar-item-hover-bg/55 border border-transparent hover:border hover:border-sidebar-item bg-transparent text-sidebar-foreground hover:text-foreground data-[active=true]:bg-hover-bg-strong data-[active=true]:text-foreground data-[active=true]:shadow-button-active transition-colors",
        ghost:
          "bg-button-ghost text-button hover:bg-button-hover transition-colors",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        /** Modal/dialog action row buttons: left-aligned, compact padding */
        action: "h-10 justify-start w-fit gap-2 px-3 py-2 font-medium border-2 rounded-lg",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
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
      data-size={size ?? undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
