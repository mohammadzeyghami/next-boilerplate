import React, { useCallback, useEffect, useState } from "react";

type UseSearchFilterOptions = {
  initialValue?: string;
  delay?: number;
  enabled?: boolean;
  onSearch?: (query: string) => void;
};

export function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = React.useState(value);

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export function useSearchFilter({
  initialValue = "",
  delay = 400,
  enabled = true,
  onSearch,
}: UseSearchFilterOptions = {}) {
  const [search, setSearch] = useState(initialValue);
  const debouncedSearch = useDebouncedValue(search, delay);

  useEffect(() => {
    if (!enabled || !onSearch) return;
    onSearch(debouncedSearch);
  }, [debouncedSearch, enabled, onSearch]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  return { search, setSearch, debouncedSearch, handleSearchChange };
}
