import {

  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/molecules/popover";
import * as React from "react";
import { useState, useMemo, useEffect } from "react";
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
import { Button } from "../../atoms/button";
import { ScrollArea } from "../../atoms/scroll-area";
import { Input } from "../../atoms/input";
import { Checkbox } from "../check-box/Default";

type Option = {
  value: string;
  label: React.ReactNode;
};

export interface MultiSelectCheckboxRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  placeholder?: string;
  options: Option[];
  rules?: RegisterOptions<TFieldValues, TName>;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  emptyText?: string;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

function MultiSelectCheckboxR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  placeholder = "Select items",
  options,
  rules,
  required,
  className,
  disabled,
  loading = false,
  loadingText = "Loading...",
  emptyText = "No options available.",
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
}: MultiSelectCheckboxRProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const [searchQuery, setSearchQuery] = useState("");

  // Handle server-side search
  useEffect(() => {
    if (searchable && onSearch) {
      onSearch(searchQuery);
    }
  }, [searchQuery, searchable, onSearch]);

  // Handle local search - filter options if onSearch is not provided
  const filteredOptions = useMemo(() => {
    if (!searchable || onSearch) {
      return options;
    }

    if (!searchQuery.trim()) {
      return options;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const labelText = typeof opt.label === "string" ? opt.label : String(opt.label);
      return (
        labelText.toLowerCase().includes(lowerQuery) ||
        opt.value.toLowerCase().includes(lowerQuery)
      );
    });
  }, [options, searchQuery, searchable, onSearch]);

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
      }) => {
        const selected: string[] = (field.value as string[] | undefined) ?? [];

        const toggleValue = (id: string) => {
          const next = selected.includes(id)
            ? selected.filter((x) => x !== id)
            : [...selected, id];

          field.onChange(next);
        };

        return (
          <div className={className}>
            {label ? (
              <LabelPrimary required={required}>{label}</LabelPrimary>
            ) : null}

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-w-[200px] justify-between"
                  disabled={disabled}
                  aria-invalid={!!fieldState.error}
                >
                  <span className="truncate">
                    {selected.length
                      ? `${selected.length} selected`
                      : placeholder}
                  </span>
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-72 p-2" align="start">
                {searchable && (
                  <div className="pb-2">
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                {loading ? (
                  <div className="p-2 text-xs text-muted-foreground">
                    {loadingText}
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">
                    {searchQuery && searchable ? "No results found" : emptyText}
                  </div>
                ) : (
                  <ScrollArea className="h-60 pr-2">
                    <div className="space-y-1">
                      {filteredOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleValue(opt.value)}
                          className="flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-xs hover:bg-accent"
                        >
                          <Checkbox
                            checked={selected.includes(opt.value)}
                            className="h-3 w-3"
                            onCheckedChange={() => toggleValue(opt.value)}
                          />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </PopoverContent>
            </Popover>
          </div>
        );
      }}
    />
  );
}

export default MultiSelectCheckboxR;
