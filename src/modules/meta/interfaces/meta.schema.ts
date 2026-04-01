import { z } from "zod";

const metadataEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

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
    metadataEntries: z.array(metadataEntrySchema),
    contentIds: z.array(z.string().min(1)),
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
