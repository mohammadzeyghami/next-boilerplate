import { cn } from "@/lib/utils";
import * as ToastPrimitive from "@radix-ui/react-toast";
import * as React from "react";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(function ToastViewport({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Viewport
      ref={ref}
      className={cn(
        "fixed top-0 right-0 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-4",
        "sm:top-4 sm:right-4",
        className
      )}
      {...props}
    />
  );
});

type ToastVariant = "default" | "destructive";

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  variant?: ToastVariant;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(function Toast({ className, variant = "default", ...props }, ref) {
  return (
    <ToastPrimitive.Root
      ref={ref}
      data-variant={variant}
      className={cn(
        "pointer-events-auto flex w-full items-start gap-3 rounded-md border bg-card px-3 py-2 text-sm shadow-lg",
        "data-[variant=destructive]:border-destructive/60 data-[variant=destructive]:bg-destructive/10",
        className
      )}
      {...props}
    />
  );
});

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Title
      ref={ref}
      className={cn("font-medium", className)}
      {...props}
    />
  );
});

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
});

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(function ToastClose({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Close
      ref={ref}
      className={cn(
        "ml-auto inline-flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none text-xs",
        className
      )}
      aria-label="Close"
      {...props}
    >
      ✕
    </ToastPrimitive.Close>
  );
});

export {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
export type { ToastVariant };
