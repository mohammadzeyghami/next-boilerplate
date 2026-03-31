"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";

import { createContentAction } from "@/modules/content/actions/content.actions";
import {
  contentFormSchema,
  type ContentFormValues,
} from "@/modules/content/interfaces/content.schema";
import ContentForm from "@/modules/content/pages/form";
import { languageKeys } from "@/modules/language/api/keys";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import { ModalFormShell } from "@/shared/components/organisms/modal-shell/ModalFormShell";
import { ModalShell } from "@/shared/components/organisms/modal-shell";
import { toFormData } from "@/shared/utils/toFormData";

const emptyContentForm: ContentFormValues = {
  name: "",
  text: "",
  access: "PUBLIC",
  type: "TEXT",
  isEarnable: false,
  contentUrl: "",
  metadata: "",
};

type ContentCreateModalProps = {
  trigger?: React.ReactNode;
  triggerAsChild?: boolean;
};

export function ContentCreateModal({
  trigger,
  triggerAsChild = true,
}: ContentCreateModalProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const methods = useForm<ContentFormValues>({
    defaultValues: emptyContentForm,
    resolver: zodResolver(contentFormSchema),
  });

  const selectedType = useWatch({
    control: methods.control,
    name: "type",
  });
  const needsFileUrl = ["IMAGE", "VIDEO", "SOUND", "FILE"].includes(
    selectedType,
  );

  const onSubmit = async (values: ContentFormValues) => {
    const payload = {
      name: values.name.trim(),
      text: values.text?.trim() || null,
      access: values.access,
      type: values.type,
      isEarnable: values.isEarnable,
      contentUrl: needsFileUrl ? values.contentUrl?.trim() || null : null,
      metadata: values.metadata?.trim() ? JSON.parse(values.metadata) : null,
    };

    const formData = toFormData(payload);
    const res = await createContentAction(formData);

    if (!res.ok) {
      toast({
        title: "Failed to create content",
        description: res.error ?? "Please try again.",
      });
      return;
    }

    toast({ title: "Content created successfully" });
    methods.reset(emptyContentForm);
    setOpen(false);
    void queryClient.invalidateQueries({
      queryKey: languageKeys.contentOptions(),
    });
  };

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
        title="Add Content"
        description="Add a new content to your library"
        size="lg"
        confirmText="Save"
        submitting={methods.formState.isSubmitting}
      >
        <ContentForm needsFileUrl={needsFileUrl} />
      </ModalFormShell>
    </ModalShell>
  );
}
