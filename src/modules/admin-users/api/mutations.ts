"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createAdminUserAction,
  deleteAdminUserAction,
  updateAdminUserAction,
} from "@/modules/admin-users/actions/admin-users.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { adminUserKeys } from "./keys";

export function useCreateAdminUserMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      name: string;
      lastName: string;
      role: string;
    }) => createAdminUserAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: adminUserKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useUpdateAdminUserMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, string | undefined>) =>
      updateAdminUserAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: adminUserKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useDeleteAdminUserMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userAuthId: string) => deleteAdminUserAction(userAuthId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminUserKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: adminUserKeys.paginated(page, pageSize),
      });
    },
  });
}
