import { forwardRef, useCallback, useRef, type InputHTMLAttributes } from "react";
import ErrorMessage from "../../atoms/typography/ErrorMessage";
import LabelPrimary from "../label/Primary";
import { Input } from "./Default";
import { cn } from "@/lib/utils";

export interface InputPrimaryProps
  extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

const InputPrimary = forwardRef<HTMLInputElement, InputPrimaryProps>(
  ({ error, label, className, required, ...props }, ref) => {
    const isDateInput = [
      "date",
      "datetime-local",
      "month",
      "time",
      "week",
    ].includes(props.type ?? "");
    const inputRef = useRef<HTMLInputElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      },
      [ref]
    );

    const handleOpenPicker = useCallback(() => {
      const el = inputRef.current;
      if (!el) return;
      if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
        (el as HTMLInputElement & { showPicker: () => void }).showPicker();
      } else {
        el.focus();
      }
    }, []);

    return (
      <div className="flex flex-col items-start gap-1">
        {label ? (
          <LabelPrimary required={required}>{label}</LabelPrimary>
        ) : null}
        <div className="relative w-full">
          <Input
            ref={setRefs}
            aria-invalid={!!error || undefined}
            className={cn(className, isDateInput && "pr-10")}
            {...props}
          />
          {isDateInput ? (
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Open calendar"
              onMouseDown={(event) => event.preventDefault()}
              onClick={handleOpenPicker}
            >
              <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  className="fill-current"
                  d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm12 8H5v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1Zm0-3V7a1 1 0 0 0-1-1h-1v1a1 1 0 1 1-2 0V6H8v1a1 1 0 1 1-2 0V6H5a1 1 0 0 0-1 1v2Z"
                />
              </svg>
            </button>
          ) : null}
        </div>
        <ErrorMessage message={error} />
      </div>
    );
  }
);

InputPrimary.displayName = "InputPrimary";
export default InputPrimary;
