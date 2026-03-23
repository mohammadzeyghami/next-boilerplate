import { cn } from "@/lib/utils";
import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import LabelPrimary from "../label/Primary";
import { Switch } from "./Default";

export interface ControlledSwitchProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<
    React.ComponentProps<typeof Switch>,
    "checked" | "onCheckedChange"
  > {
  name: TName;
  label?: string;
  rules?: RegisterOptions<TFieldValues, TName>;
  className?: string;
}

function ControlledSwitch<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  rules,
  className,
  ...props
}: ControlledSwitchProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <LabelPrimary className="text-sm font-medium text-foreground">
          {label}
        </LabelPrimary>
      )}
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
          <>
            <Switch
              id={name}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
              {...props}
            />
            {fieldState.error && (
              <p className="text-sm text-red-500 mt-1">
                {fieldState.error.message}
              </p>
            )}
          </>
        )}
      />
    </div>
  );
}

export default ControlledSwitch;
