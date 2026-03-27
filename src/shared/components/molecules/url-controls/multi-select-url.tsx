import MultiSelectR from "@/shared/components/molecules/inputs/MultiSelectR";
import type { SelectCreateConfig } from "@/shared/components/molecules/inputs/SelectPrimary";
import { useCallback, useEffect, useMemo } from "react";
import { FormProvider as RHFormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";

type Option = { value: string; label: React.ReactNode };

type MultiSelectUrlProps = {
  /** Query string key to read/write. */
  param: string;
  /** Local fallback when the param is missing. */
  defaultValue?: string[];
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  errorMessage?: string;
  emptyLabel?: string;
  /** Optional side effect for consumers who still want the value. */
  onValueChange?: (value: string[]) => void;
  /** Enable search functionality */
  searchable?: boolean;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Callback for server-side search - if not provided, local search will be used */
  onSearch?: (query: string) => void;
  create?: SelectCreateConfig;
  autoMinWidth?: boolean;
};

export function MultiSelectUrl({
  param,
  defaultValue = [],
  options,
  placeholder,
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
}: MultiSelectUrlProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const value = useMemo(() => {
    // @ts-ignore
    const urlValue = searchParams.get(param);
    if (!urlValue) return defaultValue;
    return urlValue.split(",").filter(Boolean);
  }, [defaultValue, param, searchParams]);

  const form = useForm<{ urlValue: string[] }>({
    defaultValues: { urlValue: value },
  });

  useEffect(() => {
    form.setValue("urlValue", value, {
      shouldDirty: false,
      shouldValidate: false,
      shouldTouch: false,
    });
  }, [form, value]);

  const handleChange = useCallback(
    (nextValue: string[]) => {
      const filteredNextValue = nextValue.filter(Boolean);
      const currentValue = value.filter(Boolean).join(",");
      const newValue = filteredNextValue.join(",");

      if (newValue === currentValue) return;

      onValueChange?.(filteredNextValue);

      // @ts-ignore
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        if (!filteredNextValue || filteredNextValue.length === 0) {
          sp.delete(param);
        } else {
          sp.set(param, filteredNextValue.join(","));
        }
        return sp;
      });
    },
    [onValueChange, param, setSearchParams, value]
  );

  useEffect(() => {
    const subscription = form.watch((formValues, { name }) => {
      if (name !== "urlValue") return;
      const values = formValues.urlValue ?? [];
      const filtered = Array.isArray(values)
        ? values.filter((v): v is string => Boolean(v))
        : [];
      handleChange(filtered);
    });
    return () => subscription.unsubscribe();
  }, [form, handleChange]);

  return (
    <RHFormProvider {...form}>
      <MultiSelectR
        name="urlValue"
        options={options}
        placeholder={placeholder}
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
