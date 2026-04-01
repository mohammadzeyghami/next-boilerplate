import { z } from "zod";

const metadataEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const creditFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  metadataEntries: z.array(metadataEntrySchema),
  contentIds: z.array(z.string().min(1)),
});

export const creditLifeTimeFormSchema = z.object({
  creditsId: z.string().trim().min(1, "Credit is required."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  metadataEntries: z.array(metadataEntrySchema),
  lifeTime: z.coerce
    .number()
    .int()
    .min(1, "Life time must be at least 1.")
    .max(3650, "Life time must be at most 3650 days."),
});

export type CreditFormValues = z.infer<typeof creditFormSchema>;
export type CreditLifeTimeFormValues = z.infer<typeof creditLifeTimeFormSchema>;
