"use client";

import { useQuery } from "@tanstack/react-query";

import { listAdminUsersAction } from "@/modules/admin-users/actions/admin-users.actions";

import { adminUserKeys } from "./keys";

export function useAdminUsersQuery(enabled = true) {
  return useQuery({
    queryKey: adminUserKeys.list(),
    queryFn: async () => {
      const res = await listAdminUsersAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load users.");
      }
      return res.data;
    },
    enabled,
  });
}
