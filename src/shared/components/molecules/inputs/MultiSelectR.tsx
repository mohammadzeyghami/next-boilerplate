
import {
  Controller,
  useFormContext,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
  type RegisterOptions,
} from "react-hook-form";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SelectCreateConfig } from "./SelectPrimary";
import { GlobeIcon, ListFilterIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import LabelPrimary from "../label/Primary";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/molecules/dropdown-menu";
import ErrorMessage from "../../atoms/typography/ErrorMessage";
import { SimpleModal } from "@/shared/components/organisms/modal-shell";
import { Button } from "@/shared/components/atoms/button";
import { Input } from "@/shared/components/atoms/input";
import { Separator } from "@/shared/components/atoms/separator";
import { useSearchFilter } from "@/shared/components/hooks/useSearchFilter";

type Option = {
  value: string;
  label: React.ReactNode;
};

export interface MultiSelectRProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  placeholder?: string;
  options: Option[];
  rules?: RegisterOptions<TFieldValues, TName>;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  errorMessage?: string | null;
  emptyLabel?: string;
  required?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  create?: SelectCreateConfig;
  autoMinWidth?: boolean;
}

function MultiSelectR<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label,
  placeholder,
  options,
  rules,
  disabled,
  isLoading,
  loadingLabel,
  errorMessage,
  emptyLabel,
  required,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  create,
  autoMinWidth = false,
}: MultiSelectRProps<TFieldValues, TName>) {
  const { control } = useFormContext<TFieldValues>();
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialValue, setCreateInitialValue] = useState<string | undefined>();
  const [editState, setEditState] = useState<{ open: boolean; id: string }>({
    open: false,
    id: "",
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string;
    label: string;
    deleting: boolean;
  }>({ open: false, id: "", label: "", deleting: false });
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [createdOptions, setCreatedOptions] = useState<Option[]>([]);
  const [editedLabels, setEditedLabels] = useState<Record<string, string>>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>();
  const [localSearchEnabled, setLocalSearchEnabled] = useState(true);
  const hasRemoteSearch = typeof onSearch === "function";
  const { search: searchQuery, setSearch: setSearchQuery } = useSearchFilter({
    enabled: searchable,
    onSearch: hasRemoteSearch && !localSearchEnabled ? onSearch : undefined,
  });

  const mergedOptions = useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    options.forEach((opt) => {
      if (deletedIds.has(opt.value)) return;
      map.set(opt.value, editedLabels[opt.value] ?? opt.label);
    });
    createdOptions.forEach((opt) => {
      if (deletedIds.has(opt.value)) return;
      map.set(opt.value, editedLabels[opt.value] ?? opt.label);
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [createdOptions, deletedIds, editedLabels, options]);

  const shouldLocalSearch = searchable && (localSearchEnabled || !hasRemoteSearch);

  // Handle local search when enabled
  const filteredOptions = useMemo(() => {
    if (!searchable || !shouldLocalSearch) {
      return mergedOptions;
    }

    if (!searchQuery.trim()) {
      return mergedOptions;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return mergedOptions.filter((opt) => {
      const labelText =
        typeof opt.label === "string" ? opt.label : String(opt.label);
      return (
        labelText.toLowerCase().includes(lowerQuery) ||
        opt.value.toLowerCase().includes(lowerQuery)
      );
    });
  }, [mergedOptions, searchQuery, searchable, shouldLocalSearch]);

  const showCreateFromNoResults =
    filteredOptions.length === 0 && searchQuery.trim() && searchable && create;
  const showAddAtBottom = create && filteredOptions.length > 0 && !showCreateFromNoResults;

  const openCreateWithInitial = useCallback((initialValue?: string) => {
    setCreateInitialValue(initialValue);
    setCreateOpen(true);
  }, []);

  const handleEditComplete = useCallback(
    async (info?: { id?: string; label?: string }) => {
      setEditState({ open: false, id: "" });
      if (!info) return;
      const id = info.id?.trim();
      const label = info.label?.trim() || id;
      if (id && label) {
        setEditedLabels((prev) => ({ ...prev, [id]: label }));
      }
    },
    []
  );

  const fieldRef = useRef<{ onChange: (v: string[]) => void; value: string[] } | null>(null);

  const handleDeleteConfirm = useCallback(async () => {
    const id = deleteState.id;
    if (!id || !create?.onDelete) return;
    setDeleteState((prev) => ({ ...prev, deleting: true }));
    try {
      await create.onDelete(id);
      setDeleteState({ open: false, id: "", label: "", deleting: false });
      setDeletedIds((prev) => new Set(prev).add(id));
      setCreatedOptions((prev) => prev.filter((opt) => opt.value !== id));
      setEditedLabels((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      const fc = fieldRef.current;
      if (fc?.value.includes(id)) {
        fc.onChange(fc.value.filter((v) => v !== id));
      }
    } catch {
      setDeleteState((prev) => ({ ...prev, deleting: false }));
    }
  }, [create?.onDelete, deleteState.id]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteState({ open: false, id: "", label: "", deleting: false });
  }, []);

  useLayoutEffect(() => {
    if (!autoMinWidth || !triggerRef.current) {
      setMinWidth(undefined);
      return;
    }

    const labelTexts = mergedOptions
      .map((opt) => {
        if (typeof opt.label === "string") return opt.label;
        if (typeof opt.label === "number") return String(opt.label);
        return "";
      })
      .map((text, idx) => (text.trim() ? text : mergedOptions[idx]?.value ?? ""))
      .filter(Boolean);

    if (!labelTexts.length) {
      setMinWidth(undefined);
      return;
    }

    const style = window.getComputedStyle(triggerRef.current);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const iconSpace = 48;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setMinWidth(undefined);
      return;
    }
    ctx.font = font;

    const maxTextWidth = Math.max(
      ...labelTexts.map((text) => ctx.measureText(text).width)
    );

    setMinWidth(Math.ceil(maxTextWidth + paddingLeft + paddingRight + iconSpace));
  }, [autoMinWidth, mergedOptions]);

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
        const selected: string[] = Array.isArray(field.value)
          ? field.value
          : [];
        const selectedLabels = mergedOptions
          .filter((o) => selected.includes(o.value))
          .map((o) => o.label)
          .join(", ");

        const resolvedPlaceholder =
          (isLoading ? loadingLabel ?? "Loading..." : null) ??
          (errorMessage ? "Unable to load" : null) ??
          placeholder ??
          "Select";

        fieldRef.current = { onChange: field.onChange, value: selected };

        const handleCreateComplete = async (info?: {
          id?: string;
          label?: string;
        }) => {
          setCreateOpen(false);
          setCreateInitialValue(undefined);
          if (!info) return;
          const id = info.id?.trim();
          if (!id) return;
          const label = info.label?.trim() || id;
          setCreatedOptions((prev) =>
            prev.some((opt) => opt.value === id)
              ? prev
              : [{ value: id, label }, ...prev]
          );
          const nextSelected = Array.from(new Set([...selected, id]));
          field.onChange(nextSelected);
        };

        const topControls = searchable;

        return (
          <div className="grid gap-2" style={minWidth ? { minWidth } : undefined}>
            {label ? (
              <LabelPrimary required={required}>{label}</LabelPrimary>
            ) : null}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={triggerRef}
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  disabled={disabled || isLoading || Boolean(errorMessage)}
                >
                  <span className="truncate">
                    {selectedLabels || resolvedPlaceholder}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selected.length} selected
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="max-h-72 overflow-y-auto w-[var(--radix-popper-anchor-width)] min-w-[var(--radix-popper-anchor-width)]"
              >
                {topControls ? (
                  <div className="px-2 py-1.5 pb-2 sticky top-0 bg-popover z-10 grid gap-2">
                    {searchable ? (
                      <div className="relative">
                        <Input
                          placeholder={searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-8 pr-9"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                        {hasRemoteSearch ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                            aria-pressed={localSearchEnabled}
                            title={
                              localSearchEnabled
                                ? "Search within current list"
                                : "Search all items"
                            }
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocalSearchEnabled((prev) => {
                                const next = !prev;
                                if (next) {
                                  onSearch?.("");
                                }
                                return next;
                              });
                            }}
                          >
                            {localSearchEnabled ? (
                              <ListFilterIcon className="size-4" />
                            ) : (
                              <GlobeIcon className="size-4" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {isLoading ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {loadingLabel ?? "Loading..."}
                  </div>
                ) : errorMessage ? (
                  <div className="px-2 py-1.5">
                    <ErrorMessage message={errorMessage} />
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="px-2 py-1.5">
                    {showCreateFromNoResults ? (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          openCreateWithInitial(searchQuery.trim());
                        }}
                        className="justify-center font-medium text-primary"
                      >
                        <PlusIcon className="size-4" />
                        Create &quot;{searchQuery.trim()}&quot;
                      </DropdownMenuItem>
                    ) : (
                      <div className="text-sm text-muted-foreground px-2">
                        {searchQuery && searchable
                          ? "No results found"
                          : emptyLabel ?? "No options available"}
                      </div>
                    )}
                  </div>
                ) : (
                  filteredOptions.map((opt) => (
                    <DropdownMenuCheckboxItem
                      key={opt.value}
                      checked={selected.includes(opt.value)}
                      onCheckedChange={(checked) => {
                        if (checked === true) {
                          field.onChange([...selected, opt.value]);
                        } else {
                          field.onChange(
                            selected.filter((v) => v !== opt.value)
                          );
                        }
                      }}
                      className="flex items-center justify-between gap-1 group/opt"
                    >
                      <span className="flex-1 truncate">{opt.label}</span>
                      <div className="flex shrink-0 gap-0.5 opacity-0 group-hover/opt:opacity-100">
                        {create?.editRender ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            aria-label="Edit"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditState({ open: true, id: opt.value });
                            }}
                          >
                            <PencilIcon className="size-3.5" />
                          </Button>
                        ) : null}
                        {create?.onDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            aria-label="Delete"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleteState({
                                open: true,
                                id: opt.value,
                                label: String(opt.label ?? opt.value),
                                deleting: false,
                              });
                            }}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
                {showAddAtBottom ? (
                  <div className="pt-1">
                    <Separator />
                    <DropdownMenuItem
                      onSelect={() => openCreateWithInitial()}
                      className="justify-center font-medium"
                    >
                      <PlusIcon className="size-4" />
                      {create.label ?? "Add"}
                    </DropdownMenuItem>
                  </div>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>

            <ErrorMessage message={fieldState.error?.message} />

            {create ? (
              <SimpleModal
                open={createOpen}
                onOpenChange={(open) => {
                  setCreateOpen(open);
                  if (!open) setCreateInitialValue(undefined);
                }}
                size={create.modalSize}
                title={create.modalTitle ?? "Add"}
                description={create.modalDescription}
              >
                {create.render({
                  close: () => setCreateOpen(false),
                  complete: handleCreateComplete,
                  initialValue: createInitialValue,
                })}
              </SimpleModal>
            ) : null}
            {create?.editRender && editState.open ? (
              <SimpleModal
                open={editState.open}
                onOpenChange={(open) => setEditState((prev) => ({ ...prev, open }))}
                size={create.modalSize}
                title="Edit"
                description={create.modalDescription}
              >
                {create.editRender({
                  id: editState.id,
                  close: () => setEditState({ open: false, id: "" }),
                  complete: handleEditComplete,
                })}
              </SimpleModal>
            ) : null}
            {/* {create?.onDelete && deleteState.open ? (
              <ConfirmActionDialog
                open={deleteState.open}
                onCancel={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title="Delete"
                description={`Are you sure you want to delete "${deleteState.label}"?`}
                confirmLabel="Delete"
                confirmationText={deleteState.label || deleteState.id}
                confirmationPlaceholder="Type the exact item name shown above"
                loading={deleteState.deleting}
              />
            ) : null} */}
          </div>
        );
      }}
    />
  );
}

export default MultiSelectR;
