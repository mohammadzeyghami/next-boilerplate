"use client";

import { Plus } from "lucide-react";

import { ContentCreateModal } from "@/modules/content";
import { Button } from "@/shared/components/atoms/button";
import type { LanguageContentOption } from "@/modules/language/actions/language.actions";
import { LanguageArrayPickerModal } from "./language-array-picker-modal";

type LanguageContentPickerModalProps = {
  contentOptions: LanguageContentOption[];
};

export function LanguageContentPickerModal({
  contentOptions,
}: LanguageContentPickerModalProps) {
  return (
    <LanguageArrayPickerModal
      fieldName="contentIds"
      name="Linked contents"
      helperText="Select one or more content items. On submit, the form sends their ids in `contentIds`."
      buttonText="Choose contents"
      modalTitle="Select contents"
      modalDescription="Choose linked contents for this language. Saving the language will submit `contentIds` as an array."
      emptyText="No contents selected."
      availableText="Available contents"
      items={contentOptions}
      headerAction={
        <ContentCreateModal
          trigger={
            <Button type="button" size="sm" variant="outline">
              <Plus className="size-4" aria-hidden />
              Add content
            </Button>
          }
        />
      }
    />
  );
}
