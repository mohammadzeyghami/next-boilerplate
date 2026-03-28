import { z } from "zod";

export const contentAccessValues = ["PRIVATE", "PUBLIC"] as const;
export const contentTypeValues = [
  "TEXT",
  "IMAGE",
  "VIDEO",
  "SOUND",
  "FILE",
] as const;

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
      .max(20000, "Text must be at most 20,000 characters."),

    access: z.enum(contentAccessValues),

    type: z.enum(contentTypeValues),

    isEarnable: z.boolean(),

    contentUrl: z.string().trim(),

    metadata: z.string().trim(),
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

    if (values.metadata) {
      try {
        JSON.parse(values.metadata);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["metadata"],
          message: "Metadata must be valid JSON.",
        });
      }
    }
  });

export type ContentFormValues = z.infer<typeof contentFormSchema>;
