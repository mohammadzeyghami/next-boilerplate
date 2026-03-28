import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,

} from '@/shared/components/molecules/dropdown-menu';
import { cn } from '@/lib/utils';
import type React from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchFilter } from '@/shared/components/hooks/useSearchFilter';
import { ChevronDownIcon, GlobeIcon, ListFilterIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import type { ModalShellSize } from '@/shared/components/organisms/modal-shell';
import { Button } from "@/shared/components/atoms/button";
import { Input } from "@/shared/components/atoms/input";
import LabelPrimary from "../label/Primary";
import { Separator } from "@/shared/components/atoms/separator";
import { SimpleModal } from "@/shared/components/organisms/modal-shell";
import ErrorMessage from "../../atoms/typography/ErrorMessage";

export type Option = {
  value: string;
  label: React.ReactNode;
};

export type SelectCreateConfig = {
  label?: React.ReactNode;
  modalTitle?: React.ReactNode;
  modalDescription?: React.ReactNode;
  modalSize?: ModalShellSize;
  render: (ctx: {
    close: () => void;
    complete: (info?: { id?: string; label?: string }) => Promise<void>;
    initialValue?: string;
  }) => React.ReactNode;
  /** Optional edit render for when editing an existing option. */
  editRender?: (ctx: {
    id: string;
    close: () => void;
    complete: (info?: { id?: string; label?: string }) => Promise<void>;
  }) => React.ReactNode;
  /** Optional delete handler. When provided, delete icon is shown per option. */
  onDelete?: (id: string) => Promise<void>;
};

export interface SelectPrimaryProps {
  label?: string;
  required?: boolean;
  placeholder?: string;
  options: Option[];
  /** optional className if you want later */
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  /**
   * "Data" error: e.g. failed to load options.
   * This is different from field validation errors.
   */
  errorMessage?: string | null;
  emptyLabel?: string;
  /** current value (controlled) */
  value?: string;
  /** change handler from parent / form wrapper */
  onChange?: (value: string) => void;
  /** validation error message from react-hook-form (or similar) */
  fieldError?: string | undefined;
  /** enable search functionality */
  searchable?: boolean;
  /** search placeholder */
  searchPlaceholder?: string;
  /** callback for server-side search - if not provided, local search will be used */
  onSearch?: (query: string) => void;
  create?: SelectCreateConfig;
  autoMinWidth?: boolean;
}

function SelectPrimary({
  label,
  required,
  placeholder,
  options,
  className,
  disabled,
  isLoading,
  loadingLabel,
  errorMessage,
  emptyLabel,
  value,
  onChange,
  fieldError,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
  create,
  autoMinWidth = false,
}: SelectPrimaryProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitialValue, setCreateInitialValue] = useState<string | undefined>();
  const [editState, setEditState] = useState<{ open: boolean; id: string }>({
    open: false,
    id: '',
  });
  const [deleteState, setDeleteState] = useState<{
    open: boolean;
    id: string;
    label: string;
    deleting: boolean;
  }>({ open: false, id: '', label: '', deleting: false });
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [createdOptions, setCreatedOptions] = useState<Option[]>([]);
  const [editedLabels, setEditedLabels] = useState<Record<string, string>>({});
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>();
  const [localSearchEnabled, setLocalSearchEnabled] = useState(true);
  const hasRemoteSearch = typeof onSearch === 'function';
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
      // If not searchable or using server-side search, return original options
      return mergedOptions;
    }

    if (!searchQuery.trim()) {
      return mergedOptions;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return mergedOptions.filter((opt) => {
      const labelText = typeof opt.label === 'string' ? opt.label : String(opt.label);
      return (
        labelText.toLowerCase().includes(lowerQuery) || opt.value.toLowerCase().includes(lowerQuery)
      );
    });
  }, [mergedOptions, searchQuery, searchable, shouldLocalSearch]);

  const selectedOption = useMemo(
    () => mergedOptions.find((o) => o.value === (value ?? '')) ?? null,
    [mergedOptions, value]
  );

  const resolvedPlaceholder =
    (isLoading ? (loadingLabel ?? 'Loading...') : null) ??
    (errorMessage ? 'Unable to load' : null) ??
    placeholder ??
    'Select';

  useLayoutEffect(() => {
    if (!autoMinWidth || !triggerRef.current) {
      setMinWidth(undefined);
      return;
    }

    const labelTexts = mergedOptions
      .map((opt) => {
        if (typeof opt.label === 'string') return opt.label;
        if (typeof opt.label === 'number') return String(opt.label);
        return '';
      })
      .map((text, idx) => (text.trim() ? text : (mergedOptions[idx]?.value ?? '')))
      .filter(Boolean);

    if (!labelTexts.length) {
      setMinWidth(undefined);
      return;
    }

    const style = window.getComputedStyle(triggerRef.current);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const paddingLeft = parseFloat(style.paddingLeft) || 0;
    const paddingRight = parseFloat(style.paddingRight) || 0;
    const iconSpace = 24;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setMinWidth(undefined);
      return;
    }
    ctx.font = font;

    const maxTextWidth = Math.max(...labelTexts.map((text) => ctx.measureText(text).width));

    setMinWidth(Math.ceil(maxTextWidth + paddingLeft + paddingRight + iconSpace));
  }, [autoMinWidth, mergedOptions]);

  const handleCreateComplete = useCallback(
    async (info?: { id?: string; label?: string }) => {
      setCreateOpen(false);
      setCreateInitialValue(undefined);
      if (!info) return;
      const id = info.id?.trim();
      if (!id) return;
      const label = info.label?.trim() || id;
      setCreatedOptions((prev) =>
        prev.some((opt) => opt.value === id) ? prev : [{ value: id, label }, ...prev]
      );
      onChange?.(id);
    },
    [onChange]
  );

  const handleEditComplete = useCallback(
    async (info?: { id?: string; label?: string }) => {
      setEditState({ open: false, id: '' });
      if (!info) return;
      const id = info.id?.trim();
      const label = info.label?.trim() || id;
      if (id && label) {
        setEditedLabels((prev) => ({ ...prev, [id]: label }));
      }
    },
    []
  );

  const handleDeleteConfirm = useCallback(async () => {
    const id = deleteState.id;
    if (!id || !create?.onDelete) return;
    setDeleteState((prev) => ({ ...prev, deleting: true }));
    try {
      await create.onDelete(id);
      setDeleteState({ open: false, id: '', label: '', deleting: false });
      setDeletedIds((prev) => new Set(prev).add(id));
      setCreatedOptions((prev) => prev.filter((opt) => opt.value !== id));
      setEditedLabels((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (value === id) {
        onChange?.('');
      }
    } catch {
      setDeleteState((prev) => ({ ...prev, deleting: false }));
    }
  }, [create?.onDelete, deleteState.id, onChange, value]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteState({ open: false, id: '', label: '', deleting: false });
  }, []);

  const openCreateWithInitial = useCallback((initialValue?: string) => {
    setCreateInitialValue(initialValue);
    setCreateOpen(true);
  }, []);

  const showCreateFromNoResults =
    filteredOptions.length === 0 && searchQuery.trim() && searchable && create;
  const showAddAtBottom = create && filteredOptions.length > 0 && !showCreateFromNoResults;

  const topControls = searchable;

  return (
    <div className="grid gap-2" style={minWidth ? { minWidth } : undefined}>
      {label ? <LabelPrimary required={required}>{label}</LabelPrimary> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            type="button"
            variant="outline"
            className={cn('w-full justify-between', className)}
            disabled={disabled || isLoading || Boolean(errorMessage)}
            aria-invalid={!!fieldError}
          >
            <span className="truncate">{selectedOption?.label ?? resolvedPlaceholder}</span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-72 overflow-y-auto w-(--radix-popper-anchor-width) min-w-(--radix-popper-anchor-width)">
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
                          ? 'Search within current list'
                          : 'Search all items'
                      }
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalSearchEnabled((prev) => {
                          const next = !prev;
                          if (next) {
                            onSearch?.('');
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
              {loadingLabel ?? 'Loading...'}
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
                    ? 'No results found'
                    : (emptyLabel ?? 'No options available')}
                </div>
              )}
            </div>
          ) : (
            <DropdownMenuRadioGroup
              value={value ?? ''}
              onValueChange={(nextValue) => onChange?.(nextValue)}
            >
              {filteredOptions.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value}
                  value={opt.value}
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
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          )}
          {showAddAtBottom ? (
            <div className="pt-1">
              <Separator />
              <DropdownMenuItem
                onSelect={() => openCreateWithInitial()}
                className="justify-center font-medium"
              >
                <PlusIcon className="size-4" />
                {create.label ?? 'Add'}
              </DropdownMenuItem>
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* validation error from form lib */}
      <ErrorMessage message={fieldError} />

      {create ? (
        <SimpleModal
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setCreateInitialValue(undefined);
          }}
          size={create.modalSize}
          title={create.modalTitle ?? 'Add'}
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
            close: () => setEditState({ open: false, id: '' }),
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
}

export default SelectPrimary;
