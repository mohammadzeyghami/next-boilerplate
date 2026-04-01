"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import Collapse from "@/shared/components/molecules/collapse/Primary";
import MetadataEditorR from "@/shared/components/molecules/inputs/MetadataEditorR";

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

      <Collapse trigger="Advanced Settings">
        <div className="flex flex-col gap-4 pt-4">
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

          <MetadataEditorR<TagFormValues>
            name="metadataEntries"
            label="Metadata"
            addLabel="Add field"
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />
        </div>
      </Collapse>
    </div>
  );
}
