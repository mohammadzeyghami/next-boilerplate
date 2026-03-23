"use client"

import Link from "next/link"
import { yupResolver } from "@hookform/resolvers/yup"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"

import { Button } from "@/share-components/atoms/button/Button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/share-components/molecules/card/Card"
import { useResetPasswordMutation } from "@/modules/auth/api/mutations"
import { FormError } from "@/modules/auth/components/atoms/form-error"
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider"
import { ControlledInputField } from "@/modules/auth/components/molecules/controlled-input-field"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/modules/auth/interfaces/reset-password.schema"

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() ?? ""
  const email = searchParams.get("email")?.trim() ?? ""
  const resetPasswordMutation = useResetPasswordMutation()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const methods = useForm<ResetPasswordFormValues>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: ResetPasswordFormValues) {
    setError(null)
    setSuccess(null)
    if (!token || !email) {
      setError("Reset link is invalid.")
      return
    }

    try {
      await resetPasswordMutation.mutateAsync({
        email,
        token,
        password: values.password,
      })
      setSuccess("Password reset successful. You can now sign in.")
      setTimeout(() => {
        router.push("/login")
      }, 1200)
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
        return
      }
      setError("Unable to reset password.")
    }
  }

  return (
    <Card className="w-full max-w-md border shadow-sm">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Create a new password for your account.</CardDescription>
      </CardHeader>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <FormError message={error} />
          {success ? <p className="text-emerald-600 text-sm">{success}</p> : null}
          <ControlledInputField
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
          />
          <ControlledInputField
            name="confirmPassword"
            label="Confirm password"
            type="password"
            autoComplete="new-password"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t bg-transparent">
          <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending}>
            {resetPasswordMutation.isPending ? "Resetting..." : "Reset password"}
          </Button>
          <p className="text-center text-muted-foreground text-sm">
            Back to{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </FormProvider>
    </Card>
  )
}
