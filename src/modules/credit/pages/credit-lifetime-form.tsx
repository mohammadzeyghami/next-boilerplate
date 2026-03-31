"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import SelectR from "@/shared/components/molecules/select/selectR";
import P from "@/shared/components/atoms/typography/P";

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

      <InputR<CreditLifeTimeFormValues>
        name="metadataJson"
        label="Metadata (JSON object)"
        placeholder='e.g. {"tier":"starter"}'
      />
      <P className="text-muted-foreground text-xs">
        Optional. Must be a JSON object, not an array.
      </P>
    </div>
  );
}
