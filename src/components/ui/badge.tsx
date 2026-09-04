import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Tint variants pair a 10% background with the DARKENED label hue
 * (--color-*-text in index.css), not the raw one: the raw tokens measure
 * 2.0-4.4:1 on their own tints and fail WCAG AA for text. The background,
 * fills and glyphs keep the raw hue, so the colour still reads the same.
 * `suspended` keeps its orange-500 tint but borrows the amber text token
 * (5.35:1 on that tint) - orange has no token of its own in index.css, and
 * adding a colour to fix one label is worse than reusing its nearest neighbour.
 *
 * `suspended`, `locked` and `deactivated` exist because the workflow screens
 * are shared with the console through @xvs/finance and render all three. A
 * variant this app never writes for itself is still one the shared screens
 * hand to it, and a name the Badge does not know renders unstyled.
 */
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border border-transparent px-2 py-0.5 text-sm font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        success: "bg-green-01/10 text-green-01-text",
        active: "bg-green-01/10 text-green-01-text",
        inactive: "bg-gray-05/10 text-gray-06-text",
        pending: "bg-yellow-01/10 text-yellow-01-text",
        suspended: "bg-orange-500/10 text-yellow-01-text",
        locked: "bg-destructive/10 text-error-text",
        deactivated: "bg-gray-05/10 text-gray-06-text",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        rejected: "bg-destructive/10 text-error-text",
        teal: "bg-[#E1F5EE] text-[#0F6E56]",
        amber: "bg-[#FAEEDA] text-[#854F0B]",
        blue: "bg-[#E6F1FB] text-[#185FA5]",
        green: "bg-[#EAF3DE] text-[#3B6D11]",
        red: "bg-[#FCEBEB] text-[#A32D2D]",
        outline:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "[a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
