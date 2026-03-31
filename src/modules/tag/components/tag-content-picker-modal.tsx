"use client";

import type { TagContentOption } from "@/modules/tag/actions/tag.actions";

import { TagArrayPickerModal } from "./tag-array-picker-modal";

type TagContentPickerModalProps = {
  contentOptions: TagContentOption[];
};

export function TagContentPickerModal({
  contentOptions,
}: TagContentPickerModalProps) {
  return (
    <TagArrayPickerModal
      fieldName="contentIds"
      name="Linked contents"
      helperText="Select one or more content items. On submit, the form sends their ids in `contentIds`."
      buttonText="Choose contents"
      modalTitle="Select contents"
      modalDescription="Choose linked contents for this tag. Saving the tag will submit `contentIds` as an array."
      emptyText="No contents selected."
      availableText="Available contents"
      items={contentOptions}
    />
  );
}
