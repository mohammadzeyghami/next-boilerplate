import { Button } from "@/shared/components/atoms/button";
import * as React from "react";
import { Toolbar } from "./toolbar";

export type ListToolbarProps = {
  q: string;
  onQ: (value: string) => void;
  searchPlaceholder?: string;
  search?: boolean;
  onResetFilters?: () => void;
  resetLabel?: string;

  onPrimary?: () => void;
  primaryLabel?: string;

  /** Desktop filters area (inline) */
  filters?: React.ReactNode;
  /** Mobile filters inside a sheet */
  filtersMobile?: React.ReactNode;

  className?: string;
};

export function ListToolbar({
  q,
  onQ,
  search = true,
  searchPlaceholder = "Search…",
  onResetFilters,
  resetLabel = "Reset",
  onPrimary,
  primaryLabel = "Create",
  filters,
  filtersMobile,
  className,
}: ListToolbarProps) {
  return (
    <Toolbar className={className}>
      {search ? (
        <Toolbar.Left>
          <Toolbar.Search
            value={q}
            onChange={onQ}
            placeholder={searchPlaceholder}
          />

          {filters && <Toolbar.Filters>{filters}</Toolbar.Filters>}

          {filtersMobile && (
            <Toolbar.FiltersMobile title="Filters">
              {filtersMobile}
            </Toolbar.FiltersMobile>
          )}
        </Toolbar.Left>
      ) : (
        <></>
      )}

      <Toolbar.Right>
        <Toolbar.Actions>
          {onResetFilters && (
            <Button variant="secondary" size="sm" onClick={onResetFilters}>
              {resetLabel}
            </Button>
          )}

          {onPrimary && (
            <Button size="sm" onClick={onPrimary}>
              {primaryLabel}
            </Button>
          )}
        </Toolbar.Actions>
      </Toolbar.Right>
    </Toolbar>
  );
}
