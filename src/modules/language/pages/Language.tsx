"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { TablePrimary } from "@/shared/components/organisms/Table/Table";
import { BreadcrumbPrimary } from "@/shared/components/molecules/breadcrumb/primary";
import { Button } from "@/shared/components/atoms/button";
import { ModalFormShell } from "@/shared/components/organisms/modal-shell/ModalFormShell";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import P from "@/shared/components/atoms/typography/P";

import type { LanguageDto } from "../actions/language.actions";
import {
  languageFormSchema,
  type LanguageFormValues,
} from "../interfaces/language.schema";
import {
  useCreateLanguageMutation,
  useDeleteLanguageMutation,
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

  const {
    data: languages = [],
    isPending,
    isError,
    error,
    refetch,
  } = useLanguagesQuery();

  const { data: contentOptions = [] } = useLanguageContentOptionsQuery(
    canManageLanguages && open,
  );

  const createMutation = useCreateLanguageMutation();
  const deleteMutation = useDeleteLanguageMutation();

  const methods = useForm<LanguageFormValues>({
    defaultValues: {
      name: "",
      description: "",
      contentIds: [],
    },
    resolver: zodResolver(languageFormSchema),
  });

  const onSubmit = async (values: LanguageFormValues) => {
    const res = await createMutation.mutateAsync({
      name: values.name.trim(),
      description: values.description.trim(),
      contentIds: values.contentIds,
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
                    toast({ title: "Language removed" });
                  }}
                  aria-label={`Delete ${row.original.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              ),
            } satisfies ColumnDef<LanguageDto>,
          ]
        : []),
    ],
    [canManageLanguages, deleteMutation],
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
          <LanguageForm contentOptions={contentOptions} />
        </ModalFormShell>
      )}
    </div>
  );
}
