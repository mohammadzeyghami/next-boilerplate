"use client";

import { Plus } from "lucide-react";

import type { CategoryDto } from "@/modules/category/actions/category.actions";
import { CategoryUpsertModal } from "@/modules/category";
import { Button } from "@/shared/components/atoms/button";
import { LanguageArrayPickerModal } from "./language-array-picker-modal";

type LanguageCategoryPickerModalProps = {
  categories: CategoryDto[];
  canManageCategories: boolean;
};

export function LanguageCategoryPickerModal({
  categories,
  canManageCategories,
}: LanguageCategoryPickerModalProps) {
  return (
    <LanguageArrayPickerModal
      fieldName="categoryIds"
      name="Categories"
      helperText="Select one or more categories. On submit, the form sends their ids in `categoryIds`."
      buttonText="Choose categories"
      modalTitle="Select categories"
      modalDescription="Choose categories for this language. Saving the language will submit `categoryIds` as an array."
      emptyText="No categories selected."
      availableText="Available categories"
      items={categories}
      headerAction={
        canManageCategories ? (
          <CategoryUpsertModal
            canManageCategories={canManageCategories}
            trigger={
              <Button type="button" size="sm" variant="outline">
                <Plus className="size-4" aria-hidden />
                Add category
              </Button>
            }
          />
        ) : null
      }
    />
  );
}
