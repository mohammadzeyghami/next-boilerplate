"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createCreditAction,
  createCreditLifeTimeAction,
  deleteCreditAction,
  deleteCreditLifeTimeAction,
  updateCreditAction,
  updateCreditLifeTimeAction,
} from "@/modules/credit/actions/credit.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { creditKeys } from "./keys";

export function useCreateCreditMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      metadataJson: string;
      contentTypes: string[];
    }) =>
      createCreditAction(
        toFormData({
          name: payload.name,
          metadataJson: payload.metadataJson,
          contentTypes: payload.contentTypes,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: creditKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useUpdateCreditMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      name: string;
      metadataJson: string;
      contentTypes: string[];
    }) =>
      updateCreditAction(
        toFormData({
          id: payload.id,
          name: payload.name,
          metadataJson: payload.metadataJson,
          contentTypes: payload.contentTypes,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: creditKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useDeleteCreditMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCreditAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: creditKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useCreateCreditLifeTimeMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      creditsId: string;
      name: string;
      metadataJson: string;
      lifeTime: number;
    }) =>
      createCreditLifeTimeAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: creditKeys.lifetimesPaginated(page, pageSize),
      });
    },
  });
}

export function useUpdateCreditLifeTimeMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      creditsId: string;
      name: string;
      metadataJson: string;
      lifeTime: number;
    }) =>
      updateCreditLifeTimeAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: creditKeys.lifetimesPaginated(page, pageSize),
      });
    },
  });
}

export function useDeleteCreditLifeTimeMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCreditLifeTimeAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: creditKeys.lifetimesPaginated(page, pageSize),
      });
    },
  });
}
