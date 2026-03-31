"use client";

import type { CategoryDto } from "@/modules/category/actions/category.actions";
import InputR from "@/shared/components/molecules/inputs/Controllerd";

import type { LanguageContentOption } from "../actions/language.actions";
import { LanguageCategoryPickerModal } from "../components/language-category-picker-modal";
import { LanguageContentPickerModal } from "../components/language-content-picker-modal";
import { LanguageTagPickerModal } from "../components/language-tag-picker-modal";
import type { TagDto } from "@/modules/tag/actions/tag.actions";

export default function LanguageForm({
  contentOptions,
  categories,
  tags,
  canManageCategories,
  canManageTags,
}: {
  contentOptions: LanguageContentOption[];
  categories: CategoryDto[];
  tags: TagDto[];
  canManageCategories: boolean;
  canManageTags: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <InputR
        name="name"
        label="Name"
        placeholder="Language name"
        required
      />

      <InputR
        name="description"
        label="Description"
        placeholder="Optional description"
      />

      <LanguageCategoryPickerModal
        categories={categories}
        canManageCategories={canManageCategories}
      />

      <LanguageTagPickerModal tags={tags} canManageTags={canManageTags} />

      <LanguageContentPickerModal contentOptions={contentOptions} />
    </div>
  );
}
