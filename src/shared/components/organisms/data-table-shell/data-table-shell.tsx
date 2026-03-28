"use client";

// src/Shared/components/organisms/data-table-shell/data-table-shell.tsx
import { cn } from "@/lib/utils";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { dateConverter, isValidDate } from "@/shared/utils/date";
import { SlidersHorizontalIcon } from "lucide-react";
import type { SelectCreateConfig } from "../../molecules/inputs/SelectPrimary";
import { InputUrl } from "../../molecules/url-controls/input-url";
import { SelectUrl } from "../../molecules/url-controls/select-url";
import { MultiSelectUrl } from "../../molecules/url-controls/multi-select-url";
import { Toolbar } from "../toolbar";
import { Button } from "../../atoms/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../molecules/sheet";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../molecules/table/Table";
import { SortHeader, type SortOrder } from "../../molecules/sort-header";
import { toast } from "../../atoms/toast/toast-store";
import { ServerPagination } from "../../molecules/pagination/ServerPagination";
import { Separator } from "../../atoms/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../molecules/tooltip";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

// Column meta configuration
type ColumnMeta = {
  /**
   * Automatically format date values.
   * - `true` or `"en-GB"`: Use default locale format (en-GB)
   * - Custom locale string (e.g., "fa-IR", "en-US"): Use specified locale
   */
  dateFormat?: string | boolean;
  /** Disable click-to-copy behavior for this column. */
  disableCopy?: boolean;
  /**
   * Truncate text and show tooltip on hover.
   * - `undefined`: Use table's default truncation setting
   * - `false`: Disable truncation for this column
   * - `true`: Use default character limit (50)
   * - `number`: Use custom character limit
   */
  truncate?: number | boolean;
};

// Filter configuration types
type FilterConfig = {
  type:
    | "search"
    | "button"
    | "custom"
    | "inputUrl"
    | "selectUrl"
    | "multiSelectUrl";
  key: string;
  label?: string;
  placeholder?: string;
  /** Debounce delay (ms) for url-bound filters. */
  debounceMs?: number;
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  onClick?: () => void;
  render?: (
    value: unknown,
    onChange: (value: unknown) => void,
  ) => React.ReactNode;
  className?: string;
  defaultValue?: string | string[];
  options?: { value: string; label: React.ReactNode }[];
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  errorMessage?: string;
  emptyLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  create?: SelectCreateConfig;
};

type ToolbarConfig = {
  filters?: FilterConfig[];
  actions?: React.ReactNode;
  onFiltersChange?: (filters: Record<string, unknown>) => void;
  /** Optional whitelist for the default toolbar to render filters by key. */
  visibleFilters?: string[];
};

type CustomTableToolbar<TProps> =
  | React.ReactNode
  | {
      component: React.ComponentType<TProps>;
      props: TProps;
    };

type DataTableShellProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  /** Toolbar configuration with filters and actions */
  toolbar?: ToolbarConfig;
  /** Custom toolbar component override - when provided, ignores default toolbar config */
  customToolbar?: React.ReactNode;
  /** Optional initial filter values (e.g., from URL) */
  initialFilters?: Record<string, unknown>;
  /** Optional message when there are no rows. */
  emptyMessage?: React.ReactNode;
  /** Controlled page size (default 10). */
  initialPageSize?: number;
  /** Allow row selection (checkbox column must be in your columns). */
  enableRowSelection?: boolean;
  /** Optional caption below the table. */
  caption?: React.ReactNode;
  /** Controlled sorting (set manualSorting when fetching server-side). */
  sorting?: SortingState;
  /** Controlled sorting change handler. */
  onSortingChange?: OnChangeFn<SortingState>;
  /** If true, disables client-side sorting and delegates to caller. */
  manualSorting?: boolean;
  /** If true, synchronizes sorting state with URL query parameters. */
  enableUrlSorting?: boolean;
  serverPagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
  };
  /**
   * Default truncation setting for all cells.
   * - `undefined` or `false`: No default truncation
   * - `true`: Use default character limit (50)
   * - `number`: Use custom default character limit
   */
  defaultTruncate?: number | boolean;
};

// Helper component for truncated text with tooltip
function TruncatedCell({
  value,
  maxLength,
}: {
  value: string;
  maxLength: number;
}) {
  if (value.length <= maxLength) {
    return <>{value}</>;
  }

  const truncated = value.slice(0, maxLength) + "...";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default" data-full-value={value}>
          {truncated}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <p className="break-words whitespace-normal">{value}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function DataTableShell<TData, TValue>({
  columns: userColumns,
  data,
  className,
  toolbar,
  customToolbar,
  initialFilters,
  emptyMessage = "No results.",
  initialPageSize = 10,
  enableRowSelection = false,
  caption,
  sorting: controlledSorting,
  onSortingChange,
  manualSorting = false,
  enableUrlSorting = false,
  serverPagination,
  defaultTruncate = 30,
}: DataTableShellProps<TData, TValue>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [resetCounter, setResetCounter] = useState(0);
  const [filtersOverflow, setFiltersOverflow] = useState(false);
  const filtersInlineRef = useRef<HTMLDivElement | null>(null);

  const updateSearchParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      updater(params);

      const nextQuery = params.toString();
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      router.replace(nextUrl, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Process columns to add automatic date formatting and text truncation
  const columns = useMemo(() => {
    return userColumns.map((col) => {
      const meta = col.meta as ColumnMeta | undefined;

      const getTruncateSettings = () => {
        const columnTruncate = meta?.truncate;

        if (columnTruncate === false) {
          return { shouldTruncate: false, maxLength: 50 };
        }

        if (columnTruncate !== undefined) {
          return {
            shouldTruncate: true,
            maxLength: typeof columnTruncate === "number" ? columnTruncate : 50,
          };
        }

        if (defaultTruncate) {
          return {
            shouldTruncate: true,
            maxLength:
              typeof defaultTruncate === "number" ? defaultTruncate : 50,
          };
        }

        return { shouldTruncate: false, maxLength: 50 };
      };

      const { shouldTruncate, maxLength } = getTruncateSettings();

      const processChildren = (children: React.ReactNode): React.ReactNode => {
        if (!shouldTruncate) return children;

        return React.Children.map(children, (child) => {
          if (typeof child === "string") {
            return <TruncatedCell value={child} maxLength={maxLength} />;
          }

          if (typeof child === "number") {
            return child;
          }

          if (React.isValidElement(child)) {
            const childProps = child.props as { children?: React.ReactNode };

            if (childProps.children) {
              const props =
                typeof child.props === "object" && child.props !== null
                  ? {
                      ...child.props,
                      children: processChildren(childProps.children),
                    }
                  : { children: processChildren(childProps.children) };

              return React.cloneElement(
                child as React.ReactElement<any>,
                props as any,
              );
            }
          }

          return child;
        });
      };

      if (col.cell) {
        const originalCell = col.cell;

        return {
          ...col,
          cell: (props: any) => {
            const rendered =
              typeof originalCell === "function"
                ? originalCell(props)
                : originalCell;

            return processChildren(rendered);
          },
        };
      }

      return {
        ...col,
        cell: ({ getValue }: { getValue: () => unknown }) => {
          let value = getValue();
          const isDateLike =
            value instanceof Date ||
            (typeof value === "string" && isValidDate(value));

          if (isDateLike) {
            const locale =
              meta?.dateFormat && typeof meta.dateFormat === "string"
                ? meta.dateFormat
                : "en-GB";

            value = dateConverter(value as string | Date, {
              locale,
            });
          }

          if (shouldTruncate && typeof value === "string") {
            return <TruncatedCell value={value} maxLength={maxLength} />;
          }

          return value as React.ReactNode;
        },
      };
    });
  }, [userColumns, defaultTruncate]);

  // Internal filter state
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>(
    initialFilters ?? {},
  );

  const toolbarFilters = useMemo(() => {
    const allowedKeys = toolbar?.visibleFilters
      ? new Set(toolbar.visibleFilters)
      : null;
    const allFilters = toolbar?.filters ?? [];

    if (!allowedKeys) return allFilters;

    return allFilters.filter((filter) => allowedKeys.has(filter.key));
  }, [toolbar]);

  const filterKeys = useMemo(
    () => toolbarFilters.map((f) => f.key),
    [toolbarFilters],
  );
  const hasFilters = filterKeys.length > 0;

  // Keep internal filter state in sync with provided initial filters (e.g., URL changes)
  useEffect(() => {
    if (!initialFilters) return;

    setFilterValues((prev) => {
      const allKeys = new Set([
        ...Object.keys(prev),
        ...Object.keys(initialFilters),
      ]);

      for (const key of allKeys) {
        if (prev[key] !== initialFilters[key]) {
          return initialFilters;
        }
      }

      return prev;
    });
  }, [initialFilters]);

  const urlSorting = useMemo<SortingState>(() => {
    if (!enableUrlSorting) return [];

    const sort = searchParams.get("sort");
    const order = searchParams.get("order");

    if (sort) {
      return [{ id: sort, desc: order === "DESC" }];
    }

    return [];
  }, [searchParams, enableUrlSorting]);

  const sortingState =
    controlledSorting ?? (enableUrlSorting ? urlSorting : sorting);

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (onSortingChange) {
      onSortingChange(updater);
    }

    if (enableUrlSorting) {
      const nextSorting =
        typeof updater === "function" ? updater(sortingState) : updater;

      updateSearchParams((params) => {
        if (nextSorting.length === 0) {
          params.delete("sort");
          params.delete("order");
          return;
        }

        const { id, desc } = nextSorting[0];
        const currentSort = params.get("sort");
        const currentOrder = params.get("order");
        const newOrder = desc ? "DESC" : "ASC";

        if (currentSort === id && currentOrder === newOrder) {
          return;
        }

        params.set("sort", id);
        params.set("order", newOrder);
      });
    } else {
      setSorting(updater);
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: sortingState,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection,
    manualSorting: manualSorting || enableUrlSorting,
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: {
      enableSorting: false,
    },
    initialState: {
      pagination: { pageSize: initialPageSize },
    },
  });

  // Notify parent when filter values change
  useEffect(() => {
    if (!toolbar?.onFiltersChange) {
      return;
    }

    toolbar.onFiltersChange(filterValues);
  }, [filterValues, toolbar]);

  // Update filter value
  const handleFilterChange = (key: string, value: unknown) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = useCallback(() => {
    if (!hasFilters) return;

    setFilterValues(() => {
      return toolbarFilters.reduce<Record<string, unknown>>((acc, filter) => {
        acc[filter.key] = filter.type === "multiSelectUrl" ? [] : "";
        return acc;
      }, {});
    });

    updateSearchParams((params) => {
      filterKeys.forEach((key) => params.delete(key));
    });

    setResetCounter((count) => count + 1);
  }, [filterKeys, hasFilters, toolbarFilters, updateSearchParams]);

  useLayoutEffect(() => {
    if (!hasFilters) {
      setFiltersOverflow(false);
      return;
    }

    const el = filtersInlineRef.current;
    if (!el) return;

    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 1;
      setFiltersOverflow(hasOverflow);
    };

    update();

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => update());
      observer.observe(el);
    }

    window.addEventListener("resize", update);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [hasFilters, toolbarFilters, resetCounter]);

  // Render toolbar filters
  const renderFilters = () => {
    if (!toolbar || toolbarFilters.length === 0) return null;

    const inputUrlFilters = toolbarFilters.filter((f) => f.type === "inputUrl");
    const selectUrlFilters = toolbarFilters.filter(
      (f) => f.type === "selectUrl",
    );
    const multiSelectUrlFilters = toolbarFilters.filter(
      (f) => f.type === "multiSelectUrl",
    );

    const renderFilterControls = (variant: "inline" | "sheet") => {
      const wrapperClass = variant === "inline" ? "shrink-0" : "w-full";

      return (
        <>
          {inputUrlFilters.map((filter) => (
            <div
              className={wrapperClass}
              key={`${variant}-${filter.key}-${resetCounter}`}
            >
              <InputUrl
                param={filter.key}
                placeholder={filter.placeholder}
                defaultValue={
                  (filter.defaultValue ??
                    filterValues[filter.key] ??
                    "") as string
                }
                className={
                  variant === "sheet"
                    ? cn("w-full", filter.className)
                    : filter.className
                }
                debounceMs={filter.debounceMs}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              />
            </div>
          ))}

          {selectUrlFilters.map((filter) => (
            <div
              className={wrapperClass}
              key={`${variant}-${filter.key}-${resetCounter}`}
            >
              <SelectUrl
                param={filter.key}
                options={filter.options ?? []}
                placeholder={filter.placeholder}
                defaultValue={
                  (filter.defaultValue ??
                    filterValues[filter.key] ??
                    "") as string
                }
                disabled={filter.disabled}
                isLoading={filter.isLoading}
                loadingLabel={filter.loadingLabel}
                errorMessage={filter.errorMessage}
                emptyLabel={filter.emptyLabel}
                searchable={filter.searchable}
                searchPlaceholder={filter.searchPlaceholder}
                onSearch={filter.onSearch}
                debounceMs={filter.debounceMs}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
                create={filter.create}
              />
            </div>
          ))}

          {multiSelectUrlFilters.map((filter) => (
            <div
              className={wrapperClass}
              key={`${variant}-${filter.key}-${resetCounter}`}
            >
              <MultiSelectUrl
                param={filter.key}
                options={filter.options ?? []}
                placeholder={filter.placeholder}
                defaultValue={
                  (filter.defaultValue ??
                    filterValues[filter.key] ??
                    []) as string[]
                }
                disabled={filter.disabled}
                isLoading={filter.isLoading}
                loadingLabel={filter.loadingLabel}
                errorMessage={filter.errorMessage}
                emptyLabel={filter.emptyLabel}
                searchable={filter.searchable}
                searchPlaceholder={filter.searchPlaceholder}
                onSearch={filter.onSearch}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
                create={filter.create}
              />
            </div>
          ))}
        </>
      );
    };

    return (
      <>
        <div
          ref={filtersInlineRef}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        >
          {inputUrlFilters.map((filter) => (
            <div
              key={`${filter.key}-${resetCounter}`}
              className="min-w-[140px] shrink-0"
            >
              <InputUrl
                param={filter.key}
                placeholder={filter.placeholder}
                defaultValue={
                  (filter.defaultValue ??
                    filterValues[filter.key] ??
                    "") as string
                }
                className={cn("w-full min-w-0", filter.className)}
                debounceMs={filter.debounceMs}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              />
            </div>
          ))}

          {selectUrlFilters.map((filter) => (
            <div
              key={`${filter.key}-${resetCounter}`}
              className="min-w-[140px] shrink-0"
            >
              <SelectUrl
                param={filter.key}
                options={filter.options ?? []}
                placeholder={filter.placeholder}
                defaultValue={
                  (filter.defaultValue ??
                    filterValues[filter.key] ??
                    "") as string
                }
                disabled={filter.disabled}
                isLoading={filter.isLoading}
                loadingLabel={filter.loadingLabel}
                errorMessage={filter.errorMessage}
                emptyLabel={filter.emptyLabel}
                searchable={filter.searchable}
                searchPlaceholder={filter.searchPlaceholder}
                onSearch={filter.onSearch}
                debounceMs={filter.debounceMs}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
                create={filter.create}
              />
            </div>
          ))}

          {multiSelectUrlFilters.map((filter) => (
            <div
              key={`${filter.key}-${resetCounter}`}
              className="min-w-[140px] shrink-0"
            >
              <MultiSelectUrl
                param={filter.key}
                options={filter.options ?? []}
                placeholder={filter.placeholder}
                defaultValue={
                  (filter.defaultValue ??
                    filterValues[filter.key] ??
                    []) as string[]
                }
                disabled={filter.disabled}
                isLoading={filter.isLoading}
                loadingLabel={filter.loadingLabel}
                errorMessage={filter.errorMessage}
                emptyLabel={filter.emptyLabel}
                searchable={filter.searchable}
                searchPlaceholder={filter.searchPlaceholder}
                onSearch={filter.onSearch}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
                create={filter.create}
              />
            </div>
          ))}
        </div>

        {hasFilters && (
          <>
            <Toolbar.Filters>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetFilters}
              >
                Reset filters
              </Button>
            </Toolbar.Filters>

            <Toolbar.FiltersMobile title="Filters">
              <Button variant="secondary" onClick={handleResetFilters}>
                Reset filters
              </Button>
            </Toolbar.FiltersMobile>
          </>
        )}

        {filtersOverflow ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="sm" className="shrink-0">
                <SlidersHorizontalIcon className="mr-1 size-4" />
                More filters
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[88vw] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle>More filters</SheetTitle>
              </SheetHeader>

              <div className="mt-4 flex flex-col gap-3">
                {renderFilterControls("sheet")}
                <Button variant="secondary" onClick={handleResetFilters}>
                  Reset filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        ) : null}
      </>
    );
  };

  const renderToolbar = () => {
    if (customToolbar) {
      return customToolbar;
    }

    if (!toolbar) return null;

    return (
      <Toolbar>
        <Toolbar.Left className="min-w-0 flex-1">
          {renderFilters()}
        </Toolbar.Left>

        {toolbar.actions && (
          <Toolbar.Right>
            <Toolbar.Actions>{toolbar.actions}</Toolbar.Actions>
          </Toolbar.Right>
        )}
      </Toolbar>
    );
  };

  return (
    <div
      data-slot="data-table-shell"
      className={cn("w-full space-y-2", className)}
    >
      {renderToolbar()}

      <div className="rounded-md border">
        <Table>
          {caption ? <TableCaption>{caption}</TableCaption> : null}

          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const isSorted = header.column.getIsSorted();
                  const columnId = header.column.id;

                  if (canSort) {
                    const headerContent = flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    );

                    const handleSortChange = (
                      _: string,
                      sortOrder: SortOrder | "",
                    ) => {
                      table.setSorting((prev) => {
                        const next = prev.filter(
                          (item) => item.id !== columnId,
                        );

                        if (!sortOrder) return next;

                        return [
                          ...next,
                          { id: columnId, desc: sortOrder === "DESC" },
                        ];
                      });
                    };

                    return (
                      <TableHead key={header.id}>
                        <SortHeader
                          label={headerContent}
                          sortKey={columnId}
                          activeSortBy={isSorted ? columnId : ""}
                          activeSortOrder={
                            isSorted === "asc"
                              ? "ASC"
                              : isSorted === "desc"
                                ? "DESC"
                                : ""
                          }
                          onChange={handleSortChange}
                        />
                      </TableHead>
                    );
                  }

                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const columnMeta = cell.column.columnDef.meta as
                      | ColumnMeta
                      | undefined;

                    const isCopyDisabled =
                      columnMeta?.disableCopy || cell.column.id === "actions";

                    const handleCellClick = async (
                      e: React.MouseEvent<HTMLTableCellElement>,
                    ) => {
                      if (isCopyDisabled) return;

                      const truncatedElement =
                        e.currentTarget.querySelector("[data-full-value]");

                      const textContent = truncatedElement
                        ? (truncatedElement as HTMLElement).getAttribute(
                            "data-full-value",
                          ) || ""
                        : e.currentTarget.textContent || "";

                      if (textContent) {
                        try {
                          await navigator.clipboard.writeText(textContent);

                          toast({
                            title: "Copied!",
                            description: "Content copied to clipboard!",
                            variant: "default",
                          });
                        } catch (err) {
                          console.error("Failed to copy text:", err);

                          toast({
                            title: "Error",
                            description: "Failed to copy text",
                            variant: "destructive",
                          });
                        }
                      }
                    };

                    return (
                      <TableCell
                        key={cell.id}
                        onClick={isCopyDisabled ? undefined : handleCellClick}
                        className={cn(
                          "transition-colors",
                          isCopyDisabled
                            ? undefined
                            : "cursor-pointer hover:bg-muted/50",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-1">
        {serverPagination ? (
          <>
            <div className="text-xs text-muted-foreground">
              {`Page ${serverPagination.currentPage} of ${serverPagination.totalPages}`}
            </div>

            <ServerPagination
              currentPage={serverPagination.currentPage}
              totalPages={serverPagination.totalPages}
              onPageChange={serverPagination.onPageChange}
            />
          </>
        ) : (
          <>
            <div className="text-xs text-muted-foreground">
              {table.getFilteredRowModel().rows.length} result(s)
              <Separator
                orientation="vertical"
                className="mx-2 inline-block h-3 align-middle"
              />
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export { DataTableShell, TruncatedCell };
export type { ColumnMeta, CustomTableToolbar, FilterConfig, ToolbarConfig };