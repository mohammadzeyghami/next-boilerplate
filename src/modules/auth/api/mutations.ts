"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { RegisterInput } from "@/modules/auth/actions/auth.actions"
import { authClientService } from "@/modules/auth/api/client"
import { authKeys } from "@/modules/auth/api/keys"

export function useRegisterMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const result = await authClientService.register(input)
      if (!result.ok) {
        throw new Error(result.error ?? "Registration failed.")
      }
      return result
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}

export function useLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const result = await authClientService.login(input)
      if (!result || result.error) {
        throw new Error("Invalid email or password.")
      }
      return result
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}

export function useOAuthLoginMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      provider: "google" | "linkedin"
      callbackUrl?: string
      /** Shown on provider screen (Google: `login_hint`) */
      emailHint: string
    }) => {
      await authClientService.loginWithProvider(
        input.provider,
        input.callbackUrl,
        input.emailHint
      )
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}

export function useMagicLinkMutation() {
  return useMutation({
    mutationFn: async (input: { email: string; callbackUrl?: string }) => {
      const result = await authClientService.sendMagicLink(input.email, input.callbackUrl)
      if (!result || result.error) {
        throw new Error("Unable to send magic link.")
      }
      return result
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const result = await authClientService.requestPasswordReset(input.email)
      if (!result.ok) {
        throw new Error(result.error ?? "Unable to send reset link.")
      }
      return result
    },
  })
}

export function useResetPasswordMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: { email: string; token: string; password: string }) => {
      const result = await authClientService.resetPassword(input)
      if (!result.ok) {
        throw new Error(result.error ?? "Unable to reset password.")
      }
      return result
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await authClientService.logout()
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() })
    },
  })
}
