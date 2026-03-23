import {
  Controller,
  useFormContext,
  type FieldValues,
  type FieldPath,
  type ControllerRenderProps,
  type ControllerFieldState,
  type RegisterOptions,
} from "react-hook-form";
import TextareaPrimary, { type TextareaPrimaryProps } from "./Primary";

type StrippedTextareaProps = Omit<
  TextareaPrimaryProps,
  "error" | "name" | "onChange" | "onBlur" | "value"
>;

export interface TextareaRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends StrippedTextareaProps {
  name: TName;
  rules?: RegisterOptions<TFieldValues, TName>;
}

function TextareaR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, rules, ...props }: TextareaRProps<TFieldValues, TName>) {
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
        <TextareaPrimary
          {...props}
          {...field}
          ref={field.ref}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default TextareaR;
