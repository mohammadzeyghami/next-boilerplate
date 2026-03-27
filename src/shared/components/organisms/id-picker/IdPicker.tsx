import { cn } from '@/lib/utils';

import ErrorMessage from '@/shared/components/atoms/typography/ErrorMessage';
import { Input } from '@/shared/components/atoms/input';
import LabelPrimary from '@/shared/components/molecules/label/Primary';
import { ModalShell } from '@/shared/components/organisms/modal-shell';
import { ScrollArea } from '@/shared/components/atoms/scroll-area';
import { SimpleModal } from '@/shared/components/organisms/modal-shell';
import SelectPrimary from '@/shared/components/molecules/inputs/SelectPrimary';
import P from '@/shared/components/atoms/typography/P';
import { Check, Pencil, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchFilter } from '@/shared/components/hooks/useSearchFilter';
import type { UseQueryResult } from '@tanstack/react-query';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../../molecules/dropdown-menu';
import { Button } from '../../atoms/button';
import { toast } from '../../atoms/toast/toast-store';

export type IdPickerItem = {
  value: string;
  label: ReactNode;
};

type SelectOption = {
  value: string;
  label: ReactNode;
};

export type IdPickerFilter<TItem extends IdPickerItem = IdPickerItem> = {
  id: string;
  label: ReactNode;
  predicate: (item: TItem) => boolean;
  group?: string;
};

export type IdPickerSort<TItem extends IdPickerItem = IdPickerItem> = {
  id: string;
  label: ReactNode;
  compare: (a: TItem, b: TItem) => number;
};

export type IdPickerValue = string | string[] | null | undefined;

export type IdPickerPagination = {
  page: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
  onPageChange?: (page: number) => void;
  onNextPage?: () => void;
  onPrevPage?: () => void;
};

export type IdPickerSearchConfig = {
  enabled?: boolean;
  placeholder?: string;
  initialValue?: string;
  delay?: number;
  onSearch?: (query: string) => void;
  client?: boolean;
};

export type IdPickerSortConfig<TItem extends IdPickerItem = IdPickerItem> = {
  options: Array<IdPickerSort<TItem>>;
  initialId?: string;
  client?: boolean;
  onChange?: (id: string) => void;
};

export type IdPickerFiltersConfig<TItem extends IdPickerItem = IdPickerItem> = {
  options: Array<IdPickerFilter<TItem>>;
  initialIds?: string[];
  client?: boolean;
  onChange?: (ids: string[]) => void;
  groups?: Array<{
    id: string;
    label: string;
    multiple?: boolean;
    placeholder?: string;
    searchable?: boolean;
    searchPlaceholder?: string;
    customRender?: (selected: string[], onChange: (ids: string[]) => void) => ReactNode;
  }>;
};

export type IdPickerCreateConfig = {
  label?: ReactNode;
  modalTitle?: ReactNode;
  modalDescription?: ReactNode;
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  render: (ctx: {
    close: () => void;
    complete: (info?: { id?: string; label?: string }) => Promise<void>;
  }) => ReactNode;
};

export type IdPickerEditConfig = {
  label?: ReactNode;
  modalTitle?: ReactNode;
  modalDescription?: ReactNode;
  modalSize?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  render: (ctx: {
    id: string;
    close: () => void;
    complete: () => Promise<void>;
  }) => ReactNode;
};

export type IdPickerDeleteConfig = {
  label?: ReactNode;
  confirmTitle?: ReactNode;
  confirmDescription?: ReactNode;
  onDelete: (id: string) => Promise<void>;
};

export type IdPickerData<TItem extends IdPickerItem = IdPickerItem> =
  | {
    type: 'items';
    items: TItem[];
    isLoading?: boolean;
    errorMessage?: string | null;
    pagination?: IdPickerPagination;
  }
  | {
    type: 'query';
    query: UseQueryResult<unknown, unknown>;
    valueKey: string;
    labelKey: string;
    labelFallbackToValue?: boolean;
    errorMessage?: string | null;
    pagination?: IdPickerPagination;
  };

export type IdPickerProps<TItem extends IdPickerItem = IdPickerItem> = {
  label?: ReactNode;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  errorMessage?: string | null;
  className?: string;

  multiple?: boolean;
  value: IdPickerValue;
  onChange: (value: string | string[]) => void;

  data: IdPickerData<TItem>;
  emptyLabel?: ReactNode;

  search?: IdPickerSearchConfig;
  sort?: IdPickerSortConfig<TItem>;
  filters?: IdPickerFiltersConfig<TItem>;

  create?: IdPickerCreateConfig;
  edit?: IdPickerEditConfig;
  delete?: IdPickerDeleteConfig;
};

function normalizeValue(value: IdPickerValue, multiple: boolean): string[] {
  const normalizeId = (v: unknown): string => {
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (v && typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      const candidate = obj.value ?? obj.id;
      return typeof candidate === 'string' ? candidate.trim() : String(candidate ?? '').trim();
    }
    return String(v ?? '').trim();
  };

  if (multiple) {
    return Array.isArray(value) ? value.map(normalizeId).filter(Boolean) : [];
  }

  const v = normalizeId(value);
  return v ? [v] : [];
}

function getByPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return undefined;
  if (!path.includes('.')) return obj[path];
  let cur: unknown = obj;
  for (const part of path.split('.')) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function mapQueryDataToItems<TItem extends IdPickerItem>(
  data: Extract<IdPickerData<TItem>, { type: 'query' }>,
  raw: unknown
): TItem[] {
  const list = Array.isArray(raw) ? raw : [];
  const fallbackToValue = data.labelFallbackToValue ?? true;

  return list
    .map((row) => {
      const obj =
        row && typeof row === 'object'
          ? (row as Record<string, unknown>)
          : ({} as Record<string, unknown>);

      const value = String(getByPath(obj, data.valueKey) ?? '').trim();
      const labelRaw = getByPath(obj, data.labelKey);
      const label = String(labelRaw ?? '').trim();

      return {
        value,
        label: label || (fallbackToValue ? value : ''),
      } as unknown as TItem;
    })
    .filter((i) => Boolean((i as unknown as IdPickerItem).value?.trim?.()));
}

function MultiSelectPrimary({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
  isLoading,
  loadingLabel,
  errorMessage,
  emptyLabel,
  searchable = false,
  searchPlaceholder = 'Search...',
  onSearch,
}: {
  label?: ReactNode;
  placeholder?: string;
  options: SelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  errorMessage?: string | null;
  emptyLabel?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}) {
  const { search: searchQuery, setSearch: setSearchQuery } = useSearchFilter({
    enabled: searchable,
    onSearch,
  });

  const filteredOptions = useMemo(() => {
    if (!searchable || onSearch) {
      return options;
    }

    if (!searchQuery.trim()) {
      return options;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return options.filter((opt) => {
      const labelText = typeof opt.label === 'string' ? opt.label : String(opt.label);
      return (
        labelText.toLowerCase().includes(lowerQuery) || opt.value.toLowerCase().includes(lowerQuery)
      );
    });
  }, [options, searchQuery, searchable, onSearch]);

  const selectedLabels = useMemo(() => {
    const labels = options.filter((o) => value.includes(o.value)).map((o) => o.label);
    return labels.join(', ');
  }, [options, value]);

  const resolvedPlaceholder =
    (isLoading ? (loadingLabel ?? 'Loading...') : null) ??
    (errorMessage ? 'Unable to load' : null) ??
    placeholder ??
    'Select';

  return (
    <div className="grid gap-2">
      {label ? <P className="font-semibold">{label} :</P> : null}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between"
            disabled={disabled || isLoading || Boolean(errorMessage)}
          >
            <span className="truncate">{selectedLabels || resolvedPlaceholder}</span>
            <span className="text-xs text-muted-foreground">{value.length} selected</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-72 overflow-y-auto">
          {searchable && (
            <div className="px-2 py-1.5 pb-2 sticky top-0 bg-popover z-10">
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
          {isLoading ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {loadingLabel ?? 'Loading...'}
            </div>
          ) : errorMessage ? (
            <div className="px-2 py-1.5">
              <ErrorMessage message={errorMessage} />
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              {searchQuery && searchable
                ? 'No results found'
                : (emptyLabel ?? 'No options available')}
            </div>
          ) : (
            filteredOptions.map((opt) => (
              <DropdownMenuCheckboxItem
                key={opt.value}
                checked={value.includes(opt.value)}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    onChange([...value, opt.value]);
                  } else {
                    onChange(value.filter((v) => v !== opt.value));
                  }
                }}
              >
                {opt.label}
              </DropdownMenuCheckboxItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function IdPicker<TItem extends IdPickerItem = IdPickerItem>({
  label,
  required,
  placeholder = 'Select…',
  disabled,
  clearable = false,
  errorMessage,
  className,
  multiple = false,
  value,
  onChange,
  data,
  emptyLabel = 'No items found.',
  search,
  sort,
  filters,
  create,
  edit,
  delete: deleteConfig,
}: IdPickerProps<TItem>) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [sortId, setSortId] = useState<string>(sort?.initialId ?? sort?.options?.[0]?.id ?? '');
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>(filters?.initialIds ?? []);

  const searchEnabled = Boolean(search);
  const clientSearchEnabled = searchEnabled && (search?.enabled ?? true);
  const shouldClientSearch = search?.client ?? typeof search?.onSearch !== 'function';
  const shouldClientSort = sort?.client ?? true;
  const shouldClientFilter = filters?.client ?? true;

  const { search: searchValue, setSearch: setSearchValue } = useSearchFilter({
    enabled: clientSearchEnabled,
    initialValue: search?.initialValue ?? '',
    delay: search?.delay ?? 400,
    onSearch: search?.onSearch,
  });

  useEffect(() => {
    if (!sort?.initialId) return;
    if (sortId === sort.initialId) return;
    setSortId(sort.initialId);
  }, [sort?.initialId, sortId]);

  useEffect(() => {
    if (!filters?.initialIds) return;
    const next = filters.initialIds;
    if (
      next.length === activeFilterIds.length &&
      next.every((id, idx) => id === activeFilterIds[idx])
    ) {
      return;
    }
    setActiveFilterIds(next);
  }, [filters?.initialIds, activeFilterIds]);

  const filterGroups = useMemo(() => {
    if (!filters?.options?.length) return [];
    if (filters.groups?.length) return filters.groups;
    return [{ id: '__all__', label: 'Filters', multiple: true }];
  }, [filters?.groups, filters?.options]);

  const filterGroupById = useMemo(() => {
    const map = new Map<string, string>();
    filters?.options?.forEach((opt) => {
      map.set(opt.id, opt.group ?? '__all__');
    });
    return map;
  }, [filters?.options]);

  const updateFilterGroup = (groupId: string, nextIds: string[]) => {
    setActiveFilterIds((prev) => {
      const keep = prev.filter((id) => filterGroupById.get(id) !== groupId);
      const next = [...keep, ...nextIds];
      filters?.onChange?.(next);
      return next;
    });
  };
  const effectiveItems = useMemo<TItem[]>(() => {
    if (data.type === 'items') return data.items ?? [];
    return mapQueryDataToItems(data, data.query.data);
  }, [data]);

  const effectiveLoading =
    data.type === 'items' ? Boolean(data.isLoading) : Boolean(data.query.isLoading);

  const remoteError =
    data.type === 'items'
      ? (data.errorMessage ?? null)
      : data.query.isError
        ? (data.errorMessage ??
          (data.query.error instanceof Error ? data.query.error.message : 'Failed to load items'))
        : null;

  const pagination = data.pagination;

  const selected = useMemo(() => normalizeValue(value, multiple), [value, multiple]);
  const [draftSelected, setDraftSelected] = useState<string[]>(selected);
  const canClear = clearable && !multiple && selected.length > 0;

  const itemsWithSelected = useMemo<TItem[]>(() => {
    if (!selected.length) return effectiveItems;
    const byId = new Set(effectiveItems.map((i) => i.value));
    const missing = selected
      .filter((id) => id && !byId.has(id))
      .map(
        (id) =>
          ({
            value: id,
            label: id,
          }) as unknown as TItem
      );
    return missing.length ? [...missing, ...effectiveItems] : effectiveItems;
  }, [effectiveItems, selected]);

  const selectedText = useMemo(() => {
    if (!selected.length) return '';
    const labelById = new Map(
      itemsWithSelected.map((i) => [i.value, typeof i.label === 'string' ? i.label : ''] as const)
    );
    const resolved = selected.map((id) => labelById.get(id)?.trim() || id);
    return resolved.join(', ');
  }, [itemsWithSelected, selected]);

  const shownItems = useMemo<TItem[]>(() => {
    let list = [...itemsWithSelected];

    if (clientSearchEnabled && shouldClientSearch) {
      const q = searchValue.trim().toLowerCase();
      if (q) {
        list = list.filter((i) => {
          const labelText = typeof i.label === 'string' ? i.label : String(i.label);
          return i.value.toLowerCase().includes(q) || labelText.toLowerCase().includes(q);
        });
      }
    }

    if (shouldClientFilter && activeFilterIds.length && filters?.options?.length) {
      const enabled = new Set(activeFilterIds);
      for (const f of filters.options) {
        if (!enabled.has(f.id)) continue;
        list = list.filter((i) => f.predicate(i));
      }
    }

    if (shouldClientSort && sort?.options?.length) {
      const sorter = sort.options.find((s) => s.id === sortId);
      if (sorter) list.sort(sorter.compare);
    }

    return list;
  }, [
    itemsWithSelected,
    clientSearchEnabled,
    shouldClientSearch,
    searchValue,
    shouldClientFilter,
    activeFilterIds,
    filters?.options,
    shouldClientSort,
    sort?.options,
    sortId,
  ]);

  const deletingItemName = useMemo(() => {
    if (!deletingId) return '';
    const target = itemsWithSelected.find((item) => item.value === deletingId);
    if (!target) return deletingId;
    return typeof target.label === 'string' && target.label.trim() ? target.label : deletingId;
  }, [itemsWithSelected, deletingId]);

  const openModal = () => {
    if (disabled) return;
    setDraftSelected(selected);
    setOpen(true);
  };

  const selectId = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;

    if (multiple) {
      const base = new Set(selected);
      base.add(trimmed);
      const next = Array.from(base);
      setDraftSelected(next);
      onChange(next);
      return;
    }

    onChange(trimmed);
  };

  const handleCreateComplete = async (info?: { id?: string; label?: string }) => {
    setCreateOpen(false);
    if (!info) return;

    if (info.id?.trim()) {
      selectId(info.id);
      return;
    }

    const targetLabel = info.label?.trim();
    if (!targetLabel) return;

    if (data.type === 'query' && typeof data.query.refetch === 'function') {
      const res = await data.query.refetch();
      const refreshed = mapQueryDataToItems(
        data,
        (res as { data?: unknown } | null | undefined)?.data
      );
      const exact = refreshed.filter((i) => String(i.label ?? '').trim() === targetLabel);
      const found = (exact.length ? exact : refreshed)[0];
      if (found?.value) selectId(String(found.value));
      return;
    }
  };

  const handleEditComplete = async () => {
    setEditOpen(false);
    setEditingId(null);
    if (data.type === 'query' && typeof data.query.refetch === 'function') {
      await data.query.refetch();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId || !deleteConfig) return;
    try {
      await deleteConfig.onDelete(deletingId);
      if (data.type === 'query' && typeof data.query.refetch === 'function') {
        await data.query.refetch();
      }

      // If the deleted item was selected, deselect it
      if (multiple) {
        if (draftSelected.includes(deletingId)) {
          setDraftSelected((prev) => prev.filter((id) => id !== deletingId));
        }
        // Also update the committed value if it's not draft
        const currentSelected = normalizeValue(value, true);
        if (currentSelected.includes(deletingId)) {
          onChange(currentSelected.filter((id) => id !== deletingId));
        }
      } else {
        const currentSelected = normalizeValue(value, false);
        if (currentSelected.includes(deletingId)) {
          onChange('');
        }
      }
      toast({
        title: 'Item deleted',
        variant: 'default', // 'success' is not a valid variant in shadcn toast usually, or use default
      });
    } catch (error) {
      toast({
        title: 'Failed to delete item',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setDeleteOpen(false);
      setDeletingId(null);
    }
  };

  const commitSingle = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  const commitMultiple = () => {
    onChange(draftSelected);
    setOpen(false);
  };

  const renderActions = (item: TItem) => {
    if (!edit && !deleteConfig) return null;
    return (
      <div className="flex items-center gap-1 ml-auto">
        {edit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              setEditingId(item.value);
              setEditOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
        {deleteConfig ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeletingId(item.value);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <div className={cn('grid gap-2', className)}>
      {label ? <LabelPrimary required={required}>{label}</LabelPrimary> : null}

      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        disabled={disabled}
        onClick={openModal}
      >
        <span className="truncate">
          {selectedText ||
            (selected.length ? `${selected.length} selected` : null) ||
            (effectiveLoading ? 'Loading...' : placeholder)}
        </span>
        <Search className="size-4 text-muted-foreground" />
      </Button>

      {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

      <ModalShell open={open} onOpenChange={setOpen}>
        <ModalShell.Content size="lg">
          <ModalShell.Header title={label ?? 'Select'} />

          <ModalShell.Body className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
              {clientSearchEnabled ? (
                <Input
                  placeholder={search?.placeholder ?? 'Search…'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              ) : (
                <div />
              )}

              <div className="flex items-center justify-end gap-2">
                {canClear ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      onChange('');
                      setOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                ) : null}

                {create ? (
                  <Button type="button" onClick={() => setCreateOpen(true)}>
                    {create.label ?? 'Create'}
                  </Button>
                ) : null}
              </div>
            </div>

            {sort?.options?.length || filterGroups.length ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFiltersOpen((prev) => !prev)}
                  >
                    {filtersOpen ? 'Hide filters' : 'Show filters'}
                  </Button>
                </div>

                {filtersOpen ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sort?.options?.length ? (
                      <div className="grid gap-2">
                        <P className="font-semibold">Sort :</P>
                        <SelectPrimary
                          placeholder="Sort by"
                          options={sort.options.map((s) => ({
                            value: s.id,
                            label: s.label,
                          }))}
                          value={sortId}
                          onChange={(nextValue) => {
                            setSortId(nextValue);
                            sort.onChange?.(nextValue);
                          }}
                        />
                      </div>
                    ) : null}

                    {filterGroups.map((group) => {
                      const groupOptions =
                        group.id === '__all__'
                          ? (filters?.options ?? [])
                          : (filters?.options ?? []).filter((opt) => opt.group === group.id);

                      if (!groupOptions.length) return null;

                      const groupIds = groupOptions.map((opt) => opt.id);
                      const selected = activeFilterIds.filter((id) => groupIds.includes(id));

                      if (group.customRender) {
                        return (
                          <div key={group.id}>
                            {group.customRender(selected, (next) => updateFilterGroup(group.id, next))}
                          </div>
                        );
                      }

                      if (group.multiple) {
                        return (
                          <MultiSelectPrimary
                            key={group.id}
                            label={group.label}
                            placeholder={group.placeholder ?? 'Select'}
                            options={groupOptions.map((opt) => ({
                              value: opt.id,
                              label: opt.label,
                            }))}
                            value={selected}
                            onChange={(next) => updateFilterGroup(group.id, next)}
                            searchable={group.searchable}
                            searchPlaceholder={group.searchPlaceholder}
                          />
                        );
                      }

                      return (
                        <div key={group.id} className="grid gap-2">
                          <P className="font-semibold">
                            {group.label} :
                          </P>
                          <SelectPrimary
                            placeholder={group.placeholder ?? 'All'}
                            options={[
                              { value: '', label: group.placeholder ?? 'All' },
                              ...groupOptions.map((opt) => ({
                                value: opt.id,
                                label: opt.label,
                              })),
                            ]}
                            value={selected[0] ?? ''}
                            onChange={(nextValue) =>
                              updateFilterGroup(group.id, nextValue ? [nextValue] : [])
                            }
                            searchable={group.searchable}
                            searchPlaceholder={group.searchPlaceholder}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-lg border">
              <ScrollArea className="h-[52dvh]">
                <div className="grid gap-2 p-3">
                  {effectiveLoading ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                  ) : remoteError ? (
                    <ErrorMessage message={remoteError} />
                  ) : shownItems.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{emptyLabel}</div>
                  ) : multiple ? (
                    shownItems.map((item) => {
                      const checked = draftSelected.includes(item.value);
                      return (
                        <div
                          key={item.value}
                          role="button"
                          tabIndex={0}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left',
                            'hover:bg-accent',
                            checked && 'border-primary bg-accent/50'
                          )}
                          onClick={() =>
                            setDraftSelected((prev) =>
                              prev.includes(item.value)
                                ? prev.filter((x) => x !== item.value)
                                : [...prev, item.value]
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setDraftSelected((prev) =>
                                prev.includes(item.value)
                                  ? prev.filter((x) => x !== item.value)
                                  : [...prev, item.value]
                              );
                            }
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'grid size-4 place-content-center rounded-sm border',
                              checked
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-input bg-background'
                            )}
                          >
                            {checked ? <Check className="size-3" /> : null}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{item.label}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {item.value}
                            </div>
                          </div>
                          {renderActions(item)}
                        </div>
                      );
                    })
                  ) : (
                    shownItems.map((item) => {
                      const isSelected = selected[0] === item.value;
                      return (
                        <div
                          key={item.value}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-md border px-3 py-3 text-left',
                            'hover:bg-accent',
                            isSelected && 'border-primary bg-accent/50'
                          )}
                        >
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => commitSingle(item.value)}
                          >
                            <div className="truncate text-sm font-medium">{item.label}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {item.value}
                            </div>
                          </div>
                          {renderActions(item)}
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
              {pagination && !effectiveLoading && !remoteError ? (
                <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
                  <div>
                    Page {pagination.page}
                    {pagination.totalPages && pagination.totalPages > 0
                      ? ` of ${pagination.totalPages}`
                      : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasPrevPage}
                      onClick={() => {
                        if (pagination.onPrevPage) {
                          pagination.onPrevPage();
                          return;
                        }
                        if (pagination.onPageChange && pagination.page > 1) {
                          pagination.onPageChange(pagination.page - 1);
                        }
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!pagination.hasNextPage}
                      onClick={() => {
                        if (pagination.onNextPage) {
                          pagination.onNextPage();
                          return;
                        }
                        if (
                          pagination.onPageChange &&
                          (!pagination.totalPages || pagination.page < pagination.totalPages)
                        ) {
                          pagination.onPageChange(pagination.page + 1);
                        }
                      }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </ModalShell.Body>

          {multiple ? (
            <ModalShell.Footer>
              <ModalShell.Actions
                confirmText={`Apply (${draftSelected.length})`}
                cancelText="Cancel"
                onConfirm={commitMultiple}
              />
            </ModalShell.Footer>
          ) : null}
        </ModalShell.Content>
      </ModalShell>

      {create ? (
        <SimpleModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          size={create.modalSize ?? 'sm'}
          title={create.modalTitle ?? create.label ?? 'Create'}
          description={create.modalDescription}
        >
          {create.render({
            close: () => setCreateOpen(false),
            complete: handleCreateComplete,
          })}
        </SimpleModal>
      ) : null}

      {edit && editingId ? (
        <SimpleModal
          open={editOpen}
          onOpenChange={(v) => {
            setEditOpen(v);
            if (!v) setEditingId(null);
          }}
          size={edit.modalSize ?? 'sm'}
          title={edit.modalTitle ?? edit.label ?? 'Edit'}
          description={edit.modalDescription}
        >
          {edit.render({
            id: editingId,
            close: () => setEditOpen(false),
            complete: handleEditComplete,
          })}
        </SimpleModal>
      ) : null}

      {/* {deleteConfig && deletingId ? (
        <ConfirmModal
          open={deleteOpen}
          onCancel={() => {
            setDeleteOpen(false);
            setDeletingId(null);
          }}
          title={deleteConfig.confirmTitle ?? 'Delete Item'}
          description={
            deleteConfig.confirmDescription ??
            'Are you sure you want to delete this item? This action cannot be undone.'
          }
          confirmationText={deletingItemName}
          confirmationPlaceholder="Type the exact item name shown above"
          onConfirm={handleDeleteConfirm}
        />
      ) : null} */}
    </div>
  );
}
