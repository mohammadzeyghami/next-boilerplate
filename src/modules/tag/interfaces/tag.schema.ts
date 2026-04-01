import { z } from "zod";

const metadataEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const tagFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2,000 characters."),
  label: z.string().trim().max(200, "Label must be at most 200 characters."),
  metadataEntries: z.array(metadataEntrySchema),
  contentIds: z.array(z.string().min(1)),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;
