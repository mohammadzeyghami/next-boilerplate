import { useCallback, useEffect, useMemo } from "react";
import { FormProvider as RHFormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import SelectR from "../inputs/SelectR";
import type { SelectCreateConfig } from "../inputs/SelectPrimary";

type Option = { value: string; label: React.ReactNode };

type SelectUrlProps = {
  /** Query string key to read/write. */
  param: string;
  /** Local fallback when the param is missing. */
  defaultValue?: string;
  options: Option[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  errorMessage?: string;
  emptyLabel?: string;
  /** Optional side effect for consumers who still want the value. */
  onValueChange?: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  /** Legacy prop (ignored): SelectUrl now syncs immediately without debouncing. */
  debounceMs?: number;
  create?: SelectCreateConfig;
  autoMinWidth?: boolean;
};

export function SelectUrl({
  param,
  defaultValue = "",
  options,
  placeholder,
  className,
  disabled,
  isLoading,
  loadingLabel,
  errorMessage,
  emptyLabel,
  onValueChange,
  searchable = false,
  searchPlaceholder,
  onSearch,
  create,
  autoMinWidth = true,
}: SelectUrlProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const paramValue = searchParams.get(param);
  const value = useMemo(() => paramValue ?? defaultValue, [defaultValue, paramValue]);

  const form = useForm<{ urlValue: string }>({
    defaultValues: { urlValue: value },
  });

  useEffect(() => {
    const current = form.getValues("urlValue");
    if (current === value) return;

    form.setValue("urlValue", value, {
      shouldDirty: false,
      shouldValidate: false,
      shouldTouch: false,
    });
  }, [form, value]);

  const handleChange = useCallback(
    (nextValue: string) => {
      if (nextValue === value) return;

      onValueChange?.(nextValue);

      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        if (!nextValue) {
          sp.delete(param);
        } else {
          sp.set(param, nextValue);
        }
        return sp;
      });
    },
    [onValueChange, param, setSearchParams, value]
  );

  useEffect(() => {
    const subscription = form.watch((formValues, { name }) => {
      if (name !== "urlValue") return;
      handleChange(formValues.urlValue ?? "");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [form, handleChange]);

  return (
    <RHFormProvider {...form}>
      <SelectR
        name="urlValue"
        options={options}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        isLoading={isLoading}
        loadingLabel={loadingLabel}
        errorMessage={errorMessage}
        emptyLabel={emptyLabel}
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        create={create}
        autoMinWidth={autoMinWidth}
      />
    </RHFormProvider>
  );
}
