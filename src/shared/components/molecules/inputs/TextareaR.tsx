import type React from "react";
import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { Textarea } from "../../atoms/textarea";
import ErrorMessage from "../../atoms/typography/ErrorMessage";
import LabelPrimary from "../label/Primary";

type StrippedTextareaProps = Omit<
  React.ComponentProps<typeof Textarea>,
  "name" | "onChange" | "onBlur" | "value"
>;

export interface TextareaRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends StrippedTextareaProps {
  name: TName;
  label?: string;
  rules?: RegisterOptions<TFieldValues, TName>;
  required?: boolean;
}

function TextareaR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  rules,
  required,
  ...props
}: TextareaRProps<TFieldValues, TName>) {
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
        <div className="flex flex-col items-start gap-1">
          {label ? (
            <LabelPrimary required={required}>{label}</LabelPrimary>
          ) : null}
          <Textarea {...field} {...props} className="w-full" />
          <ErrorMessage message={fieldState.error?.message} />
        </div>
      )}
    />
  );
}

export default TextareaR;
