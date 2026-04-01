"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import P from "@/shared/components/atoms/typography/P";

// import { TagContentPickerModal } from "../components/tag-content-picker-modal";
import type { TagFormValues } from "../interfaces/tag.schema";

export default function TagForm() {
  return (
    <div className="flex flex-col gap-4">
      <InputR<TagFormValues>
        name="name"
        label="Name"
        placeholder="Tag name"
        required
      />

      <InputR<TagFormValues>
        name="description"
        label="Description"
        placeholder="Optional description"
      />

      <InputR<TagFormValues>
        name="label"
        label="Label"
        placeholder="Optional short label"
      />

      <InputR<TagFormValues>
        name="metadataJson"
        label="Metadata (JSON object)"
        placeholder='e.g. {"key":"value"}'
      />
      <P className="text-muted-foreground text-xs">
        Optional. Must be a JSON object, not an array.
      </P>

      {/* <TagContentPickerModal contentOptions={contentOptions} /> */}
    </div>
  );
}
