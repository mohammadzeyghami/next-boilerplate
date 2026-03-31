"use client";

import { Controller, useFormContext } from "react-hook-form";

import { contentTypeValues } from "@/modules/content/interfaces/content.schema";
import { Checkbox } from "@/shared/components/molecules/check-box/Default";
import InputR from "@/shared/components/molecules/inputs/Controllerd";
import LabelPrimary from "@/shared/components/molecules/label/Primary";
import P from "@/shared/components/atoms/typography/P";

import type { MetaFormValues } from "../interfaces/meta.schema";

export default function MetaForm() {
  const { control } = useFormContext<MetaFormValues>();

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
      <InputR<MetaFormValues>
        name="metadataJson"
        label="Metadata (JSON object)"
        placeholder='e.g. {"scope":"game"}'
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
                      onCheckedChange={(checkedValue) => {
                        const isChecked = checkedValue === true;
                        field.onChange(
                          isChecked
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
