import * as yup from "yup"

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email("Enter a valid email address.")
    .required("Email is required."),
})

export type ForgotPasswordFormValues = yup.InferType<typeof forgotPasswordSchema>
