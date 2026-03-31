"use client";

import { Plus } from "lucide-react";

import type { TagDto } from "@/modules/tag/actions/tag.actions";
import { TagUpsertModal } from "@/modules/tag";
import { Button } from "@/shared/components/atoms/button";

import { LanguageArrayPickerModal } from "./language-array-picker-modal";

type LanguageTagPickerModalProps = {
  tags: TagDto[];
  canManageTags: boolean;
};

export function LanguageTagPickerModal({
  tags,
  canManageTags,
}: LanguageTagPickerModalProps) {
  return (
    <LanguageArrayPickerModal
      fieldName="tagIds"
      name="Tags"
      helperText="Select one or more tags. On submit, the form sends their ids in `tagIds`."
      buttonText="Choose tags"
      modalTitle="Select tags"
      modalDescription="Choose tags for this language. Saving the language will submit `tagIds` as an array."
      emptyText="No tags selected."
      availableText="Available tags"
      items={tags}
      headerAction={
        canManageTags ? (
          <TagUpsertModal
            canManageTags={canManageTags}
            trigger={
              <Button type="button" size="sm" variant="outline">
                <Plus className="size-4" aria-hidden />
                Add tag
              </Button>
            }
          />
        ) : null
      }
    />
  );
}
