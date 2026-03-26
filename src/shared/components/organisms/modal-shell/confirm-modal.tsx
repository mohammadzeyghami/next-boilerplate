import { Button, Input } from "@/Shared";
import { Copy } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ModalShell, type ModalShellSize } from "./modal-shell";

export type ConfirmModalProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title?: ReactNode;
  description?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  /** If provided, user must type this value exactly before confirming */
  confirmationText?: string;
  /** Optional hint shown in the confirmation input */
  confirmationPlaceholder?: string;
  destructive?: boolean;
  size?: ModalShellSize;
  hideClose?: boolean;
};

export function ConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  confirmDisabled,
  confirmationText,
  confirmationPlaceholder,
  destructive = true,
  size = "sm",
  hideClose,
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = useState("");
  const trimmedConfirmationText = confirmationText?.trim() ?? "";
  const needsTypedConfirmation = trimmedConfirmationText.length > 0;

  useEffect(() => {
    if (!open) {
      setTypedValue("");
    }
  }, [open, trimmedConfirmationText]);

  const isMatch = useMemo(
    () => (!needsTypedConfirmation ? true : typedValue === trimmedConfirmationText),
    [needsTypedConfirmation, typedValue, trimmedConfirmationText]
  );

  const resolvedTitle = title ?? "Are you sure?";
  const resolvedDescription = description ?? "This action cannot be undone.";
  const resolvedConfirmText = confirmText ?? (destructive ? "Delete" : "Confirm");
  const resolvedPlaceholder =
    confirmationPlaceholder ??
    (needsTypedConfirmation
      ? `Type "${trimmedConfirmationText}" exactly`
      : "Type to confirm");

  const handleCopyAndFill = async () => {
    if (!needsTypedConfirmation) return;
    setTypedValue(trimmedConfirmationText);
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(trimmedConfirmationText);
    } catch {
      // ignore clipboard failures, filling input is enough
    }
  };

  return (
    <ModalShell open={open} onOpenChange={(v) => !v && onCancel()}>
      <ModalShell.Content size={size} hideClose={hideClose}>
        <ModalShell.Header
          title={resolvedTitle}
          description={resolvedDescription}
        />
        {needsTypedConfirmation ? (
          <ModalShell.Body className="grid gap-2 py-2">
            <p className="text-sm font-medium">Type this name to confirm deletion:</p>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <code className="flex-1 truncate text-sm">{trimmedConfirmationText}</code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => void handleCopyAndFill()}
                aria-label="Copy name"
              >
                <Copy className="size-4" />
              </Button>
            </div>
            <Input
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={resolvedPlaceholder}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </ModalShell.Body>
        ) : null}
        <ModalShell.Footer>
          <ModalShell.Actions
            cancelText={cancelText}
            confirmText={resolvedConfirmText}
            confirmDisabled={Boolean(confirmDisabled) || !isMatch}
            destructive={destructive}
            onConfirm={onConfirm}
          />
        </ModalShell.Footer>
      </ModalShell.Content>
    </ModalShell>
  );
}
