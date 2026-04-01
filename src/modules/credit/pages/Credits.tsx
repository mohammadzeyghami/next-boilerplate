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

import type { CreditDto, CreditLifeTimeDto } from "../actions/credit.actions";
import {
  useCreateCreditLifeTimeMutation,
  useCreateCreditMutation,
  useDeleteCreditLifeTimeMutation,
  useDeleteCreditMutation,
  useUpdateCreditLifeTimeMutation,
  useUpdateCreditMutation,
} from "../api/mutations";
import {
  useCreditLifeTimesPageQuery,
  useCreditsPageQuery,
  useCreditsQuery,
} from "../api/queries";
import {
  creditFormSchema,
  creditLifeTimeFormSchema,
  type CreditFormValues,
  type CreditLifeTimeFormValues,
} from "../interfaces/credit.schema";
import CreditForm from "./credit-form";
import CreditLifeTimeForm from "./credit-lifetime-form";

const emptyCreditForm: CreditFormValues = {
  name: "",
  metadataJson: "",
  contentTypes: [],
};

const emptyLifeTimeForm: CreditLifeTimeFormValues = {
  creditsId: "",
  name: "",
  metadataJson: "",
  lifeTime: 1,
};

function creditDtoToFormValues(credit: CreditDto): CreditFormValues {
  return {
    name: credit.name,
    metadataJson: credit.metadata ? JSON.stringify(credit.metadata) : "",
    contentTypes: [...credit.contentTypes],
  };
}

function creditLifeTimeDtoToFormValues(
  lifeTime: CreditLifeTimeDto,
): CreditLifeTimeFormValues {
  return {
    creditsId: lifeTime.creditsId,
    name: lifeTime.name,
    metadataJson: lifeTime.metadata ? JSON.stringify(lifeTime.metadata) : "",
    lifeTime: lifeTime.lifeTime,
  };
}

export default function CreditsPage({
  canManageCredits,
}: {
  canManageCredits: boolean;
}) {
  const [creditOpen, setCreditOpen] = useState(false);
  const [lifeTimeOpen, setLifeTimeOpen] = useState(false);
  const [creditsPage, setCreditsPage] = useState(1);
  const [lifeTimesPage, setLifeTimesPage] = useState(1);
  const pageSize = 10;
  const [editingCredit, setEditingCredit] = useState<CreditDto | null>(null);
  const [editingLifeTime, setEditingLifeTime] =
    useState<CreditLifeTimeDto | null>(null);

  const {
    data: creditsPageData,
    isPending: creditsPending,
    isError: creditsError,
    error: creditsErrorValue,
    refetch: refetchCredits,
  } = useCreditsPageQuery(creditsPage, pageSize);
  const {
    data: lifeTimesPageData,
    isPending: lifeTimesPending,
    isError: lifeTimesError,
    error: lifeTimesErrorValue,
    refetch: refetchLifeTimes,
  } = useCreditLifeTimesPageQuery(lifeTimesPage, pageSize);
  const { data: credits = [] } = useCreditsQuery();

  const createCreditMutation = useCreateCreditMutation(creditsPage, pageSize);
  const updateCreditMutation = useUpdateCreditMutation(creditsPage, pageSize);
  const deleteCreditMutation = useDeleteCreditMutation(creditsPage, pageSize);
  const createLifeTimeMutation = useCreateCreditLifeTimeMutation(
    lifeTimesPage,
    pageSize,
  );
  const updateLifeTimeMutation = useUpdateCreditLifeTimeMutation(
    lifeTimesPage,
    pageSize,
  );
  const deleteLifeTimeMutation = useDeleteCreditLifeTimeMutation(
    lifeTimesPage,
    pageSize,
  );

  const creditMethods = useForm<CreditFormValues>({
    defaultValues: emptyCreditForm,
    resolver: zodResolver(creditFormSchema),
  });
  const lifeTimeMethods = useForm<CreditLifeTimeFormValues>({
    defaultValues: emptyLifeTimeForm,
    resolver: zodResolver(creditLifeTimeFormSchema),
  });

  const creditColumns: ColumnDef<CreditDto>[] = useMemo(
    () => [
      { accessorKey: "name", header: "Name" },
      {
        id: "contentTypes",
        header: "Content Types",
        cell: ({ row }) =>
          row.original.contentTypes.length > 0
            ? row.original.contentTypes.join(", ")
            : "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString(),
      },
      ...(canManageCredits
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
                      setEditingCredit(row.original);
                      creditMethods.reset(creditDtoToFormValues(row.original));
                      setCreditOpen(true);
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
                      const res = await deleteCreditMutation.mutateAsync(
                        row.original.id,
                      );
                      if (!res.ok) {
                        toast({
                          title: "Delete failed",
                          description: res.error ?? "Try again.",
                        });
                        return;
                      }
                      toast({ title: "Credit removed" });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<CreditDto>,
          ]
        : []),
    ],
    [canManageCredits, creditMethods, deleteCreditMutation],
  );

  const lifeTimeColumns: ColumnDef<CreditLifeTimeDto>[] = useMemo(
    () => [
      { accessorKey: "creditName", header: "Credit" },
      { accessorKey: "name", header: "Name" },
      { accessorKey: "lifeTime", header: "Life Time (days)" },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString(),
      },
      ...(canManageCredits
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
                      setEditingLifeTime(row.original);
                      lifeTimeMethods.reset(
                        creditLifeTimeDtoToFormValues(row.original),
                      );
                      setLifeTimeOpen(true);
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
                      const res = await deleteLifeTimeMutation.mutateAsync(
                        row.original.id,
                      );
                      if (!res.ok) {
                        toast({
                          title: "Delete failed",
                          description: res.error ?? "Try again.",
                        });
                        return;
                      }
                      toast({ title: "Credit lifetime removed" });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ),
            } satisfies ColumnDef<CreditLifeTimeDto>,
          ]
        : []),
    ],
    [canManageCredits, deleteLifeTimeMutation, lifeTimeMethods],
  );

  const onSubmitCredit = async (values: CreditFormValues) => {
    const payload = {
      name: values.name.trim(),
      metadataJson: values.metadataJson.trim(),
      contentTypes: values.contentTypes,
    };

    const res = editingCredit
      ? await updateCreditMutation.mutateAsync({
          id: editingCredit.id,
          ...payload,
        })
      : await createCreditMutation.mutateAsync(payload);

    if (!res.ok) {
      toast({
        title: editingCredit ? "Failed to update credit" : "Failed to create credit",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({ title: editingCredit ? "Credit updated" : "Credit created" });
    creditMethods.reset(emptyCreditForm);
    setEditingCredit(null);
    setCreditOpen(false);
  };

  const onSubmitLifeTime = async (values: CreditLifeTimeFormValues) => {
    const payload = {
      creditsId: values.creditsId,
      name: values.name.trim(),
      metadataJson: values.metadataJson.trim(),
      lifeTime: Number(values.lifeTime),
    };

    const res = editingLifeTime
      ? await updateLifeTimeMutation.mutateAsync({
          id: editingLifeTime.id,
          ...payload,
        })
      : await createLifeTimeMutation.mutateAsync(payload);

    if (!res.ok) {
      toast({
        title: editingLifeTime
          ? "Failed to update credit lifetime"
          : "Failed to create credit lifetime",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({
      title: editingLifeTime
        ? "Credit lifetime updated"
        : "Credit lifetime created",
    });
    lifeTimeMethods.reset(emptyLifeTimeForm);
    setEditingLifeTime(null);
    setLifeTimeOpen(false);
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Credits", href: "/dashboard/credits" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Credits</h1>
            {canManageCredits && (
              <Button
                onClick={() => {
                  setEditingCredit(null);
                  creditMethods.reset(emptyCreditForm);
                  setCreditOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden />
                Add credit
              </Button>
            )}
          </div>

          {creditsPending && (
            <P className="text-muted-foreground text-sm">Loading credits…</P>
          )}
          {creditsError && (
            <div className="space-y-2">
              <P className="text-destructive text-sm">
                {creditsErrorValue?.message ?? "Could not load credits."}
              </P>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetchCredits()}>
                Retry
              </Button>
            </div>
          )}
          {!creditsPending && !creditsError && creditsPageData && (
            <div className="space-y-4">
              <TablePrimary data={creditsPageData.items} columns={creditColumns} />
              <ServerPagination
                currentPage={creditsPageData.page}
                totalPages={creditsPageData.totalPages}
                onPageChange={setCreditsPage}
              />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Credit Lifetimes</h2>
            {canManageCredits && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingLifeTime(null);
                  lifeTimeMethods.reset(emptyLifeTimeForm);
                  setLifeTimeOpen(true);
                }}
              >
                <Plus className="size-4" aria-hidden />
                Add lifetime
              </Button>
            )}
          </div>

          {lifeTimesPending && (
            <P className="text-muted-foreground text-sm">
              Loading credit lifetimes…
            </P>
          )}
          {lifeTimesError && (
            <div className="space-y-2">
              <P className="text-destructive text-sm">
                {lifeTimesErrorValue?.message ??
                  "Could not load credit lifetimes."}
              </P>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetchLifeTimes()}>
                Retry
              </Button>
            </div>
          )}
          {!lifeTimesPending && !lifeTimesError && lifeTimesPageData && (
            <div className="space-y-4">
              <TablePrimary
                data={lifeTimesPageData.items}
                columns={lifeTimeColumns}
              />
              <ServerPagination
                currentPage={lifeTimesPageData.page}
                totalPages={lifeTimesPageData.totalPages}
                onPageChange={setLifeTimesPage}
              />
            </div>
          )}
        </section>
      </main>

      {canManageCredits && (
        <ModalFormShell
          open={creditOpen}
          onOpenChange={(next) => {
            setCreditOpen(next);
            if (!next) setEditingCredit(null);
          }}
          methods={creditMethods}
          onSubmit={onSubmitCredit}
          title={editingCredit ? "Edit credit" : "Add credit"}
          description="Create or update a credit definition."
          size="lg"
          confirmText={editingCredit ? "Update" : "Save"}
          submitting={
            creditMethods.formState.isSubmitting ||
            createCreditMutation.isPending ||
            updateCreditMutation.isPending
          }
        >
          <CreditForm />
        </ModalFormShell>
      )}

      {canManageCredits && (
        <ModalFormShell
          open={lifeTimeOpen}
          onOpenChange={(next) => {
            setLifeTimeOpen(next);
            if (!next) setEditingLifeTime(null);
          }}
          methods={lifeTimeMethods}
          onSubmit={onSubmitLifeTime}
          title={editingLifeTime ? "Edit credit lifetime" : "Add credit lifetime"}
          description="Create or update a credit lifetime rule."
          size="lg"
          confirmText={editingLifeTime ? "Update" : "Save"}
          submitting={
            lifeTimeMethods.formState.isSubmitting ||
            createLifeTimeMutation.isPending ||
            updateLifeTimeMutation.isPending
          }
        >
          <CreditLifeTimeForm credits={credits} />
        </ModalFormShell>
      )}
    </div>
  );
}
