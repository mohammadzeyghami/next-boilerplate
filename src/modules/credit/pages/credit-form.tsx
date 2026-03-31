"use client";

import { Controller, useFormContext } from "react-hook-form";

import { contentTypeValues } from "@/modules/content/interfaces/content.schema";
import { Checkbox } from "@/shared/components/molecules/check-box/Default";
import InputR from "@/shared/components/molecules/inputs/Controllerd";
import LabelPrimary from "@/shared/components/molecules/label/Primary";
import P from "@/shared/components/atoms/typography/P";

import type { CreditFormValues } from "../interfaces/credit.schema";

export default function CreditForm() {
  const { control } = useFormContext<CreditFormValues>();

  return (
    <div className="flex flex-col gap-4">
      <InputR<CreditFormValues>
        name="name"
        label="Name"
        placeholder="Credit name"
        required
      />

      <InputR<CreditFormValues>
        name="metadataJson"
        label="Metadata (JSON object)"
        placeholder='e.g. {"scope":"premium"}'
      />
      <P className="text-muted-foreground text-xs">
        Optional. Must be a JSON object, not an array.
      </P>

      <div className="flex flex-col gap-2">
        <LabelPrimary className="text-sm font-medium text-foreground">
          Content types
        </LabelPrimary>
        <Controller
          name="contentTypes"
          control={control}
          render={({ field }) => (
            <div className="space-y-2 rounded-md border p-3">
              {contentTypeValues.map((contentType) => {
                const checked = field.value.includes(contentType);
                return (
                  <label
                    key={contentType}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const on = value === true;
                        field.onChange(
                          on
                            ? [...field.value, contentType]
                            : field.value.filter((item) => item !== contentType),
                        );
                      }}
                    />
                    <span>{contentType}</span>
                  </label>
                );
              })}
            </div>
          )}
        />
      </div>
    </div>
  );
}
