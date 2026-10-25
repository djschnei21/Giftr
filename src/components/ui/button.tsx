import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const filled =
  "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_6px_16px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)] hover:-translate-y-px hover:bg-primary/90 hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_10px_24px_-8px_color-mix(in_oklab,var(--primary)_70%,transparent)]";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition outline-none select-none focus-visible:ring-4 focus-visible:ring-ring/30 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: filled,
        berry: filled,
        destructive: "bg-destructive text-white hover:-translate-y-px hover:bg-destructive/90",
        outline: "border bg-card hover:-translate-y-px hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-secondary",
        link: "rounded-none px-0 text-accent-foreground underline decoration-current/30 underline-offset-4 hover:decoration-current",
      },
      size: {
        default: "h-10 px-3 text-base",
        sm: "h-8 rounded-lg px-3 text-sm",
        lg: "h-12 px-4 text-base",
        icon: "size-10",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
