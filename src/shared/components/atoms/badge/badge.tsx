import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { badgeVariants, type BadgeVariant } from "./badge.variants";

export function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & BadgeVariant & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
