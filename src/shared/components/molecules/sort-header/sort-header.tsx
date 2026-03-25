import { cn } from "@/lib/utils";
import { Button, Label } from "@/Shared";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from "lucide-react";
import type { ReactNode } from "react";

export type SortOrder = "ASC" | "DESC";

type SortHeaderProps<TKey extends string> = {
  label: ReactNode;
  sortKey: TKey;
  activeSortBy: TKey | "";
  activeSortOrder: SortOrder | "";
  onChange: (sortBy: TKey | "", sortOrder: SortOrder | "") => void;
  className?: string;
  labelClassName?: string;
  iconClassName?: string;
};

/**
 * Click cycles:
 *   no sort → ASC → DESC → no sort
 */
export function SortHeader<TKey extends string>({
  label,
  sortKey,
  activeSortBy,
  activeSortOrder,
  onChange,
  className,
  labelClassName,
  iconClassName,
}: SortHeaderProps<TKey>) {
  const isActive = activeSortBy === sortKey;

  const handleClick = () => {
    if (!isActive) {
      onChange(sortKey, "ASC");
      return;
    }

    if (activeSortOrder === "ASC") {
      onChange(sortKey, "DESC");
      return;
    }

    onChange("", "");
  };

  const icon = !isActive ? (
    <ArrowUpDownIcon
      className={cn("ml-1 size-3.5 text-muted-foreground", iconClassName)}
    />
  ) : activeSortOrder === "ASC" ? (
    <ArrowUpIcon className={cn("ml-1 size-3.5", iconClassName)} />
  ) : (
    <ArrowDownIcon className={cn("ml-1 size-3.5", iconClassName)} />
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center h-auto px-0 text-xs font-medium",
        "hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
        className
      )}
    >
      <Label className={cn("cursor-pointer", labelClassName)}>{label}</Label>
      {icon}
    </Button>
  );
}
