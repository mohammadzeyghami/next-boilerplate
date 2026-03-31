"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { TablePrimary } from "@/shared/components/organisms/Table/Table";
import { BreadcrumbPrimary } from "@/shared/components/molecules/breadcrumb/primary";
import { Button } from "@/shared/components/atoms/button";
import { ModalFormShell } from "@/shared/components/organisms/modal-shell/ModalFormShell";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import P from "@/shared/components/atoms/typography/P";

import type { CategoryDto } from "../actions/category.actions";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "../interfaces/category.schema";
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useUpdateCategoryMutation,
} from "../api/mutations";
import {
  useCategoriesQuery,
  useCategoryContentOptionsQuery,
} from "../api/queries";
import CategoryForm from "./form";

const emptyCategoryForm: CategoryFormValues = {
  name: "",
  description: "",
  label: "",
  metadataJson: "",
  contentIds: [],
};

function categoryDtoToFormValues(c: CategoryDto): CategoryFormValues {
  return {
    name: c.name,
    description: c.description ?? "",
    label: c.label ?? "",
    metadataJson: c.metadata ? JSON.stringify(c.metadata) : "",
    contentIds: [...c.contentIds],
  };
}

export default function CategoryPage({
  canManageCategories,
}: {
  canManageCategories: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(
    null,
  );

  const {
    data: categories = [],
    isPending,
    isError,
    error,
    refetch,
  } = useCategoriesQuery();

  const { data: contentOptions = [] } = useCategoryContentOptionsQuery(
    canManageCategories && dialogOpen,
  );

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const methods = useForm<CategoryFormValues>({
    defaultValues: emptyCategoryForm,
    resolver: zodResolver(categoryFormSchema),
  });

  const openCreateDialog = useCallback(() => {
    setEditingCategory(null);
    methods.reset(emptyCategoryForm);
    setDialogOpen(true);
  }, [methods]);

  const openEditDialog = useCallback(
    (category: CategoryDto) => {
      setEditingCategory(category);
      methods.reset(categoryDtoToFormValues(category));
      setDialogOpen(true);
    },
    [methods],
  );

  const onDialogOpenChange = (next: boolean) => {
    setDialogOpen(next);
    if (!next) {
      setEditingCategory(null);
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    const payload = {
      name: values.name.trim(),
      description: values.description.trim(),
      label: values.label.trim(),
      metadataJson: values.metadataJson.trim(),
      contentIds: values.contentIds,
    };

    if (editingCategory) {
      const res = await updateMutation.mutateAsync({
        id: editingCategory.id,
        ...payload,
      });

      if (!res.ok) {
        toast({
          title: "Failed to update category",
          description: res.error ?? "Please try again.",
        });
        return;
      }

      toast({ title: "Category updated" });
    } else {
      const res = await createMutation.mutateAsync(payload);

      if (!res.ok) {
        toast({
          title: "Failed to create category",
          description: res.error ?? "Please try again.",
        });
        return;
      }

      toast({ title: "Category created" });
    }

    methods.reset(emptyCategoryForm);
    setEditingCategory(null);
    setDialogOpen(false);
  };

  const columns: ColumnDef<CategoryDto>[] = useMemo(
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
      ...(canManageCategories
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
                      toast({ title: "Category removed" });
                    }}
                    aria-label={`Delete ${row.original.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<CategoryDto>,
          ]
        : []),
    ],
    [
      canManageCategories,
      deleteMutation,
      openEditDialog,
      updateMutation.isPending,
    ],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Categories", href: "/dashboard/categories" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Categories</h1>
          {canManageCategories && (
            <Button onClick={openCreateDialog}>
              <Plus className="size-4" aria-hidden />
              Add category
            </Button>
          )}
        </div>

        {isPending && (
          <P className="text-muted-foreground text-sm">Loading categories…</P>
        )}
        {isError && (
          <div className="space-y-2">
            <P className="text-destructive text-sm">
              {error?.message ?? "Could not load categories."}
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
        {!isPending && !isError && (
          <TablePrimary data={categories} columns={columns} />
        )}
      </main>

      {canManageCategories && (
        <ModalFormShell
          open={dialogOpen}
          onOpenChange={onDialogOpenChange}
          methods={methods}
          onSubmit={onSubmit}
          title={editingCategory ? "Edit category" : "Add category"}
          description={
            editingCategory
              ? "Update this category’s fields and linked contents."
              : "Create a category with optional label, metadata, and linked contents."
          }
          size="lg"
          confirmText={editingCategory ? "Update" : "Save"}
          submitting={
            methods.formState.isSubmitting ||
            createMutation.isPending ||
            updateMutation.isPending
          }
        >
          {/* contentOptions={contentOptions} */}
          <CategoryForm />
        </ModalFormShell>
      )}
    </div>
  );
}
