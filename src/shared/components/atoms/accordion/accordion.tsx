"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import React from "react";
import { accordionVariants } from "./accordion.variants";
import { type VariantProps } from "class-variance-authority";
import { RequiredSectionProvider } from "../../../contexts/required-section-context";

export const Accordion = AccordionPrimitive.Root;

type ItemProps = React.ComponentProps<typeof AccordionPrimitive.Item> &
  VariantProps<typeof accordionVariants>;

export function AccordionItem({
  className,
  size,
  variant,
  ...props
}: ItemProps) {
  const isRequiredSection = props.value === "required";
  return (
    <RequiredSectionProvider enabled={isRequiredSection}>
      <AccordionPrimitive.Item
        data-slot="accordion-item"
        className={cn(accordionVariants({ size, variant }), className)}
        {...props}
      />
    </RequiredSectionProvider>
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header data-slot="accordion-header">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex w-full items-center justify-between py-2 font-medium transition-all [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <svg
          className="size-4 shrink-0 text-foreground transition-transform dark:text-white"
          viewBox="0 0 24 24"
        >
          <path className="fill-current" d="M12 15l-8 -8h16z" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className,
      )}
      {...props}
    />
  );
}
