import * as yup from "yup";

export const contentAccessValues = ["PRIVATE", "PUBLIC"] as const;
export const contentTypeValues = [
  "TEXT",
  "IMAGE",
  "VIDEO",
  "SOUND",
  "FILE",
] as const;

export const contentFormSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Name is required.")
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),

  text: yup
    .string()
    .trim()
    .nullable()
    .max(20_000, "Text must be at most 20,000 characters."),

  access: yup
    .mixed<"PRIVATE" | "PUBLIC">()
    .oneOf(contentAccessValues)
    .required("Access is required."),

  type: yup
    .mixed<"TEXT" | "IMAGE" | "VIDEO" | "SOUND" | "FILE">()
    .oneOf(contentTypeValues)
    .required("Type is required."),

  isEarnable: yup.boolean().required(),

  metadataText: yup.string().nullable().default(""),
});

export type ContentFormValues = yup.InferType<typeof contentFormSchema>;
export const contentSchema = yup.object({
  name: yup
    .string()
    .trim()
    .required("Name is required.")
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),

  text: yup
    .string()
    .trim()
    .nullable()
    .max(20_000, "Text must be at most 20,000 characters."),

  access: yup
    .mixed<"PRIVATE" | "PUBLIC">()
    .oneOf(contentAccessValues)
    .required("Access is required."),

  type: yup
    .mixed<"TEXT" | "IMAGE" | "VIDEO" | "SOUND" | "FILE">()
    .oneOf(contentTypeValues)
    .required("Type is required."),

  isEarnable: yup.boolean().required(),

  metadata: yup.mixed<Record<string, unknown>>().nullable(),
});

export type ContentListItem = {
  id: string;
  name: string;
  ownerId: string;
  text?: string | null;
  access: "PRIVATE" | "PUBLIC";
  metadata?: Record<string, unknown> | null;
  contentUrl?: string | null;
  type: "TEXT" | "IMAGE" | "VIDEO" | "SOUND" | "FILE";
  isEarnable: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorLabel?: string | null;
};
