"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormProvider as RHFFormProvider,
  useForm,
} from "react-hook-form";

import type { CategoryDto } from "@/modules/category/actions/category.actions";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/modules/category/api/mutations";
import { useCategoryContentOptionsQuery } from "@/modules/category/api/queries";
import {
  categoryFormSchema,
  type CategoryFormValues,
} from "@/modules/category/interfaces/category.schema";
import { toast } from "@/shared/components/atoms/toast/toast-store";
import { ModalShell } from "@/shared/components/organisms/modal-shell";

import CategoryForm from "../pages/form";

const emptyCategoryForm: CategoryFormValues = {
  name: "",
  description: "",
  label: "",
  metadataJson: "",
  contentIds: [],
};

function categoryDtoToFormValues(category: CategoryDto): CategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? "",
    label: category.label ?? "",
    metadataJson: category.metadata ? JSON.stringify(category.metadata) : "",
    contentIds: [...category.contentIds],
  };
}

type CategoryUpsertModalProps = {
  canManageCategories: boolean;
  category?: CategoryDto | null;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  triggerAsChild?: boolean;
  onSuccess?: () => void;
};

export function CategoryUpsertModal({
  canManageCategories,
  category,
  open,
  defaultOpen = false,
  onOpenChange,
  trigger,
  triggerAsChild = true,
  onSuccess,
}: CategoryUpsertModalProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const editingCategory = category ?? null;

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const { data: contentOptions = [] } = useCategoryContentOptionsQuery(
    canManageCategories && isOpen,
  );

  const methods = useForm<CategoryFormValues>({
    defaultValues: emptyCategoryForm,
    resolver: zodResolver(categoryFormSchema),
  });

  const setOpenState = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) {
      methods.reset(
        editingCategory
          ? categoryDtoToFormValues(editingCategory)
          : emptyCategoryForm,
      );
      return;
    }

    methods.reset(
      editingCategory
        ? categoryDtoToFormValues(editingCategory)
        : emptyCategoryForm,
    );
  }, [editingCategory, isOpen, methods]);

  const title = useMemo(
    () => (editingCategory ? "Edit category" : "Add category"),
    [editingCategory],
  );

  const description = useMemo(
    () =>
      editingCategory
        ? "Update this category’s fields and linked contents."
        : "Create a category with optional label, metadata, and linked contents.",
    [editingCategory],
  );

  const confirmText = editingCategory ? "Update" : "Save";

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
    setOpenState(false);
    onSuccess?.();
  };

  if (!canManageCategories) {
    return null;
  }

  return (
    <ModalShell open={isOpen} onOpenChange={setOpenState}>
      {trigger ? (
        <ModalShell.Trigger asChild={triggerAsChild}>
          {trigger}
        </ModalShell.Trigger>
      ) : null}

      <ModalShell.Content size="lg">
        <ModalShell.Header title={title} description={description} />

        <RHFFormProvider {...methods}>
          <ModalShell.Form onSubmit={methods.handleSubmit(onSubmit)}>
            <ModalShell.Body>
              <CategoryForm contentOptions={contentOptions} />
            </ModalShell.Body>

            <ModalShell.Footer>
              <ModalShell.Actions
                confirmText={confirmText}
                confirmDisabled={
                  methods.formState.isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              />
            </ModalShell.Footer>
          </ModalShell.Form>
        </RHFFormProvider>
      </ModalShell.Content>
    </ModalShell>
  );
}
