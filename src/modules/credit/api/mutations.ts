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

export function useCreateCreditMutation() {
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
      void queryClient.invalidateQueries({ queryKey: creditKeys.list() });
    },
  });
}

export function useUpdateCreditMutation() {
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
      void queryClient.invalidateQueries({ queryKey: creditKeys.list() });
    },
  });
}

export function useDeleteCreditMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCreditAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.list() });
    },
  });
}

export function useCreateCreditLifeTimeMutation() {
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
      void queryClient.invalidateQueries({ queryKey: creditKeys.lifetimes() });
    },
  });
}

export function useUpdateCreditLifeTimeMutation() {
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
      void queryClient.invalidateQueries({ queryKey: creditKeys.lifetimes() });
    },
  });
}

export function useDeleteCreditLifeTimeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCreditLifeTimeAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: creditKeys.lifetimes() });
    },
  });
}
