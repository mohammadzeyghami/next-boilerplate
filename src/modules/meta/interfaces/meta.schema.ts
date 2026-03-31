import { z } from "zod";

import { contentTypeValues } from "@/modules/content/interfaces/content.schema";

export const metaFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(200, "Name must be at most 200 characters."),
    key: z
      .string()
      .trim()
      .min(1, "Key is required.")
      .max(100, "Key must be at most 100 characters."),
    metadataJson: z
      .string()
      .trim()
      .max(20_000, "Metadata JSON is too large."),
    contentTypes: z.array(z.enum(contentTypeValues)),
    defaultValue: z.coerce.number(),
    minValue: z.union([z.coerce.number(), z.nan()]).optional(),
    maxValue: z.union([z.coerce.number(), z.nan()]).optional(),
  })
  .superRefine((values, ctx) => {
    const minValue = Number.isNaN(values.minValue) ? undefined : values.minValue;
    const maxValue = Number.isNaN(values.maxValue) ? undefined : values.maxValue;

    if (
      minValue !== undefined &&
      maxValue !== undefined &&
      minValue > maxValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxValue"],
        message: "Max value must be greater than or equal to min value.",
      });
    }
  });

export type MetaFormValues = z.infer<typeof metaFormSchema>;
