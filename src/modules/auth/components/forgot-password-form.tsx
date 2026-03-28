"use client";

import Link from "next/link";
import { yupResolver } from "@hookform/resolvers/yup";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/atoms/button/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/molecules/card/Card";
import { useForgotPasswordMutation } from "@/modules/auth/api/mutations";
import { FormError } from "@/modules/auth/components/atoms/form-error";
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider";
import { ControlledInputField } from "@/modules/auth/components/molecules/controlled-input-field";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/modules/auth/interfaces/forgot-password.schema";

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const methods = useForm<ForgotPasswordFormValues>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setError(null);
    setSuccess(null);
    try {
      await forgotPasswordMutation.mutateAsync({ email: values.email });
      setSuccess(
        "If an account exists, a reset link has been sent to your email.",
      );
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("Unable to send reset link.");
    }
  }

  return (
    <Card className="w-full max-w-md border shadow-sm">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          Enter your email to receive a reset link.
        </CardDescription>
      </CardHeader>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <FormError message={error} />
          {success ? (
            <p className="text-emerald-600 text-sm">{success}</p>
          ) : null}
          <ControlledInputField
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t bg-transparent">
          <Button
            type="submit"
            className="w-full"
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending
              ? "Sending..."
              : "Send reset link"}
          </Button>
          <p className="text-center text-muted-foreground text-sm">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </FormProvider>
    </Card>
  );
}
