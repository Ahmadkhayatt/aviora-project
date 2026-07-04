"use client"

import React, { forwardRef, type ReactElement } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/utils/class-utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-luxury-primary text-charcoal-950 hover:bg-luxury-secondary",
        gold: "bg-gold-500 text-charcoal-950 hover:bg-gold-600",
        outline: "border border-gold-500 bg-transparent text-gold-500 hover:bg-gold-50",
        ghost: "hover:bg-gold-50 hover:text-gold-600",
        danger: "bg-rose-600 text-white hover:bg-rose-700",
      },
      size: {
        sm: "h-9 rounded-md px-3",
        md: "h-10 rounded-md px-4 py-2",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
  readonly loading?: boolean;
  readonly leftIcon?: ReactElement;
  readonly rightIcon?: ReactElement;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    if (asChild) {
      const Comp = children as ReactElement;
      return React.cloneElement(Comp, {
        className: cn(buttonVariants({ variant, size, className })),
        disabled: isDisabled,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };