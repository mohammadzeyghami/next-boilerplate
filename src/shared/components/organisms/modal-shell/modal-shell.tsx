import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/molecules/dialog";
import { X } from "lucide-react";
import * as React from "react";
import { Button } from "@/shared/components/atoms/button";

type WithChildren<T = unknown> = T & { children?: React.ReactNode };

export type ModalShellSize = "sm" | "md" | "lg" | "xl" | "full";

function sizeClass(size: ModalShellSize) {
  switch (size) {
    case "sm":
      return "sm:max-w-md";
    case "md":
      return "sm:max-w-lg";
    case "lg":
      return "sm:max-w-xl";
    case "xl":
      return "sm:max-w-2xl";
    case "full":
      return "sm:max-w-[min(92vw,1100px)]";
    default:
      return "";
  }
}

/**
 * ModalShell
 * - Wraps shadcn Dialog with sensible slots & defaults.
 * - Optional form mode via <ModalShell.Form>.
 */
function ModalShell({
  open,
  onOpenChange,
  children,
}: WithChildren<{ open?: boolean; onOpenChange?: (v: boolean) => void }>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

/* Trigger passthrough */
function ModalShellTrigger({
  className,
  children,
  asChild = true,
}: WithChildren<{ className?: string; asChild?: boolean }>) {
  return (
    <DialogTrigger asChild={asChild} className={className}>
      {children}
    </DialogTrigger>
  );
}

/* Content with size + scrollable body */
function ModalShellContent({
  className,
  size = "md",
  children,
  hideClose = false,
}: WithChildren<{
  className?: string;
  size?: ModalShellSize;
  hideClose?: boolean;
}>) {
  return (
    <DialogContent
      data-slot="modal-shell-content"
      showCloseButton={false}
      className={cn(
        "gap-0 p-0",
        "max-h-[92dvh] overflow-hidden",
        sizeClass(size),
        className
      )}
    >
      {children}

      {!hideClose && (
        <DialogClose asChild>
          <button
            aria-label="Close"
            className={cn(
              "absolute right-3 top-3 grid size-8 place-items-center rounded-sm",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              "focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
            )}
          >
            <X className="size-4" />
          </button>
        </DialogClose>
      )}
    </DialogContent>
  );
}

/* Header: icon + title + description */
function ModalShellHeader({
  className,
  icon,
  title,
  description,
  children,
}: WithChildren<{
  className?: string;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
}>) {
  return (
    <DialogHeader
      data-slot="modal-shell-header"
      className={cn("px-6 pt-5 pb-3", className)}
    >
      {children ? (
        children
      ) : (
        <>
          {icon ? (
            <div className="mb-1 text-muted-foreground">{icon}</div>
          ) : null}
          {title ? <DialogTitle>{title}</DialogTitle> : null}
          {description ? (
            <DialogDescription className="text-sm text-muted-foreground">
              {description}
            </DialogDescription>
          ) : null}
        </>
      )}
    </DialogHeader>
  );
}

/* Body: scroll container */
function ModalShellBody({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="modal-shell-body"
      className={cn(
        "px-6 py-4",
        "overflow-auto",
        "max-h-[calc(92dvh-9rem)]", // leaves room for header+footer
        className
      )}
    >
      {children}
    </div>
  );
}

/* Footer: actions area */
function ModalShellFooter({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <DialogFooter
      data-slot="modal-shell-footer"
      className={cn("gap-2 px-6 pb-5 pt-3", className)}
    >
      {children}
    </DialogFooter>
  );
}

/* Common confirm/cancel action row (optional convenience) */
function ModalShellActions({
  className,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmVariant = "default",
  confirmDisabled,
  destructive = false,
  children,
}: WithChildren<{
  className?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  confirmVariant?: "default" | "secondary";
  confirmDisabled?: boolean;
  destructive?: boolean;
}>) {
  if (children) {
    // allow fully custom actions if children are provided
    return (
      <div className={cn("flex items-center justify-end gap-2", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-end gap-2", className)}>
      <DialogClose asChild>
        <Button variant="secondary">{cancelText}</Button>
      </DialogClose>
      <Button
        onClick={onConfirm}
        variant={destructive ? "destructive" : confirmVariant}
        disabled={confirmDisabled}
      >
        {confirmText}
      </Button>
    </div>
  );
}

/* Form variant: wraps body+footer in a <form> to submit with Enter */
function ModalShellForm({
  className,
  onSubmit,
  children,
}: WithChildren<{
  className?: string;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}>) {
  return (
    <form
      data-slot="modal-shell-form"
      className={cn("contents", className)}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  );
}

/* Compound API */
ModalShell.Trigger = ModalShellTrigger;
ModalShell.Content = ModalShellContent;
ModalShell.Header = ModalShellHeader;
ModalShell.Body = ModalShellBody;
ModalShell.Footer = ModalShellFooter;
ModalShell.Actions = ModalShellActions;
ModalShell.Form = ModalShellForm;

export { ModalShell };
export type ModalShellActionsProps = React.ComponentProps<
  typeof ModalShellActions
>;
