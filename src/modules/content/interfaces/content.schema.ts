import * as yup from "yup"

export const contentSchema = yup.object({
  title: yup
    .string()
    .trim()
    .required("Title is required.")
    .min(1, "Title is required.")
    .max(200, "Title must be at most 200 characters."),
  body: yup
    .string()
    .trim()
    .required("Body is required.")
    .min(1, "Body is required.")
    .max(20_000, "Body must be at most 20,000 characters."),
})

export type ContentFormValues = yup.InferType<typeof contentSchema>
