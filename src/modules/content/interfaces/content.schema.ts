import { z } from "zod";

export const contentAccessValues = ["PRIVATE", "PUBLIC"] as const;

export const contentTypeValues = [
  "TEXT",
  "IMAGE",
  "VIDEO",
  "SOUND",
  "FILE",
] as const;

const metadataEntrySchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const contentFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required.")
      .max(200, "Name must be at most 200 characters."),

    text: z
      .string()
      .trim()
      .max(20000, "Text must be at most 20,000 characters.")
      .optional()
      .or(z.literal("")),

    access: z.enum(contentAccessValues),

    type: z.enum(contentTypeValues),

    isEarnable: z.boolean(),

    contentUrl: z.string().trim().optional().or(z.literal("")),

    metadataEntries: z.array(metadataEntrySchema),
  })
  .superRefine((values, ctx) => {
    const needsFileUrl = ["IMAGE", "VIDEO", "SOUND", "FILE"].includes(
      values.type,
    );

    if (needsFileUrl && !values.contentUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contentUrl"],
        message: "Content URL is required for this type.",
      });
    }

  });

export type ContentFormValues = z.infer<typeof contentFormSchema>;
