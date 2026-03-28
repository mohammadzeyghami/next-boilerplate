import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import {
  IdPicker,
  type IdPickerItem,
  type IdPickerProps,
  type IdPickerValue,
} from "./IdPicker";

export interface IdPickerRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TItem extends IdPickerItem = IdPickerItem
> {
  name: TName;
  rules?: RegisterOptions<TFieldValues, TName>;
  multiple?: boolean;
  picker: Omit<IdPickerProps<TItem>, "value" | "onChange" | "multiple">;
}

export function IdPickerR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TItem extends IdPickerItem = IdPickerItem
>({ name, rules, multiple = false, picker }: IdPickerRProps<TFieldValues, TName, TItem>) {
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
        <IdPicker<TItem>
          {...picker}
          multiple={multiple}
          value={field.value as unknown as IdPickerValue}
          onChange={field.onChange}
          errorMessage={fieldState.error?.message ?? null}
        />
      )}
    />
  );
}
