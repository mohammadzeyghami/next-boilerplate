import {
  Controller,
  useFormContext,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import SelectPrimary, { type SelectPrimaryProps } from "./primary";

type StrippedSelectProps = Omit<
  SelectPrimaryProps,
  "value" | "onChange" | "fieldError"
>;

export interface SelectRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends StrippedSelectProps {
  name: TName;
  rules?: RegisterOptions<TFieldValues, TName>;
}

function SelectR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, rules, ...props }: SelectRProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <SelectPrimary
          {...props}
          value={field.value ?? ""}
          onChange={field.onChange}
          fieldError={fieldState.error?.message}
        />
      )}
    />
  );
}

export default SelectR;
