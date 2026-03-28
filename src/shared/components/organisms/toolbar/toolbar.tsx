import { cn } from "@/lib/utils";
import {

  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/molecules/tooltip";
import {
  PanelLeftIcon,
  SlidersHorizontalIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import InputPrimary from "../../molecules/inputs/Primary";
import { Separator } from "../../atoms/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../molecules/sheet";
import { Button } from "../../atoms/button";

type WithChildren<T = unknown> = T & { children?: React.ReactNode };

function Toolbar({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="toolbar"
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md bg-card p-2 shadow-sm ring-1 ring-border",
        "md:p-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/* Zones -------------------------------------------------------------------- */

function ToolbarLeft({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="toolbar-left"
      className={cn("flex min-w-0 items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

function ToolbarRight({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="toolbar-right"
      className={cn("ml-auto flex items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

/* Search ------------------------------------------------------------------- */

type SearchProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  debounceMs?: number;
};

function ToolbarSearch({
  value,
  defaultValue,
  onChange,
  placeholder = "Search…",
  className,
  inputClassName,
  debounceMs = 250,
}: SearchProps) {
  const isControlled = value !== undefined;

  // internal source of truth
  const [internal, setInternal] = React.useState<string>(
    value ?? defaultValue ?? ""
  );

  // keep internal in sync when value prop changes (controlled mode)
  React.useEffect(() => {
    if (!isControlled) return;
    setInternal(value ?? "");
  }, [isControlled, value]);

  // debounce calls to parent onChange based on internal state
  React.useEffect(() => {
    if (!onChange) return;
    const id = window.setTimeout(() => onChange(internal), debounceMs);
    return () => window.clearTimeout(id);
  }, [internal, onChange, debounceMs]);

  return (
    <div
      data-slot="toolbar-search"
      className={cn(
        "group relative flex items-center rounded-md ring-1 ring-input bg-background",
        "focus-within:ring-ring/80 focus-within:outline-none",
        "transition-[box-shadow] focus-within:shadow-sm",
        className
      )}
    >
      <InputPrimary 
      value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        
        className={cn(
          "h-9 w-[180px] truncate bg-transparent px-2 py-1 text-sm outline-none md:w-[240px] lg:w-[300px]",
          inputClassName
        )}
        aria-label="Search"/>
    
      {internal ? (
        <button
          type="button"
          onClick={() => setInternal("")}
          className="mr-1 inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
          aria-label="Clear search"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}

/* Filters (desktop inline) + Mobile as Sheet -------------------------------- */

function ToolbarFilters({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  if (!children) return null;
  return (
    <div
      data-slot="toolbar-filters"
      className={cn("hidden items-center gap-2 md:flex", className)}
    >
      <Separator orientation="vertical" className="mx-1 hidden h-6 md:block" />
      {children}
    </div>
  );
}

function ToolbarFiltersMobile({
  className,
  children,
  title = "Filters",
}: WithChildren<{ className?: string; title?: string }>) {
  if (!children) return null;

  return (
    <Sheet>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <SheetTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className={cn("md:hidden", className)}
              >
                <SlidersHorizontalIcon className="mr-1 size-4" />
                {title}
              </Button>
            </SheetTrigger>
          </TooltipTrigger>
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SheetContent side="left" className="w-[88vw] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-3">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

/* Actions ------------------------------------------------------------------ */

function ToolbarActions({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  if (!children) return null;
  return (
    <div
      data-slot="toolbar-actions"
      className={cn("flex items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

/* Kicker (optional leading icon / label) ----------------------------------- */

function ToolbarKicker({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  if (!children) return null;
  return (
    <div
      data-slot="toolbar-kicker"
      className={cn(
        "hidden items-center gap-2 text-sm text-muted-foreground md:flex",
        className
      )}
    >
      <PanelLeftIcon className="size-4" />
      {children}
      <Separator orientation="vertical" className="mx-1 h-6" />
    </div>
  );
}

/* Attach compound parts to main -------------------------------------------- */

Toolbar.Left = ToolbarLeft;
Toolbar.Right = ToolbarRight;
Toolbar.Search = ToolbarSearch;
Toolbar.Filters = ToolbarFilters;
Toolbar.FiltersMobile = ToolbarFiltersMobile;
Toolbar.Actions = ToolbarActions;
Toolbar.Kicker = ToolbarKicker;

export { Toolbar };
