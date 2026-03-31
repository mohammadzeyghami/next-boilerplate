import { z } from "zod";

import { contentTypeValues } from "@/modules/content/interfaces/content.schema";

export const creditFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  metadataJson: z
    .string()
    .trim()
    .max(20_000, "Metadata JSON is too large."),
  contentTypes: z.array(z.enum(contentTypeValues)),
});

export const creditLifeTimeFormSchema = z.object({
  creditsId: z.string().trim().min(1, "Credit is required."),
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  metadataJson: z
    .string()
    .trim()
    .max(20_000, "Metadata JSON is too large."),
  lifeTime: z.coerce
    .number()
    .int()
    .min(1, "Life time must be at least 1.")
    .max(3650, "Life time must be at most 3650 days."),
});

export type CreditFormValues = z.infer<typeof creditFormSchema>;
export type CreditLifeTimeFormValues = z.infer<typeof creditLifeTimeFormSchema>;
