import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";

import SelectPrimary, {
  type Option,
  type SelectPrimaryProps,
} from "./SelectPrimary";

export interface SelectRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: SelectPrimaryProps["label"];
  required?: SelectPrimaryProps["required"];
  placeholder?: SelectPrimaryProps["placeholder"];
  options: Option[];
  rules?: RegisterOptions<TFieldValues, TName>;
  className?: SelectPrimaryProps["className"];
  disabled?: SelectPrimaryProps["disabled"];
  isLoading?: SelectPrimaryProps["isLoading"];
  loadingLabel?: SelectPrimaryProps["loadingLabel"];
  errorMessage?: SelectPrimaryProps["errorMessage"];
  emptyLabel?: SelectPrimaryProps["emptyLabel"];
  searchable?: SelectPrimaryProps["searchable"];
  searchPlaceholder?: SelectPrimaryProps["searchPlaceholder"];
  onSearch?: SelectPrimaryProps["onSearch"];
  create?: SelectPrimaryProps["create"];
  autoMinWidth?: SelectPrimaryProps["autoMinWidth"];
}

function SelectR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  required,
  placeholder,
  options,
  rules,
  className,
  disabled,
  isLoading,
  loadingLabel,
  errorMessage,
  emptyLabel,
  searchable,
  searchPlaceholder,
  onSearch,
  create,
  autoMinWidth,
}: SelectRProps<TFieldValues, TName>) {
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
        <SelectPrimary
          label={label}
          required={required}
          placeholder={placeholder}
          options={options}
          className={className}
          disabled={disabled}
          isLoading={isLoading}
          loadingLabel={loadingLabel}
          errorMessage={errorMessage}
          emptyLabel={emptyLabel}
          value={field.value ?? ""}
          onChange={field.onChange}
          fieldError={fieldState.error?.message}
          searchable={searchable}
          searchPlaceholder={searchPlaceholder}
          onSearch={onSearch}
          create={create}
          autoMinWidth={autoMinWidth}
        />
      )}
    />
  );
}

export default SelectR;
