import { Button } from "@/shared/components/atoms/button";
import { useFormContext } from "react-hook-form";

interface SubmitButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "type" | "isLoading"> {
  /** Text shown on the button (default: "Submit") */
  label?: string;
  /** Optional custom loading label */
  loadingLabel?: string;
  /** External loading state (e.g. from mutation) */
  loading?: boolean;
}

/**
 * SubmitButton — RHF-aware submit button with built-in loading state.
 */
export function SubmitButton({
  label = "Submit",
  loadingLabel,
  loading,
  ...props
}: SubmitButtonProps) {
  const {
    formState: { isSubmitting },
  } = useFormContext();

  const isLoading = loading || isSubmitting;

  return (
    <Button
      type="submit"
      isLoading={isLoading}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? loadingLabel || label : label}
    </Button>
  );
}
