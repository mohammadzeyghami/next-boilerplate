import * as yup from "yup"

export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .trim()
    .min(8, "Password must be at least 8 characters.")
    .required("Password is required."),
  confirmPassword: yup
    .string()
    .trim()
    .oneOf([yup.ref("password")], "Passwords do not match.")
    .required("Please confirm your password."),
})

export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>
