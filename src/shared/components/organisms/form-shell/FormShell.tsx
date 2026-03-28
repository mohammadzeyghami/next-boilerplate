import { cn } from "@/lib/utils";
import {
  FormProvider as RHFFormProvider,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import { Button } from "@/shared/components/atoms/button";
import { SubmitButton } from "../../molecules/inputs/SubmitButton";

type WithChildren<T = unknown> = T & { children?: React.ReactNode };

export type FormShellProps<TFieldValues extends FieldValues> = WithChildren<{
  /** RHF form instance */
  methods: UseFormReturn<TFieldValues>;

  /** Called with valid values on submit */
  onSubmit: (values: TFieldValues) => void | Promise<void>;

  /** Optional header copy */
  title?: React.ReactNode;
  description?: React.ReactNode;

  /** Layout classes */
  className?: string;
  contentClassName?: string;
  footerClassName?: string;

  /** Default actions copy */
  submitText?: string;
  submitLoadingText?: string;
  submitting?: boolean;
  onCancel?: () => void;
  cancelText?: string;

  /** Override footer entirely */
  footer?: React.ReactNode;
}>;

/**
 * FormShell
 * - Wraps RHF provider + <form>.
 * - Provides optional header + default footer actions.
 * - Footer can be overridden with `footer` prop when custom actions are needed.
 */
export function FormShell<TFieldValues extends FieldValues>({
  methods,
  onSubmit,
  title,
  description,
  className,
  contentClassName,
  footerClassName,
  submitText = "Save",
  submitLoadingText,
  submitting,
  onCancel,
  cancelText = "Cancel",
  footer,
  children,
}: FormShellProps<TFieldValues>) {
  const handleSubmit = (e?: React.BaseSyntheticEvent) => {
    e?.stopPropagation();
    return methods.handleSubmit(onSubmit)(e);
  };

  return (
    <RHFFormProvider {...methods}>
      <form
        data-slot="form-shell"
        className={cn("grid gap-6", className)}
        onSubmit={handleSubmit}
      >
        {(title || description) && (
          <div className="grid gap-1">
            {title ? (
              <h2 className="text-lg font-semibold leading-tight">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        )}

        <div className={cn("grid gap-4", contentClassName)}>{children}</div>

        {footer ?? (
          <div
            className={cn(
              "flex items-center justify-end gap-2",
              footerClassName
            )}
          >
            {onCancel ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                {cancelText}
              </Button>
            ) : null}

            <SubmitButton
              label={submitText}
              loadingLabel={submitLoadingText || submitText}
              loading={submitting}
            />
          </div>
        )}
      </form>
    </RHFFormProvider>
  );
}
