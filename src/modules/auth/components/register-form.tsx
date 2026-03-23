"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { useRegisterMutation } from "@/modules/auth/api/mutations"
import { FormError } from "@/modules/auth/components/atoms/form-error"
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider"
import { ControlledInputField } from "@/modules/auth/components/molecules/controlled-input-field"

type RegisterFormValues = {
  name: string
  email: string
  password: string
}

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const registerMutation = useRegisterMutation()
  const methods = useForm<RegisterFormValues>({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: RegisterFormValues) {
    setError(null)
    try {
      await registerMutation.mutateAsync(values)
      router.push("/login")
      router.refresh()
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
        return
      }
      setError("Something went wrong.")
    }
  }

  return (
    <Card className="w-full max-w-md border shadow-sm">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Stored in PostgreSQL via Prisma. Password is hashed with bcrypt.
        </CardDescription>
      </CardHeader>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <FormError message={error} />
          <ControlledInputField
            name="name"
            label="Name (optional)"
            type="text"
            autoComplete="name"
          />
          <ControlledInputField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            rules={{ required: "Email is required." }}
          />
          <ControlledInputField
            name="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            rules={{
              required: "Password is required.",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters.",
              },
            }}
            hint="At least 8 characters."
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t bg-transparent">
          <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Creating account..." : "Register"}
          </Button>
          <p className="text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </FormProvider>
    </Card>
  )
}
