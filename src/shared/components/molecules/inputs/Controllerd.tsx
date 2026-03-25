import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import InputPrimary, { type InputPrimaryProps } from "./Primary";

type StrippedInputProps = Omit<
  InputPrimaryProps,
  "error" | "name" | "onChange" | "onBlur" | "value"
>;

export interface InputRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends StrippedInputProps {
  name: TName;
  rules?: RegisterOptions<TFieldValues, TName>;
}

function InputR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, rules, ...props }: InputRProps<TFieldValues, TName>) {
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
        <InputPrimary
          {...props}
          {...field}
          ref={field.ref}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export default InputR;
