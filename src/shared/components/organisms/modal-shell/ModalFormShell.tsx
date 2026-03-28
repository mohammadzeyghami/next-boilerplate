import { ModalShell, type ModalShellSize } from "./modal-shell";
import {
  FormProvider as RHFFormProvider,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

type WithChildren<T = unknown> = T & { children?: React.ReactNode };

export type ModalFormShellProps<TFieldValues extends FieldValues> =
  WithChildren<{
    open: boolean;
    onOpenChange: (open: boolean) => void;

    /** RHF form instance */
    methods: UseFormReturn<TFieldValues>;

    /** Called with valid values on submit */
    onSubmit: (values: TFieldValues) => void;

    /** Modal presentation props */
    title?: React.ReactNode;
    description?: React.ReactNode;
    size?: ModalShellSize;
    hideClose?: boolean;

    /** Actions */
    confirmText?: string;
    cancelText?: string;
    submitting?: boolean;
    destructive?: boolean;
  }>;

export function ModalFormShell<TFieldValues extends FieldValues>({
  open,
  onOpenChange,
  methods,
  onSubmit,
  title,
  description,
  size = "md",
  hideClose,
  children,
  confirmText = "Save",
  cancelText = "Cancel",
  submitting,
  destructive,
}: ModalFormShellProps<TFieldValues>) {
  const handleSubmit = methods.handleSubmit(onSubmit);

  return (
    <ModalShell open={open} onOpenChange={onOpenChange}>
      <ModalShell.Content size={size} hideClose={hideClose}>
        <ModalShell.Header title={title} description={description} />

        <RHFFormProvider {...methods}>
          <ModalShell.Form onSubmit={handleSubmit}>
            <ModalShell.Body>{children}</ModalShell.Body>

            <ModalShell.Footer>
              <ModalShell.Actions
                confirmText={confirmText}
                cancelText={cancelText}
                confirmDisabled={submitting}
                destructive={destructive}
              />
            </ModalShell.Footer>
          </ModalShell.Form>
        </RHFFormProvider>
      </ModalShell.Content>
    </ModalShell>
  );
}
