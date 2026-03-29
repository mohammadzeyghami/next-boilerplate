"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";

import { TablePrimary } from "@/shared/components/organisms/Table/Table";
import { BreadcrumbPrimary } from "@/shared/components/molecules/breadcrumb/primary";
import { Button } from "@/shared/components/atoms/button";
import { ModalFormShell } from "@/shared/components/organisms/modal-shell/ModalFormShell";
import { zodResolver } from "@hookform/resolvers/zod";
import { contentFormSchema } from "../interfaces/content.schema";
import { createContentAction } from "../actions/content.actions";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import { toFormData } from "@/shared/utils/toFormData";
import ContentForm from "./form";
type ContentAccess = "PUBLIC" | "PRIVATE";
type ContentType = "TEXT" | "IMAGE" | "VIDEO" | "SOUND" | "FILE";

export type ContentItem = {
  id: string;
  name: string;
  ownerId: string;
  text: string | null;
  access: ContentAccess;
  metadata: Record<string, unknown> | null;
  contentUrl: string | null;
  type: ContentType;
  isEarnable: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ContentFormValues = {
  name: string;
  text: string;
  access: "PUBLIC" | "PRIVATE";
  type: "TEXT" | "IMAGE" | "VIDEO" | "SOUND" | "FILE";
  isEarnable: boolean;
  contentUrl: string;
  metadata: string;
};

export default function ContentPage({ items }: { items: ContentItem[] }) {
  const [open, setOpen] = useState(false);

  const methods = useForm<ContentFormValues>({
    defaultValues: {
      name: "",
      text: "",
      access: "PUBLIC",
      type: "TEXT",
      isEarnable: false,
      contentUrl: "",
      metadata: "",
    },
    resolver: zodResolver(contentFormSchema),
  });

  const selectedType = methods.watch("type");
  const needsFileUrl = ["IMAGE", "VIDEO", "SOUND", "FILE"].includes(
    selectedType,
  );

  const onSubmit = async (values: ContentFormValues) => {
    const payload = {
      name: values.name.trim(),
      text: values.text.trim() || null,
      access: values.access,
      type: values.type,
      isEarnable: values.isEarnable,
      contentUrl: needsFileUrl ? values.contentUrl.trim() || null : null,
      metadata: values.metadata.trim() ? JSON.parse(values.metadata) : null,
    };
    const formData = toFormData(payload);
    console.log(payload, formData);

    const res = await createContentAction(formData);

    if (!res.ok) {
      toast({
        title: "Failed to create content",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({
      title: "Content created successfully",
    });

    methods.reset();
    setOpen(false);
  };

  const columns: ColumnDef<ContentItem>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "access",
        header: "Access",
        cell: ({ getValue }) => {
          const value = getValue<string>();

          return (
            <span
              className={
                value === "PUBLIC"
                  ? "font-medium text-green-600"
                  : "font-medium text-red-600"
              }
            >
              {value}
            </span>
          );
        },
      },
      {
        accessorKey: "text",
        header: "Text",
        cell: ({ getValue }) => {
          const value = getValue<string | null>();
          return value || "-";
        },
      },
      {
        accessorKey: "contentUrl",
        header: "Preview",
        cell: ({ getValue, row }) => {
          const url = getValue<string | null>();
          const type = row.original.type;

          if (!url) return "-";

          if (type === "IMAGE") {
            return (
              <img
                src={url}
                alt={row.original.name}
                className="h-10 w-10 rounded object-cover"
              />
            );
          }

          return (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              View
            </a>
          );
        },
      },
      {
        accessorKey: "isEarnable",
        header: "Earnable",
        cell: ({ getValue }) => (getValue<boolean>() ? "✅" : "❌"),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ getValue }) => {
          const date = new Date(getValue<string>());
          return date.toLocaleDateString();
        },
      },
    ],
    [],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <BreadcrumbPrimary
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Content", href: "/dashboard/content" },
            ]}
          />
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Content</h1>

          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden />
            Add Content
          </Button>
        </div>

        <TablePrimary data={items} columns={columns} />
      </main>

      <ModalFormShell
        open={open}
        onOpenChange={setOpen}
        methods={methods}
        onSubmit={onSubmit}
        title="Add Content"
        description="Add a new content to your library"
        size="lg"
        confirmText="Save"
        submitting={methods.formState.isSubmitting}
      >
        <ContentForm needsFileUrl={needsFileUrl} />
      </ModalFormShell>
    </div>
  );
}
