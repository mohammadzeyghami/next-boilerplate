"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { TablePrimary } from "@/shared/components/organisms/Table/Table";
import { BreadcrumbPrimary } from "@/shared/components/molecules/breadcrumb/primary";
import { ServerPagination } from "@/shared/components/molecules/pagination/ServerPagination";
import { Button } from "@/shared/components/atoms/button";
import { ModalFormShell } from "@/shared/components/organisms/modal-shell/ModalFormShell";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import P from "@/shared/components/atoms/typography/P";
import {
  metadataEntriesFromUnknown,
  metadataObjectFromEntries,
} from "@/shared/utils/metadata";

import type { TagDto } from "../actions/tag.actions";
import { tagFormSchema, type TagFormValues } from "../interfaces/tag.schema";
import {
  useCreateTagMutation,
  useDeleteTagMutation,
  useUpdateTagMutation,
} from "../api/mutations";
import { useTagsPageQuery } from "../api/queries";
import TagForm from "./form";

const emptyTagForm: TagFormValues = {
  name: "",
  description: "",
  label: "",
  metadataEntries: [{ key: "", value: "" }],
  contentIds: [],
};

function tagDtoToFormValues(t: TagDto): TagFormValues {
  return {
    name: t.name,
    description: t.description ?? "",
    label: t.label ?? "",
    metadataEntries: metadataEntriesFromUnknown(t.metadata),
    contentIds: [...t.contentIds],
  };
}

export default function TagPage({ canManageTags }: { canManageTags: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [editingTag, setEditingTag] = useState<TagDto | null>(null);

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
  } = useTagsPageQuery(page, pageSize);

  const createMutation = useCreateTagMutation(page, pageSize);
  const updateMutation = useUpdateTagMutation(page, pageSize);
  const deleteMutation = useDeleteTagMutation(page, pageSize);

  const methods = useForm<TagFormValues>({
    defaultValues: emptyTagForm,
    resolver: zodResolver(tagFormSchema),
  });

  const openCreateDialog = useCallback(() => {
    setEditingTag(null);
    methods.reset(emptyTagForm);
    setDialogOpen(true);
  }, [methods]);

  const openEditDialog = useCallback(
    (tag: TagDto) => {
      setEditingTag(tag);
      methods.reset(tagDtoToFormValues(tag));
      setDialogOpen(true);
    },
    [methods],
  );

  const onDialogOpenChange = (next: boolean) => {
    setDialogOpen(next);
    if (!next) {
      setEditingTag(null);
    }
  };

  const onSubmit = async (values: TagFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      label: values.label.trim(),
      metadataJson: JSON.stringify(
        metadataObjectFromEntries(values.metadataEntries) ?? {},
      ),
      contentIds: values.contentIds,
    };

    if (editingTag) {
      const res = await updateMutation.mutateAsync({
        id: editingTag.id,
        ...payload,
      });

      if (!res.ok) {
        toast({
          title: "Failed to update tag",
          description: res.error ?? "Please try again.",
        });
        return;
      }

      toast({ title: "Tag updated" });
    } else {
      const res = await createMutation.mutateAsync(payload);

      if (!res.ok) {
        toast({
          title: "Failed to create tag",
          description: res.error ?? "Please try again.",
        });
        return;
      }

      toast({ title: "Tag created" });
    }

    methods.reset(emptyTagForm);
    setEditingTag(null);
    setDialogOpen(false);
  };

  const columns: ColumnDef<TagDto>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "label",
        header: "Label",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      {
        id: "metadata",
        header: "Metadata",
        cell: ({ row }) => (row.original.metadata ? "Yes" : "—"),
      },
      {
        id: "contentIds",
        header: "Contents",
        cell: ({ row }) => row.original.contentIds.length,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString(),
      },
      ...(canManageTags
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
                    disabled={
                      deleteMutation.isPending || updateMutation.isPending
                    }
                    onClick={() => openEditDialog(row.original)}
                    aria-label={`Edit ${row.original.name}`}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      const res = await deleteMutation.mutateAsync(
                        row.original.id,
                      );
                      if (!res.ok) {
                        toast({
                          title: "Delete failed",
                          description: res.error ?? "Try again.",
                        });
                        return;
                      }
                      toast({ title: "Tag removed" });
                    }}
                    aria-label={`Delete ${row.original.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<TagDto>,
          ]
        : []),
    ],
    [canManageTags, deleteMutation, openEditDialog, updateMutation.isPending],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Tags", href: "/dashboard/tags" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Tags</h1>
          {canManageTags && (
            <Button onClick={openCreateDialog}>
              <Plus className="size-4" aria-hidden />
              Add tag
            </Button>
          )}
        </div>

        {isPending && (
          <P className="text-muted-foreground text-sm">Loading tags…</P>
        )}
        {isError && (
          <div className="space-y-2">
            <P className="text-destructive text-sm">
              {error?.message ?? "Could not load tags."}
            </P>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void refetch()}
            >
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

      {canManageTags && (
        <ModalFormShell
          open={dialogOpen}
          onOpenChange={onDialogOpenChange}
          methods={methods}
          onSubmit={onSubmit}
          title={editingTag ? "Edit tag" : "Add tag"}
          description={
            editingTag
              ? "Update this tag’s fields and linked contents."
              : "Create a tag with optional label, metadata, and linked contents."
          }
          size="lg"
          confirmText={editingTag ? "Update" : "Save"}
          submitting={
            methods.formState.isSubmitting ||
            createMutation.isPending ||
            updateMutation.isPending
          }
        >
          <TagForm />
        </ModalFormShell>
      )}
    </div>
  );
}
