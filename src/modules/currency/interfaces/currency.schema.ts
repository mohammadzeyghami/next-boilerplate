import { z } from "zod";

import { contentTypeValues } from "@/modules/content/interfaces/content.schema";

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
  metadataJson: z
    .string()
    .trim()
    .max(20_000, "Metadata JSON is too large."),
  contentTypes: z.array(z.enum(contentTypeValues)),
  defaultValue: z.coerce.number().min(0, "Default value must be at least 0."),
  stableValue: z.coerce.number().min(0, "Stable value must be at least 0."),
});

export type CurrencyFormValues = z.infer<typeof currencyFormSchema>;
