"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Chrome, Linkedin, Mail } from "lucide-react";

import { Button } from "@/share-components/atoms/button/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/share-components/molecules/card/Card";
import {
  useLoginMutation,
  useMagicLinkMutation,
  useOAuthLoginMutation,
} from "@/modules/auth/api/mutations";
import { FormError } from "@/modules/auth/components/atoms/form-error";
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider";
import { ControlledInputField } from "@/modules/auth/components/molecules/controlled-input-field";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const loginMutation = useLoginMutation();
  const oauthLoginMutation = useOAuthLoginMutation();
  const magicLinkMutation = useMagicLinkMutation();
  const methods = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setError(null);
    setInfo(null);
    try {
      await loginMutation.mutateAsync(values);
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("Something went wrong.");
    }
  }

  async function onOAuthLogin(provider: "google" | "linkedin") {
    setError(null);
    setInfo(null);
    const emailFieldValid = await methods.trigger("email", {
      shouldFocus: true,
    });
    const email = methods.getValues("email")?.trim() ?? "";
    if (!emailFieldValid || !email) {
      setError(
        "Enter your email first — we use it for Google/LinkedIn (login hint) so you sign in with the right account.",
      );
      return;
    }
    try {
      await oauthLoginMutation.mutateAsync({
        provider,
        callbackUrl,
        emailHint: email,
      });
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("OAuth sign-in failed.");
    }
  }

  async function onSendMagicLink() {
    const email = methods.getValues("email")?.trim();
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Enter your email to receive a magic link.");
      return;
    }
    try {
      await magicLinkMutation.mutateAsync({ email, callbackUrl });
      setInfo("Magic link sent. Check your inbox.");
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message);
        return;
      }
      setError("Unable to send magic link.");
    }
  }

  return (
    <Card className="w-full max-w-md border shadow-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Password sign-in uses email + password below. For Google or LinkedIn,
          fill <strong>Email</strong> first, then click the provider — OAuth
          opens for that address.
        </CardDescription>
      </CardHeader>
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <FormError message={error} />
          {info ? <p className="text-emerald-600 text-sm">{info}</p> : null}
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
            autoComplete="current-password"
            rules={{ required: "Password is required." }}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t bg-transparent">
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={() => void onSendMagicLink()}
            disabled={magicLinkMutation.isPending}
          >
            <Mail className="size-4" />
            {magicLinkMutation.isPending
              ? "Sending link..."
              : "Email (Magic Link)"}
          </Button>
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => void onOAuthLogin("google")}
              disabled={oauthLoginMutation.isPending}
            >
              <Chrome className="size-4" />
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => void onOAuthLogin("linkedin")}
              disabled={oauthLoginMutation.isPending}
            >
              <Linkedin className="size-4" />
              LinkedIn
            </Button>
          </div>
          <p className="text-center text-muted-foreground text-sm">
            No account?{" "}
            <Link
              href="/register"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Register
            </Link>
          </p>
          <p className="text-center text-muted-foreground text-sm">
            Forgot your password?{" "}
            <Link
              href="/forgot-password"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Reset it
            </Link>
          </p>
        </CardFooter>
      </FormProvider>
    </Card>
  );
}
