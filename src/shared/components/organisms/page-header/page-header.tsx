import { cn } from "@/lib/utils";
import { Separator } from "@/shared/components/atoms/separator";
import { Skeleton } from "@/shared/components/atoms/skeleton";
import * as React from "react";

type BreadcrumbItem = {
  label: React.ReactNode;
  href?: string;
  icon?: React.ReactNode;
};

type WithChildren<T = unknown> = T & { children?: React.ReactNode };

function PageHeader({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "w-full",
        // spacing
        "py-4 md:py-6",
        className
      )}
    >
      <div className="flex min-h-10 items-center justify-between gap-3">
        {/* Left: Breadcrumbs + Title/Description */}
        <div className="min-w-0 flex-1">{children}</div>

        {/* Right: Actions (if user places <PageHeader.Actions />) */}
        {/* We don't force layout here; Actions uses absolute slot below */}
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Subcomponents (compound API)
 * You can use: <PageHeader><PageHeader.Breadcrumbs /><PageHeader.Title />...</PageHeader>
 * ──────────────────────────────────────────────────────────────────────────── */

function PageHeaderRow({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="page-header-row"
      className={cn("flex items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

function PageHeaderBreadcrumbs({
  className,
  items,
  children,
  separator = "∙",
}: WithChildren<{
  className?: string;
  items?: BreadcrumbItem[];
  separator?: React.ReactNode;
}>) {
  if (!items?.length && !children) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      data-slot="page-header-breadcrumbs"
      className={cn("mb-1 text-xs text-muted-foreground", className)}
    >
      {items?.length ? (
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((it, i) => {
            const isLast = i === items.length - 1;
            const content = (
              <span className="inline-flex items-center gap-1">
                {it.icon ? <span className="size-3">{it.icon}</span> : null}
                <span
                  className={cn(isLast ? "text-foreground" : "hover:underline")}
                >
                  {it.label}
                </span>
              </span>
            );

            return (
              <li key={i} className="inline-flex items-center">
                {it.href && !isLast ? (
                  <a
                    href={it.href}
                    className="outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
                  >
                    {content}
                  </a>
                ) : (
                  <span aria-current={isLast ? "page" : undefined}>
                    {content}
                  </span>
                )}
                {!isLast && (
                  <span className="mx-1 text-muted-foreground">
                    {separator}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        children
      )}
    </nav>
  );
}

function PageHeaderTitle({
  className,
  children,
  icon,
  after,
}: WithChildren<{
  className?: string;
  icon?: React.ReactNode;
  after?: React.ReactNode;
}>) {
  return (
    <PageHeaderRow className={cn("justify-start", className)}>
      {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      <h1
        data-slot="page-header-title"
        className={cn(
          "text-xl font-semibold leading-tight tracking-tight md:text-2xl",
          "truncate"
        )}
        title={typeof children === "string" ? children : undefined}
      >
        {children}
      </h1>
      {after ? (
        <div className="ml-2 inline-flex items-center gap-1">{after}</div>
      ) : null}
    </PageHeaderRow>
  );
}

function PageHeaderDescription({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  if (!children) return null;
  return (
    <p
      data-slot="page-header-description"
      className={cn(
        "mt-1 max-w-prose text-sm text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}

/**
 * Right-aligned actions. Place inside <PageHeader> but render at the right.
 * We use CSS to push it to the right in the header’s first row context.
 */
function PageHeaderActions({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  if (!children) return null;
  return (
    <div
      data-slot="page-header-actions"
      className={cn("ml-auto flex shrink-0 items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

/**
 * Optional meta row (badges, counts, small stats) under the title/desc.
 */
function PageHeaderMeta({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  if (!children) return null;
  return (
    <div
      data-slot="page-header-meta"
      className={cn(
        "mt-2 flex flex-wrap items-center gap-2 text-xs",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Optional tabs strip. You pass in your Tabs (from Shared) or any custom node.
 */
function PageHeaderTabs({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  if (!children) return null;
  return (
    <div data-slot="page-header-tabs" className={cn("mt-4", className)}>
      <Separator className="mb-3" />
      {children}
    </div>
  );
}

/**
 * Skeleton variant for loading states.
 */
function PageHeaderSkeleton() {
  return (
    <div className="py-4 md:py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2">
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-64" />
          <div className="mt-2">
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    </div>
  );
}

/* Attach compound parts to the main component for a tidy API */
PageHeader.Row = PageHeaderRow;
PageHeader.Breadcrumbs = PageHeaderBreadcrumbs;
PageHeader.Title = PageHeaderTitle;
PageHeader.Description = PageHeaderDescription;
PageHeader.Actions = PageHeaderActions;
PageHeader.Meta = PageHeaderMeta;
PageHeader.Tabs = PageHeaderTabs;
PageHeader.Skeleton = PageHeaderSkeleton;

export { PageHeader };
