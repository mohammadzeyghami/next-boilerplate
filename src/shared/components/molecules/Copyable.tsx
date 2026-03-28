import { Button } from "@/shared/components/atoms/button";
import { cn } from "@/lib/utils";
import { CopyIcon } from "lucide-react";
import React, { useCallback, useRef } from "react";
import { toast } from "../atoms/toast/toast-store";

type CopyableProps = {
  children: React.ReactNode;
  value?: string | null;
  className?: string;
  contentClassName?: string;
  buttonClassName?: string;
  successMessage?: string;
  errorMessage?: string;
  disabled?: boolean;
  copyOnClick?: boolean;
  showButton?: boolean;
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / restricted clipboard permissions
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  }
};

export function Copyable({
  children,
  value,
  className,
  contentClassName,
  buttonClassName,
  successMessage = "Content copied to clipboard!",
  errorMessage = "Failed to copy text",
  disabled = false,
  copyOnClick = true,
  showButton = false,
}: CopyableProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  const getText = useCallback(() => {
    const explicit = value?.trim();
    if (explicit) return explicit;

    const el = contentRef.current;
    if (!el) return "";

    const truncatedElement = el.querySelector("[data-full-value]");
    const fullValue =
      truncatedElement?.getAttribute("data-full-value")?.trim() ?? "";
    if (fullValue) return fullValue;

    return (el.textContent ?? "").trim();
  }, [value]);

  const handleCopy = useCallback(async () => {
    if (disabled) return;
    const text = getText();
    if (!text) return;

    const ok = await copyText(text);
    if (ok) {
      toast({ title: "Copied!", description: successMessage, variant: "default" });
    } else {
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  }, [disabled, errorMessage, getText, successMessage]);

  return (
    <div
      className={cn("group relative flex items-start gap-2", className)}
      onClick={copyOnClick && !disabled ? handleCopy : undefined}
      role={copyOnClick && !disabled ? "button" : undefined}
      tabIndex={copyOnClick && !disabled ? 0 : undefined}
      onKeyDown={
        copyOnClick && !disabled
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                void handleCopy();
              }
            }
          : undefined
      }
    >
      <div
        ref={contentRef}
        className={cn(
          "min-w-0 flex-1",
          copyOnClick && !disabled
            ? "cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted/30"
            : undefined,
          contentClassName
        )}
      >
        {children}
      </div>
      {showButton ? (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 opacity-80 transition-opacity group-hover:opacity-100",
            buttonClassName
          )}
          onClick={(e) => {
            e.stopPropagation();
            void handleCopy();
          }}
          disabled={disabled}
          aria-label="Copy to clipboard"
        >
          <CopyIcon className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
