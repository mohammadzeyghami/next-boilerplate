"use client";

import { Controller, useFormContext } from "react-hook-form";

import { contentTypeValues } from "@/modules/content/interfaces/content.schema";
import { Checkbox } from "@/shared/components/molecules/check-box/Default";
import InputR from "@/shared/components/molecules/inputs/Controllerd";
import LabelPrimary from "@/shared/components/molecules/label/Primary";
import P from "@/shared/components/atoms/typography/P";

import type { CurrencyFormValues } from "../interfaces/currency.schema";

export default function CurrencyForm() {
  const { control } = useFormContext<CurrencyFormValues>();

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
      <InputR<CurrencyFormValues>
        name="metadataJson"
        label="Metadata (JSON object)"
        placeholder='e.g. {"provider":"snap"}'
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
