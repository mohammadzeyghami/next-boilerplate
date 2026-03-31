"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import P from "@/shared/components/atoms/typography/P";

import type { CategoryFormValues } from "../interfaces/category.schema";

export default function CategoryForm(
  {
    // contentOptions,
  }: {
    // contentOptions: CategoryContentOption[];
  },
) {
  return (
    <div className="flex flex-col gap-4">
      <InputR<CategoryFormValues>
        name="name"
        label="Name"
        placeholder="Category name"
        required
      />

      <InputR<CategoryFormValues>
        name="description"
        label="Description"
        placeholder="Optional description"
      />

      <InputR<CategoryFormValues>
        name="label"
        label="Label"
        placeholder="Optional short label"
      />

      <InputR<CategoryFormValues>
        name="metadataJson"
        label="Metadata (JSON object)"
        placeholder='e.g. {"key":"value"}'
      />
      <P className="text-muted-foreground text-xs">
        Optional. Must be a JSON object, not an array.
      </P>

      <div className="flex flex-col gap-2">
        {/* <LabelPrimary className="text-sm font-medium text-foreground">
          Linked contents
        </LabelPrimary> */}
        {/* <P className="text-muted-foreground text-xs">
          Optional. Link content items to this category (same visibility rules
          as the content list).
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
        /> */}
      </div>
    </div>
  );
}
