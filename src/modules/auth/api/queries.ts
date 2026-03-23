"use client"

import { useQuery } from "@tanstack/react-query"

import { authClientService } from "@/modules/auth/api/client"
import { authKeys } from "@/modules/auth/api/keys"

export function useAuthSessionQuery() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => authClientService.getSession(),
    staleTime: 30_000,
    /** After login redirect, navbar mounts with a fresh `getSession()` so `user.image` is present. */
    refetchOnMount: "always",
  })
}
