import { z } from "zod";

const metadataEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const currencyFormSchema = z.object({
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
  defaultValue: z.coerce.number().min(0, "Default value must be at least 0."),
  stableValue: z.coerce.number().min(0, "Stable value must be at least 0."),
});

export type CurrencyFormValues = z.infer<typeof currencyFormSchema>;
