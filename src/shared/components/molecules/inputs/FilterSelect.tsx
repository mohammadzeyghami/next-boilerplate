import { cn } from "@/lib/utils";
import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../atoms/select";

type Option = { value: string; label: React.ReactNode };

export type FilterSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
  triggerClassName,
}: FilterSelectProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={cn("w-[130px]", triggerClassName)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
