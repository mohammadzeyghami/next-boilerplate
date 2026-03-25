"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Chrome, Linkedin, Mail } from "lucide-react";

import { Button } from "@/shared/components/atoms/button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/molecules/dialog/dialog";
import {
  useLoginMutation,
  useMagicLinkMutation,
  useOAuthLoginMutation,
} from "@/modules/auth/api/mutations";
import { FormError } from "@/modules/auth/components/atoms/form-error";
import { FormProvider } from "@/modules/auth/components/molecules/auth-form-provider";
import { ControlledInputField } from "@/modules/auth/components/molecules/controlled-input-field";

type LoginRequiredModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string;
};

type LoginValues = {
  email: string;
  password: string;
};

export function LoginRequiredModal({
  open,
  onOpenChange,
  callbackUrl = "/dashboard",
}: LoginRequiredModalProps) {
  const router = useRouter();
  const loginMutation = useLoginMutation();
  const magicLinkMutation = useMagicLinkMutation();
  const oauthLoginMutation = useOAuthLoginMutation();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const methods = useForm<LoginValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginValues) {
    setError(null);
    setInfo(null);
    try {
      await loginMutation.mutateAsync(values);
      onOpenChange(false);
      methods.reset();
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
        "Enter your email first, then use Google or LinkedIn with that account.",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Login required</DialogTitle>
          <DialogDescription>
            Sign in with email + password, or enter your email first and use
            Google / LinkedIn.
          </DialogDescription>
        </DialogHeader>
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <div className="space-y-4">
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
          </div>
          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full gap-2"
            onClick={() => void onSendMagicLink()}
            disabled={magicLinkMutation.isPending}
          >
            <Mail className="size-4" />
            {magicLinkMutation.isPending
              ? "Sending link..."
              : "Email (Magic Link)"}
          </Button>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
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
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
