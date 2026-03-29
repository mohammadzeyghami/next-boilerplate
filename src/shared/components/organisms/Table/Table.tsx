"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../atoms/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function TablePrimary<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleCopy = async (value: unknown) => {
    if (value === null || value === undefined) return;

    const text =
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  function shouldIgnoreCopyClick(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return true;
    return Boolean(
      target.closest(
        "button, a, input, textarea, select, [data-table-no-copy]",
      ),
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <>
      <div className="block lg:hidden space-y-3">
        {rows.length ? (
          rows.map((row, index) => (
            <motion.div
              key={row.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="overflow-hidden rounded-xl border bg-background shadow-sm"
            >
              <div className="border-b px-4 py-3">
                <button
                  type="button"
                  onClick={() => handleCopy(index + 1)}
                  className="text-sm font-semibold cursor-pointer"
                >
                  #{index + 1}
                </button>
              </div>

              <div className="divide-y">
                {row.getVisibleCells().map((cell) => {
                  const header = cell.column.columnDef.header;

                  return (
                    <div
                      key={cell.id}
                      onClick={(e) => {
                        if (shouldIgnoreCopyClick(e.target)) return;
                        void handleCopy(cell.getValue());
                      }}
                      className="flex w-full cursor-pointer items-start justify-between gap-4 px-4 py-3 text-left transition-opacity hover:opacity-80"
                    >
                      <span className="min-w-[100px] shrink-0 text-xs font-medium text-muted-foreground">
                        {typeof header === "string"
                          ? header
                          : cell.column.id}
                      </span>

                      <span className="flex-1 break-words text-right text-sm font-medium">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex min-h-24 items-center justify-center rounded-xl border text-sm text-muted-foreground">
            No results.
          </div>
        )}
      </div>

      <div className="hidden lg:block overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-14">#</TableHead>

                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {rows.length ? (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  <TableCell
                    className="cursor-pointer"
                    onClick={(e) => {
                      if (shouldIgnoreCopyClick(e.target)) return;
                      void handleCopy(index + 1);
                    }}
                  >
                    {index + 1}
                  </TableCell>

                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="cursor-pointer"
                      onClick={(e) => {
                        if (shouldIgnoreCopyClick(e.target)) return;
                        void handleCopy(cell.getValue());
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}