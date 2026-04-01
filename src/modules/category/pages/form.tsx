"use client";

import InputR from "@/shared/components/molecules/inputs/Controllerd";
import P from "@/shared/components/atoms/typography/P";
import Collapse from "@/shared/components/molecules/collapse/Primary";

import type { CategoryFormValues } from "../interfaces/category.schema";

export default function CategoryForm() {
  return (
    <div className="flex flex-col gap-4">
      <InputR<CategoryFormValues>
        name="name"
        label="Name"
        placeholder="Category name"
        required
      />

      <Collapse trigger="Advanced Settings">
        <div className="flex flex-col gap-4 pt-4">
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
        </div>
      </Collapse>
    </div>
  );
}
