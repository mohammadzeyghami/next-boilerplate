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
import {
  metadataEntriesFromUnknown,
  metadataObjectFromEntries,
} from "@/shared/utils/metadata";

import type { MetaDto } from "../actions/meta.actions";
import {
  useCreateMetaMutation,
  useDeleteMetaMutation,
  useUpdateMetaMutation,
} from "../api/mutations";
import { useMetaContentOptionsQuery, useMetasQuery } from "../api/queries";
import { metaFormSchema, type MetaFormValues } from "../interfaces/meta.schema";
import MetaForm from "./meta-form";

const emptyMetaForm: MetaFormValues = {
  name: "",
  key: "",
  metadataEntries: [{ key: "", value: "" }],
  contentIds: [],
  defaultValue: 0,
  minValue: Number.NaN,
  maxValue: Number.NaN,
};

function metaDtoToFormValues(meta: MetaDto): MetaFormValues {
  return {
    name: meta.name,
    key: meta.key,
    metadataEntries: metadataEntriesFromUnknown(meta.metadata),
    contentIds: [...meta.contentIds],
    defaultValue: meta.defaultValue,
    minValue: meta.minValue ?? Number.NaN,
    maxValue: meta.maxValue ?? Number.NaN,
  };
}

function normalizeNullableNumber(value: number | undefined) {
  return value === undefined || Number.isNaN(value) ? null : Number(value);
}

export default function MetaPage({ canManageMetas }: { canManageMetas: boolean }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaDto | null>(null);

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useMetasQuery(page, pageSize);
  const { data: contentOptions = [] } = useMetaContentOptionsQuery(
    canManageMetas && open,
  );

  const createMutation = useCreateMetaMutation(page, pageSize);
  const updateMutation = useUpdateMetaMutation(page, pageSize);
  const deleteMutation = useDeleteMetaMutation(page, pageSize);

  const methods = useForm<MetaFormValues>({
    defaultValues: emptyMetaForm,
    resolver: zodResolver(metaFormSchema),
  });

  const columns: ColumnDef<MetaDto>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      { accessorKey: "key", header: "Key" },
      {
        id: "contentIds",
        header: "Linked contents",
        cell: ({ row }) =>
          row.original.contentIds.length > 0
            ? row.original.contentIds.join(", ")
            : "—",
      },
      { accessorKey: "defaultValue", header: "Default" },
      {
        id: "range",
        header: "Range",
        cell: ({ row }) => {
          const { minValue, maxValue } = row.original;
          if (minValue === null && maxValue === null) return "—";
          return `${minValue ?? "−∞"} → ${maxValue ?? "+∞"}`;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString(),
      },
      ...(canManageMetas
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
                      setEditingMeta(row.original);
                      methods.reset(metaDtoToFormValues(row.original));
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
                      toast({ title: "Meta removed" });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<MetaDto>,
          ]
        : []),
    ],
    [canManageMetas, deleteMutation, methods],
  );

  const onSubmit = async (values: MetaFormValues) => {
    const payload = {
      name: values.name.trim(),
      key: values.key.trim(),
      metadataJson: JSON.stringify(
        metadataObjectFromEntries(values.metadataEntries) ?? {},
      ),
      contentIds: values.contentIds,
      defaultValue: Number(values.defaultValue),
      minValue: normalizeNullableNumber(values.minValue),
      maxValue: normalizeNullableNumber(values.maxValue),
    };

    const res = editingMeta
      ? await updateMutation.mutateAsync({ id: editingMeta.id, ...payload })
      : await createMutation.mutateAsync(payload);

    if (!res.ok) {
      toast({
        title: editingMeta ? "Failed to update meta" : "Failed to create meta",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({ title: editingMeta ? "Meta updated" : "Meta created" });
    methods.reset(emptyMetaForm);
    setEditingMeta(null);
    setOpen(false);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Metas", href: "/dashboard/metas" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Metas</h1>
          {canManageMetas && (
            <Button
              onClick={() => {
                setEditingMeta(null);
                methods.reset(emptyMetaForm);
                setOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden />
              Add meta
            </Button>
          )}
        </div>

        {isPending && <P className="text-muted-foreground text-sm">Loading metas…</P>}
        {isError && (
          <div className="space-y-2">
            <P className="text-destructive text-sm">
              {error?.message ?? "Could not load metas."}
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

      <ModalFormShell
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setEditingMeta(null);
            methods.reset(emptyMetaForm);
          }
        }}
        methods={methods}
        onSubmit={onSubmit}
        title={editingMeta ? "Edit meta" : "Create meta"}
        description="Metas are non-consumable values like XP, Level, or Score."
        confirmText={editingMeta ? "Save changes" : "Create meta"}
        submitting={createMutation.isPending || updateMutation.isPending}
      >
        <MetaForm contentOptions={contentOptions} />
      </ModalFormShell>
    </div>
  );
}
