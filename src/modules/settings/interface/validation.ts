import { z } from "zod";

export const editProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(100),

  lastName: z.string().trim().max(100).optional().nullable(),

  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Username format is invalid.")
    .optional()
    .nullable(),

  email: z.string().trim().email("Email is invalid.").optional().nullable(),

  phoneNumber: z
    .string()
    .trim()
    .min(6, "Phone number is invalid.")
    .max(30)
    .optional()
    .nullable(),

  /** Stored paths from `saveContentMediaFile` are relative (e.g. `/uploads/content/...`). */
  image: z
    .string()
    .trim()
    .optional()
    .nullable()
    .superRefine((val, ctx) => {
      if (val == null || val === "") return;
      if (
        /^https?:\/\//i.test(val) ||
        val.startsWith("/uploads/content/")
      ) {
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Image must be a valid URL or an uploaded file path.",
      });
    }),

  born: z.union([z.string(), z.date()]).optional().nullable(),

  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type EditProfileInput = z.infer<typeof editProfileSchema>;
