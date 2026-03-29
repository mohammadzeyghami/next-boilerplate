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
import InputR from "@/shared/components/molecules/inputs/Controllerd";
import SelectR from "@/shared/components/molecules/inputs/SelectR";

import type { AdminUserRowDto } from "../actions/admin-users.actions";
import {
  adminUserCreateSchema,
  adminUserEditSchema,
  type AdminUserCreateValues,
  type AdminUserEditValues,
} from "../interfaces/admin-users.schema";
import {
  useCreateAdminUserMutation,
  useDeleteAdminUserMutation,
  useUpdateAdminUserMutation,
} from "../api/mutations";
import { useAdminUsersQuery } from "../api/queries";
import Collapse from "@/shared/components/molecules/collapse/Primary";

export default function AdminUsersPage({
  canAssignSuperAdmin,
}: {
  canAssignSuperAdmin: boolean;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<AdminUserRowDto | null>(null);

  const {
    data: rows = [],
    isPending,
    isError,
    error,
    refetch,
  } = useAdminUsersQuery();

  const createMutation = useCreateAdminUserMutation();
  const updateMutation = useUpdateAdminUserMutation();
  const deleteMutation = useDeleteAdminUserMutation();

  const createMethods = useForm<AdminUserCreateValues>({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      lastName: "",
      role: "USER",
    },
    resolver: zodResolver(adminUserCreateSchema),
  });

  const editMethods = useForm<AdminUserEditValues>({
    defaultValues: {
      userAuthId: "",
      role: "USER",
      status: "ACTIVE",
      name: "",
      lastName: "",
      password: "",
    },
    resolver: zodResolver(adminUserEditSchema),
  });

  const onCreateSubmit = async (values: AdminUserCreateValues) => {
    if (values.role === "SUPER_ADMIN" && !canAssignSuperAdmin) {
      toast({
        title: "Not allowed",
        description: "Only a super admin can assign that role.",
      });
      return;
    }
    const res = await createMutation.mutateAsync({
      email: values.email.trim().toLowerCase(),
      password: values.password,
      name: values.name?.trim() ?? "",
      lastName: values.lastName?.trim() ?? "",
      role: values.role,
    });
    if (!res.ok) {
      toast({
        title: "Create failed",
        description: res.error ?? "Try again.",
      });
      return;
    }
    toast({ title: "User created" });
    createMethods.reset();
    setCreateOpen(false);
  };

  const onEditSubmit = async (values: AdminUserEditValues) => {
    if (values.role === "SUPER_ADMIN" && !canAssignSuperAdmin) {
      toast({
        title: "Not allowed",
        description: "Only a super admin can assign that role.",
      });
      return;
    }
    const res = await updateMutation.mutateAsync({
      userAuthId: values.userAuthId,
      role: values.role,
      status: values.status,
      name: values.name.trim(),
      lastName: values.lastName.trim(),
      password: values.password.trim(),
    });
    if (!res.ok) {
      toast({
        title: "Update failed",
        description: res.error ?? "Try again.",
      });
      return;
    }
    toast({ title: "User updated" });
    setEditRow(null);
  };

  const openEdit = (row: AdminUserRowDto) => {
    setEditRow(row);
    editMethods.reset({
      userAuthId: row.userAuthId,
      role: row.role,
      status: row.status,
      name: row.name ?? "",
      lastName: row.lastName ?? "",
      password: "",
    });
  };

  const roleOptions = useMemo(() => {
    const opts = [
      { value: "USER", label: "User" },
      { value: "ADMIN", label: "Admin" },
    ];
    if (canAssignSuperAdmin) {
      opts.push({ value: "SUPER_ADMIN", label: "Super admin" });
    }
    return opts;
  }, [canAssignSuperAdmin]);

  const statusOptions = useMemo(
    () => [
      { value: "ACTIVE", label: "Active" },
      { value: "DEACTIVE", label: "Deactive" },
      { value: "SUSPEND", label: "Suspend" },
    ],
    [],
  );

  const columns: ColumnDef<AdminUserRowDto>[] = useMemo(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      {
        accessorKey: "username",
        header: "Username",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      { accessorKey: "role", header: "Role" },
      { accessorKey: "status", header: "Status" },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => getValue<string | null>() || "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => openEdit(row.original)}
              aria-label={`Edit ${row.original.email ?? row.original.userId}`}
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
                  row.original.userAuthId,
                );
                if (!res.ok) {
                  toast({
                    title: "Delete failed",
                    description: res.error ?? "Try again.",
                  });
                  return;
                }
                toast({ title: "User removed" });
              }}
              aria-label={`Delete ${row.original.email ?? row.original.userId}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Users", href: "/dashboard/users" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add user
          </Button>
        </div>

        {isPending && (
          <P className="text-muted-foreground text-sm">Loading users…</P>
        )}
        {isError && (
          <div className="space-y-2">
            <P className="text-destructive text-sm">
              {error?.message ?? "Could not load users."}
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
          <TablePrimary data={rows} columns={columns} />
        )}
      </main>

      <ModalFormShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        methods={createMethods}
        onSubmit={onCreateSubmit}
        title="Add user"
        description="Create a user with email and password. Role controls dashboard and API access."
        confirmText="Create"
        submitting={
          createMethods.formState.isSubmitting || createMutation.isPending
        }
      >
        <div className="flex flex-col gap-4">
          <InputR<AdminUserCreateValues>
            name="email"
            label="Email"
            type="email"
            required
          />
          <InputR<AdminUserCreateValues>
            name="password"
            label="Password"
            type="password"
            required
          />
          <Collapse trigger="Advanced Settings">
            <div className="flex flex-col gap-4">
              <InputR<AdminUserCreateValues> name="name" label="First name" />
              <InputR<AdminUserCreateValues>
                name="lastName"
                label="Last name"
              />
              <SelectR<AdminUserCreateValues>
                name="role"
                label="Role"
                options={roleOptions}
              />
            </div>
          </Collapse>
        </div>
      </ModalFormShell>

      <ModalFormShell
        open={editRow !== null}
        onOpenChange={(o) => {
          if (!o) setEditRow(null);
        }}
        methods={editMethods}
        onSubmit={onEditSubmit}
        title="Edit user"
        description="Update role, account status, name, or set a new password (optional)."
        confirmText="Save"
        submitting={
          editMethods.formState.isSubmitting || updateMutation.isPending
        }
      >
        <div className="flex flex-col gap-4">
          <input type="hidden" {...editMethods.register("userAuthId")} />
          <SelectR<AdminUserEditValues>
            name="role"
            label="Role"
            options={roleOptions}
          />
          <SelectR<AdminUserEditValues>
            name="status"
            label="Status"
            options={statusOptions}
          />
          <InputR<AdminUserEditValues> name="name" label="First name" />
          <InputR<AdminUserEditValues> name="lastName" label="Last name" />
          <InputR<AdminUserEditValues>
            name="password"
            label="New password (optional)"
            type="password"
            autoComplete="new-password"
          />
        </div>
      </ModalFormShell>
    </div>
  );
}
