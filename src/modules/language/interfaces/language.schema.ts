import { z } from "zod";

export const languageFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2,000 characters."),
  contentIds: z.array(z.string().min(1)),
  categoryIds: z.array(z.string().min(1)),
  tagIds: z.array(z.string().min(1)),
});

export type LanguageFormValues = z.infer<typeof languageFormSchema>;
