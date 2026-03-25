import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "./button-variants";

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  isLoading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || isLoading;

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size, className }),
        isLoading && "pointer-events-none",
      )}
      // only set disabled on real <button>, not on Slot
      {...(!asChild && { disabled: isDisabled })}
      aria-disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="mr-2 inline-flex size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </Comp>
  );
}
