"use client";

import { Controller, useFormContext } from "react-hook-form";

import { Checkbox } from "@/shared/components/molecules/check-box/Default";
import InputR from "@/shared/components/molecules/inputs/Controllerd";
import LabelPrimary from "@/shared/components/molecules/label/Primary";
import P from "@/shared/components/atoms/typography/P";

import type { TagContentOption } from "../actions/tag.actions";
import type { TagFormValues } from "../interfaces/tag.schema";

export default function TagForm({
  contentOptions,
}: {
  contentOptions: TagContentOption[];
}) {
  const { control } = useFormContext<TagFormValues>();

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

      <div className="flex flex-col gap-2">
        <LabelPrimary className="text-sm font-medium text-foreground">
          Linked contents
        </LabelPrimary>
        <P className="text-muted-foreground text-xs">
          Optional. Link content items to this tag (same visibility rules as the
          content list).
        </P>
        <Controller
          name="contentIds"
          control={control}
          render={({ field }) => (
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
              {contentOptions.length === 0 ? (
                <P className="text-muted-foreground text-sm">
                  No contents available.
                </P>
              ) : (
                contentOptions.map((c) => {
                  const checked = field.value.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) => {
                          const on = v === true;
                          field.onChange(
                            on
                              ? [...field.value, c.id]
                              : field.value.filter((id) => id !== c.id),
                          );
                        }}
                      />
                      <span className="truncate">{c.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}
