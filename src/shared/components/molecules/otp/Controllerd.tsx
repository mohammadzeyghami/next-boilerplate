import * as React from "react";
import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import OtpPrimary, { type OtpPrimaryProps } from "./Primary";

type StrippedProps = Omit<
  OtpPrimaryProps,
  "error" | "name" | "onChange" | "onBlur" | "value"
>;

export interface OtpRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends StrippedProps {
  name: TName;
  rules?: RegisterOptions<TFieldValues, TName>;
}

function OtpRInner<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, rules, ...props }: OtpRProps<TFieldValues, TName>) {
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
        <OtpPrimary
          {...props}
          value={String(field.value ?? "")}
          onChange={(val) => field.onChange(val)}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

const OtpR = React.memo(OtpRInner) as typeof OtpRInner;
export default OtpR;
