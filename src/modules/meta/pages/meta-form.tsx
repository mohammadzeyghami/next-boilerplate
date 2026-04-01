"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import { ContentIdsPickerModal } from "@/shared/components/molecules/pickers/ContentIdsPickerModal";
import MetadataEditorR from "@/shared/components/molecules/inputs/MetadataEditorR";
import Collapse from "@/shared/components/molecules/collapse/Primary";

import type { MetaContentOption } from "../actions/meta.actions";
import type { MetaFormValues } from "../interfaces/meta.schema";

export default function MetaForm({
  contentOptions,
}: {
  contentOptions: MetaContentOption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <InputR<MetaFormValues>
        name="name"
        label="Name"
        placeholder="Meta name"
        required
      />
      <InputR<MetaFormValues>
        name="key"
        label="Key"
        placeholder="e.g. XP"
        required
      />
      <InputR<MetaFormValues>
        name="defaultValue"
        label="Default value"
        placeholder="0"
        type="number"
        required
      />
      <Collapse trigger="Advanced Settings">
        <div className="flex flex-col gap-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputR<MetaFormValues>
              name="minValue"
              label="Min value"
              placeholder="Optional"
              type="number"
            />
            <InputR<MetaFormValues>
              name="maxValue"
              label="Max value"
              placeholder="Optional"
              type="number"
            />
          </div>
          <MetadataEditorR<MetaFormValues>
            name="metadataEntries"
            label="Metadata"
            addLabel="Add field"
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />
          <ContentIdsPickerModal<MetaFormValues>
            fieldName="contentIds"
            items={contentOptions}
          />
        </div>
      </Collapse>
    </div>
  );
}
