"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import SelectR from "@/shared/components/molecules/select/selectR";
import MetadataEditorR from "@/shared/components/molecules/inputs/MetadataEditorR";
import Collapse from "@/shared/components/molecules/collapse/Primary";

import type { CreditDto } from "../actions/credit.actions";
import type { CreditLifeTimeFormValues } from "../interfaces/credit.schema";

export default function CreditLifeTimeForm({
  credits,
}: {
  credits: CreditDto[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <SelectR<CreditLifeTimeFormValues>
        name="creditsId"
        label="Credit"
        placeholder="Select a credit"
        required
        options={credits.map((credit) => ({
          label: credit.name,
          value: credit.id,
        }))}
      />

      <InputR<CreditLifeTimeFormValues>
        name="name"
        label="Name"
        placeholder="Lifetime name"
        required
      />

      <InputR<CreditLifeTimeFormValues>
        name="lifeTime"
        label="Life time (days)"
        placeholder="e.g. 30"
        type="number"
        required
      />

      <Collapse trigger="Advanced Settings">
        <div className="flex flex-col gap-4 pt-4">
          <MetadataEditorR<CreditLifeTimeFormValues>
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
