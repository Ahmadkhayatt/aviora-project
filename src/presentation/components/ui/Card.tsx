"use client"

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/class-utils";

const cardVariants = cva(
  "rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white border-charcoal-200",
        interactive: "bg-white border-charcoal-200 hover:shadow-lg hover:border-gold-300 cursor-pointer",
        bordered: "bg-transparent border-2 border-gold-500 shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  readonly asChild?: boolean;
  readonly padded?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      asChild = false,
      padded = true,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? "div" : "div";

    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, className }))}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card, cardVariants };