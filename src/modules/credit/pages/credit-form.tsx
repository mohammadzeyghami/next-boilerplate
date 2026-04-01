"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import { ContentIdsPickerModal } from "@/shared/components/molecules/pickers/ContentIdsPickerModal";
import MetadataEditorR from "@/shared/components/molecules/inputs/MetadataEditorR";
import Collapse from "@/shared/components/molecules/collapse/Primary";

import type { CreditContentOption } from "../actions/credit.actions";
import type { CreditFormValues } from "../interfaces/credit.schema";

export default function CreditForm({
  contentOptions,
}: {
  contentOptions: CreditContentOption[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <InputR<CreditFormValues>
        name="name"
        label="Name"
        placeholder="Credit name"
        required
      />

      <Collapse trigger="Advanced Settings">
        <div className="flex flex-col gap-4 pt-4">
          <MetadataEditorR<CreditFormValues>
            name="metadataEntries"
            label="Metadata"
            addLabel="Add field"
            keyPlaceholder="Key"
            valuePlaceholder="Value"
          />

          <ContentIdsPickerModal<CreditFormValues>
            fieldName="contentIds"
            items={contentOptions}
          />
        </div>
      </Collapse>
    </div>
  );
}
