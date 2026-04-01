"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { BreadcrumbPrimary } from "@/shared/components/molecules/breadcrumb/primary";
import { ServerPagination } from "@/shared/components/molecules/pagination/ServerPagination";
import { Button } from "@/shared/components/atoms/button";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import P from "@/shared/components/atoms/typography/P";
import { TablePrimary } from "@/shared/components/organisms/Table/Table";
import { ModalFormShell } from "@/shared/components/organisms/modal-shell/ModalFormShell";

import type { CurrencyDto } from "../actions/currency.actions";
import {
  useCreateCurrencyMutation,
  useDeleteCurrencyMutation,
  useUpdateCurrencyMutation,
} from "../api/mutations";
import { useCurrenciesQuery } from "../api/queries";
import {
  currencyFormSchema,
  type CurrencyFormValues,
} from "../interfaces/currency.schema";
import CurrencyForm from "./currency-form";

const emptyCurrencyForm: CurrencyFormValues = {
  name: "",
  key: "",
  metadataJson: "",
  contentTypes: [],
  defaultValue: 0,
  stableValue: 1,
};

function currencyDtoToFormValues(currency: CurrencyDto): CurrencyFormValues {
  return {
    name: currency.name,
    key: currency.key,
    metadataJson: currency.metadata ? JSON.stringify(currency.metadata) : "",
    contentTypes: [...currency.contentTypes],
    defaultValue: currency.defaultValue,
    stableValue: currency.stableValue,
  };
}

export default function CurrencyPage({
  canManageCurrencies,
}: {
  canManageCurrencies: boolean;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<CurrencyDto | null>(null);

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useCurrenciesQuery(page, pageSize);

  const createMutation = useCreateCurrencyMutation(page, pageSize);
  const updateMutation = useUpdateCurrencyMutation(page, pageSize);
  const deleteMutation = useDeleteCurrencyMutation(page, pageSize);

  const methods = useForm<CurrencyFormValues>({
    defaultValues: emptyCurrencyForm,
    resolver: zodResolver(currencyFormSchema),
  });

  const columns: ColumnDef<CurrencyDto>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "key", header: "Key" },
      {
        id: "contentTypes",
        header: "Content Types",
        cell: ({ row }) =>
          row.original.contentTypes.length > 0
            ? row.original.contentTypes.join(", ")
            : "—",
      },
      { accessorKey: "defaultValue", header: "Default" },
      { accessorKey: "stableValue", header: "Stable" },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString(),
      },
      ...(canManageCurrencies
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <div className="flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingCurrency(row.original);
                      methods.reset(currencyDtoToFormValues(row.original));
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={async () => {
                      const res = await deleteMutation.mutateAsync(row.original.id);
                      if (!res.ok) {
                        toast({
                          title: "Delete failed",
                          description: res.error ?? "Try again.",
                        });
                        return;
                      }
                      toast({ title: "Currency removed" });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<CurrencyDto>,
          ]
        : []),
    ],
    [canManageCurrencies, deleteMutation, methods],
  );

  const onSubmit = async (values: CurrencyFormValues) => {
    const payload = {
      name: values.name.trim(),
      key: values.key.trim(),
      metadataJson: values.metadataJson.trim(),
      contentTypes: values.contentTypes,
      defaultValue: Number(values.defaultValue),
      stableValue: Number(values.stableValue),
    };

    const res = editingCurrency
      ? await updateMutation.mutateAsync({ id: editingCurrency.id, ...payload })
      : await createMutation.mutateAsync(payload);

    if (!res.ok) {
      toast({
        title: editingCurrency
          ? "Failed to update currency"
          : "Failed to create currency",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({ title: editingCurrency ? "Currency updated" : "Currency created" });
    methods.reset(emptyCurrencyForm);
    setEditingCurrency(null);
    setOpen(false);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Currencies", href: "/dashboard/currencies" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Currencies</h1>
          {canManageCurrencies && (
            <Button
              onClick={() => {
                setEditingCurrency(null);
                methods.reset(emptyCurrencyForm);
                setOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Add currency
            </Button>
          )}
        </div>

        {isPending && (
          <P className="text-muted-foreground text-sm">Loading currencies…</P>
        )}
        {isError && (
          <div className="space-y-2">
            <P className="text-destructive text-sm">
              {error?.message ?? "Could not load currencies."}
            </P>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        )}
        {!isPending && !isError && data && (
          <div className="space-y-4">
            <TablePrimary data={data.items} columns={columns} />
            <ServerPagination
              currentPage={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </main>

      {canManageCurrencies && (
        <ModalFormShell
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditingCurrency(null);
          }}
          methods={methods}
          onSubmit={onSubmit}
          title={editingCurrency ? "Edit currency" : "Add currency"}
          description="Create or update a currency definition."
          size="lg"
          confirmText={editingCurrency ? "Update" : "Save"}
          submitting={
            methods.formState.isSubmitting ||
            createMutation.isPending ||
            updateMutation.isPending
          }
        >
          <CurrencyForm />
        </ModalFormShell>
      )}
    </div>
  );
}
