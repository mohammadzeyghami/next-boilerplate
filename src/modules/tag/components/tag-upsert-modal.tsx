"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useCreateTagMutation } from "@/modules/tag/api/mutations";
import {
  tagFormSchema,
  type TagFormValues,
} from "@/modules/tag/interfaces/tag.schema";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import { ModalFormShell } from "@/shared/components/organisms/modal-shell/ModalFormShell";
import { ModalShell } from "@/shared/components/organisms/modal-shell";

import TagForm from "../pages/form";

const emptyTagForm: TagFormValues = {
  name: "",
  description: "",
  label: "",
  metadataJson: "",
  contentIds: [],
};

type TagUpsertModalProps = {
  canManageTags: boolean;
  trigger?: React.ReactNode;
  triggerAsChild?: boolean;
};

export function TagUpsertModal({
  canManageTags,
  trigger,
  triggerAsChild = true,
}: TagUpsertModalProps) {
  const [open, setOpen] = React.useState(false);
  const methods = useForm<TagFormValues>({
    defaultValues: emptyTagForm,
    resolver: zodResolver(tagFormSchema),
  });

  const createMutation = useCreateTagMutation();

  const onSubmit = async (values: TagFormValues) => {
    const res = await createMutation.mutateAsync({
      name: values.name.trim(),
      description: values.description.trim(),
      label: values.label.trim(),
      metadataJson: values.metadataJson.trim(),
      contentIds: values.contentIds,
    });

    if (!res.ok) {
      toast({
        title: "Failed to create tag",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({ title: "Tag created" });
    methods.reset(emptyTagForm);
    setOpen(false);
  };

  if (!canManageTags) return null;

  return (
    <ModalShell open={open} onOpenChange={setOpen}>
      {trigger ? (
        <ModalShell.Trigger asChild={triggerAsChild}>
          {trigger}
        </ModalShell.Trigger>
      ) : null}
      <ModalFormShell
        open={open}
        onOpenChange={setOpen}
        methods={methods}
        onSubmit={onSubmit}
        title="Add tag"
        description="Create a tag with optional label, metadata, and linked contents."
        size="lg"
        confirmText="Save"
        submitting={methods.formState.isSubmitting || createMutation.isPending}
      >
        <TagForm />
      </ModalFormShell>
    </ModalShell>
  );
}
