"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import { ContentIdsPickerModal } from "@/shared/components/molecules/pickers/ContentIdsPickerModal";
import MetadataEditorR from "@/shared/components/molecules/inputs/MetadataEditorR";
import Collapse from "@/shared/components/molecules/collapse/Primary";

import type { CurrencyContentOption } from "../actions/currency.actions";
import type { CurrencyFormValues } from "../interfaces/currency.schema";

export default function CurrencyForm({
  contentOptions,
}: {
  contentOptions: CurrencyContentOption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <InputR<CurrencyFormValues>
        name="name"
        label="Name"
        placeholder="Currency name"
        required
      />
      <InputR<CurrencyFormValues>
        name="key"
        label="Key"
        placeholder="e.g. COIN"
        required
      />
      <InputR<CurrencyFormValues>
        name="defaultValue"
        label="Default value"
        placeholder="0"
        type="number"
        required
      />
      <InputR<CurrencyFormValues>
        name="stableValue"
        label="Stable value"
        placeholder="1"
        type="number"
        required
      />
      <Collapse trigger="Advanced Settings">
        <div className="flex flex-col gap-4 pt-4">
          <MetadataEditorR<CurrencyFormValues>
            name="metadataEntries"
            label="Metadata"
            addLabel="Add field"
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />
          <ContentIdsPickerModal<CurrencyFormValues>
            fieldName="contentIds"
            items={contentOptions}
          />
        </div>
      </Collapse>
    </div>
  );
}
