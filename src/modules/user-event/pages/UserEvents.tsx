"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { BreadcrumbPrimary } from "@/shared/components/molecules/breadcrumb/primary";
import { ServerPagination } from "@/shared/components/molecules/pagination/ServerPagination";
import { Button } from "@/shared/components/atoms/button";
import P from "@/shared/components/atoms/typography/P";
import { TablePrimary } from "@/shared/components/organisms/Table/Table";

import type {
  EventTypeStatisticDto,
  UserEventDto,
} from "../actions/user-event.actions";
import {
  useEventTypeStatisticsQuery,
  useUserEventsQuery,
} from "../api/queries";

function jsonPreview(value: unknown) {
  if (value === null || value === undefined) return "—";

  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 0);

  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

const eventColumns: ColumnDef<UserEventDto>[] = [
  { accessorKey: "eventType", header: "Event Type" },
  { accessorKey: "type", header: "Type" },
  {
    id: "user",
    header: "User",
    cell: ({ row }) =>
      row.original.userEmail || row.original.userName || row.original.userId,
  },
  {
    id: "entity",
    header: "Entity",
    cell: ({ row }) =>
      row.original.entityType && row.original.entityId
        ? `${row.original.entityType}:${row.original.entityId}`
        : "—",
  },
  {
    accessorKey: "payload",
    header: "Payload",
    cell: ({ row }) => jsonPreview(row.original.payload),
  },
  {
    accessorKey: "metadata",
    header: "Metadata",
    cell: ({ row }) => jsonPreview(row.original.metadata),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) =>
      new Date(getValue<string>()).toLocaleString(),
  },
];

const statisticColumns: ColumnDef<EventTypeStatisticDto>[] = [
  { accessorKey: "eventType", header: "Event Type" },
  { accessorKey: "count", header: "Count" },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => new Date(getValue<string>()).toLocaleString(),
  },
];

export default function UserEventsPage() {
  const [eventsPage, setEventsPage] = useState(1);
  const [statisticsPage, setStatisticsPage] = useState(1);
  const pageSize = 10;

  const {
    data: eventsData,
    isPending: eventsPending,
    isError: eventsError,
    error: eventsErrorValue,
    refetch: refetchEvents,
  } = useUserEventsQuery(eventsPage, pageSize);

  const {
    data: statisticsData,
    isPending: statisticsPending,
    isError: statisticsError,
    error: statisticsErrorValue,
    refetch: refetchStatistics,
  } = useEventTypeStatisticsQuery(statisticsPage, pageSize);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "User Events", href: "/dashboard/user-events" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">User Events</h1>
          </div>

          {eventsPending && (
            <P className="text-muted-foreground text-sm">Loading events…</P>
          )}
          {eventsError && (
            <div className="space-y-2">
              <P className="text-destructive text-sm">
                {eventsErrorValue?.message ?? "Could not load user events."}
              </P>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetchEvents()}>
                Retry
              </Button>
            </div>
          )}
          {!eventsPending && !eventsError && eventsData && (
            <div className="space-y-4">
              <TablePrimary data={eventsData.items} columns={eventColumns} />
              <ServerPagination
                currentPage={eventsData.page}
                totalPages={eventsData.totalPages}
                onPageChange={setEventsPage}
              />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Event Type Statistics</h2>
          </div>

          {statisticsPending && (
            <P className="text-muted-foreground text-sm">
              Loading statistics…
            </P>
          )}
          {statisticsError && (
            <div className="space-y-2">
              <P className="text-destructive text-sm">
                {statisticsErrorValue?.message ??
                  "Could not load event statistics."}
              </P>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetchStatistics()}
              >
                Retry
              </Button>
            </div>
          )}
          {!statisticsPending && !statisticsError && statisticsData && (
            <div className="space-y-4">
              <TablePrimary
                data={statisticsData.items}
                columns={statisticColumns}
              />
              <ServerPagination
                currentPage={statisticsData.page}
                totalPages={statisticsData.totalPages}
                onPageChange={setStatisticsPage}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
