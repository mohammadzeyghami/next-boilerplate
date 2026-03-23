import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/share-components/atoms/select/Default";
import { Input } from "@/share-components/molecules/inputs/Default";
import LabelPrimary from "@/share-components/molecules/label/Primary";
import * as React from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface PrimarySelectProps {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  triggerClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const PrimarySelect: React.FC<PrimarySelectProps> = ({
  options,
  placeholder = "Select an option",
  label,
  value,
  onChange,
  triggerClassName = "",
  contentClassName = "",
  itemClassName = "",
  labelClassName = "",
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
}) => {
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  return (
    <Select
      onValueChange={onChange}
      value={value}
      disabled={disabled}
      onOpenChange={(open) => {
        if (open && searchable) {
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        } else {
          setSearch("");
        }
      }}
    >
      <SelectTrigger className={cn(`w-full `, triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {label && (
          <LabelPrimary className={labelClassName}>{label}</LabelPrimary>
        )}
        {searchable && (
          <div className="p-2">
            <Input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full"
            />
          </div>
        )}
        <SelectGroup>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={itemClassName}
              >
                {opt.label}
              </SelectItem>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No results found</div>
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
