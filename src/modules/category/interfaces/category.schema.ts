import { z } from "zod";

export const categoryFormSchema = z.object({
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
  metadataJson: z
    .string()
    .trim()
    .max(20_000, "Metadata JSON is too large."),
  contentIds: z.array(z.string().min(1)),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
