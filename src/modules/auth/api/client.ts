"use client";

import { getProviders, getSession, signIn, signOut } from "next-auth/react";

import {
  registerWithPasswordAction,
  type RegisterInput,
} from "@/modules/auth/actions/auth.actions";
import {
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/modules/auth/actions/password-reset.actions";

export const authClientService = {
  register: (input: RegisterInput) => registerWithPasswordAction(input),
  login: (input: { email: string; password: string }) =>
    signIn("credentials", { ...input, redirect: false }),
  /**
   * Google OAuth always starts with a POST to `/api/auth/signin/google` (CSRF + callbackUrl).
   * The JSON response contains `url` → redirect to accounts.google.com. We do that explicitly so
   * TanStack Query / mutation timing cannot interfere with `window.location`.
   */
  loginWithProvider: async (
    provider: "google" | "linkedin",
    callbackUrl = "/dashboard",
    emailHint?: string,
  ) => {
    const providers = await getProviders();
    if (!providers?.[provider]) {
      const label = provider === "google" ? "Google" : "LinkedIn";
      const envHint =
        provider === "google"
          ? "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET"
          : "AUTH_LINKEDIN_ID and AUTH_LINKEDIN_SECRET";
      throw new Error(
        `${label} is not configured. Set ${envHint} in .env and restart the dev server.`,
      );
    }

    const absoluteCallback =
      typeof window !== "undefined"
        ? new URL(callbackUrl, window.location.origin).href
        : callbackUrl;

    /** OIDC `login_hint` — Google shows this account first; LinkedIn may honor it. */
    const trimmedHint = emailHint?.trim();
    const authorizationParams = trimmedHint
      ? { login_hint: trimmedHint }
      : undefined;

    const result = await signIn(
      provider,
      {
        callbackUrl: absoluteCallback,
        redirect: false,
      },
      authorizationParams,
    );

    if (!result) {
      throw new Error("Sign-in returned no response.");
    }
    if (result.error) {
      throw new Error(
        result.error === "Configuration"
          ? "Auth configuration error (check AUTH_SECRET, AUTH_URL, and database)."
          : `OAuth error: ${result.error}`,
      );
    }
    if (result.url) {
      window.location.assign(result.url);
      return;
    }
    throw new Error("Server did not return a redirect URL for OAuth.");
  },
  sendMagicLink: (email: string, callbackUrl = "/dashboard") =>
    signIn("email", { email, redirect: false, callbackUrl }),
  requestPasswordReset: (email: string) =>
    requestPasswordResetAction({ email }),
  resetPassword: (input: { email: string; token: string; password: string }) =>
    resetPasswordAction(input),
  getSession: () => getSession(),
  logout: () => signOut({ redirect: false }),
};
