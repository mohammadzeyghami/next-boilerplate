"use client";

import { useMemo, useState } from "react";
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
import { useCategoriesQuery } from "@/modules/category/api/queries";
import { useTagsQuery } from "@/modules/tag/api/queries";

import type { LanguageDto } from "../actions/language.actions";
import {
  languageFormSchema,
  type LanguageFormValues,
} from "../interfaces/language.schema";
import {
  useCreateLanguageMutation,
  useDeleteLanguageMutation,
  useUpdateLanguageMutation,
} from "../api/mutations";
import {
  useLanguageContentOptionsQuery,
  useLanguagesQuery,
} from "../api/queries";
import LanguageForm from "./form";

export default function LanguagePage({
  canManageLanguages,
}: {
  canManageLanguages: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<LanguageDto | null>(
    null,
  );

  const {
    data: languages = [],
    isPending,
    isError,
    error,
    refetch,
  } = useLanguagesQuery();

  const { data: contentOptions = [] } = useLanguageContentOptionsQuery(
    canManageLanguages && (open || Boolean(editingLanguage)),
  );
  const { data: categories = [] } = useCategoriesQuery();
  const { data: tags = [] } = useTagsQuery();

  const createMutation = useCreateLanguageMutation();
  const deleteMutation = useDeleteLanguageMutation();
  const updateMutation = useUpdateLanguageMutation();

  const methods = useForm<LanguageFormValues>({
    defaultValues: {
      name: "",
      description: "",
      contentIds: [],
      categoryIds: [],
      tagIds: [],
    },
    resolver: zodResolver(languageFormSchema),
  });

  const onSubmit = async (values: LanguageFormValues) => {
    const res = await createMutation.mutateAsync({
      name: values.name.trim(),
      description: values.description.trim(),
      contentIds: values.contentIds,
      categoryIds: values.categoryIds,
      tagIds: values.tagIds,
    });

    if (!res.ok) {
      toast({
        title: "Failed to create language",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({ title: "Language created" });
    methods.reset();
    setOpen(false);
  };

  const editMethods = useForm<LanguageFormValues>({
    defaultValues: {
      name: "",
      description: "",
      contentIds: [],
      categoryIds: [],
      tagIds: [],
    },
    resolver: zodResolver(languageFormSchema),
  });

  const onEditSubmit = async (values: LanguageFormValues) => {
    if (!editingLanguage) return;

    const res = await updateMutation.mutateAsync({
      id: editingLanguage.id,
      name: values.name.trim(),
      description: values.description.trim(),
      contentIds: values.contentIds,
      categoryIds: values.categoryIds,
      tagIds: values.tagIds,
    });

    if (!res.ok) {
      toast({
        title: "Failed to update language",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({ title: "Language updated" });
    editMethods.reset();
    setEditingLanguage(null);
  };

  const columns: ColumnDef<LanguageDto>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => {
          const v = getValue<string | null>();
          return v || "—";
        },
      },
      {
        id: "contentIds",
        header: "Contents",
        cell: ({ row }) => row.original.contentIds.length,
      },
      {
        id: "categoryIds",
        header: "Categories",
        cell: ({ row }) => row.original.categoryIds.length,
      },
      {
        id: "tagIds",
        header: "Tags",
        cell: ({ row }) => row.original.tagIds.length,
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString(),
      },
      ...(canManageLanguages
        ? [
            {
              id: "actions",
              header: "",
              cell: ({ row }) => (
                <div
                  data-table-no-copy
                  className="flex items-center justify-end gap-1"
                >
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted"
                    aria-label={`Edit ${row.original.name}`}
                    title="Edit"
                    onClick={() => {
                      editMethods.reset({
                        name: row.original.name,
                        description: row.original.description ?? "",
                        contentIds: row.original.contentIds,
                        categoryIds: row.original.categoryIds,
                        tagIds: row.original.tagIds,
                      });
                      setEditingLanguage(row.original);
                    }}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={async () => {
                      console.log(row.original);
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
                      toast({ title: "Language removed" });
                    }}
                    aria-label={`Delete ${row.original.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<LanguageDto>,
          ]
        : []),
    ],
    [canManageLanguages, deleteMutation, editMethods],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Languages", href: "/dashboard/languages" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Languages</h1>
          {canManageLanguages && (
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Add language
            </Button>
          )}
        </div>

        {isPending && (
          <P className="text-muted-foreground text-sm">Loading languages…</P>
        )}
        {isError && (
          <div className="space-y-2">
            <P className="text-destructive text-sm">
              {error?.message ?? "Could not load languages."}
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
          <TablePrimary data={languages} columns={columns} />
        )}
      </main>

      {canManageLanguages && (
        <ModalFormShell
          open={open}
          onOpenChange={setOpen}
          methods={methods}
          onSubmit={onSubmit}
          title="Add language"
          description="Create a catalog language and optionally link contents."
          size="lg"
          confirmText="Save"
          submitting={
            methods.formState.isSubmitting || createMutation.isPending
          }
        >
          <LanguageForm
            contentOptions={contentOptions}
            categories={categories}
            tags={tags}
            canManageCategories={canManageLanguages}
            canManageTags={canManageLanguages}
          />
        </ModalFormShell>
      )}

      {canManageLanguages && editingLanguage && (
        <ModalFormShell
          open={Boolean(editingLanguage)}
          onOpenChange={(next) => {
            if (!next) {
              editMethods.reset();
              setEditingLanguage(null);
            }
          }}
          methods={editMethods}
          onSubmit={onEditSubmit}
          title="Edit language"
          description="Update the language details and linked contents."
          size="lg"
          confirmText="Save changes"
          submitting={
            editMethods.formState.isSubmitting || updateMutation.isPending
          }
        >
          <LanguageForm
            contentOptions={contentOptions}
            categories={categories}
            tags={tags}
            canManageCategories={canManageLanguages}
            canManageTags={canManageLanguages}
          />
        </ModalFormShell>
      )}
    </div>
  );
}
