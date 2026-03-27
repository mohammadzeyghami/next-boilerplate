import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { Switch } from "@/shared/components/atoms/switch";
import LabelPrimary from "../label/Primary";
import ErrorMessage from "../../atoms/typography/ErrorMessage";

export interface SwitchRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  description?: string;
  rules?: RegisterOptions<TFieldValues, TName>;
  disabled?: boolean;
  className?: string;
}

function SwitchR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  description,
  rules,
  disabled,
  className,
}: SwitchRProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({
        field,
        fieldState,
      }: {
        field: ControllerRenderProps<TFieldValues, TName>;
        fieldState: ControllerFieldState;
      }) => (
        <div className={className}>
          <div className="flex items-center justify-between gap-4">
            <div className="grid gap-1">
              {label ? <LabelPrimary>{label}</LabelPrimary> : null}
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
              disabled={disabled}
              ref={field.ref}
            />
          </div>
          <ErrorMessage message={fieldState.error?.message} />
        </div>
      )}
    />
  );
}

export default SwitchR;
