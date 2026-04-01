"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createCurrencyAction,
  deleteCurrencyAction,
  updateCurrencyAction,
} from "@/modules/currency/actions/currency.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { currencyKeys } from "./keys";

export function useCreateCurrencyMutation(page: number, pageSize: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      key: string;
      metadataJson: string;
      contentIds: string[];
      defaultValue: number;
      stableValue: number;
    }) => createCurrencyAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: currencyKeys.list(page, pageSize),
      });
    },
  });
}

export function useUpdateCurrencyMutation(page: number, pageSize: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      name: string;
      key: string;
      metadataJson: string;
      contentIds: string[];
      defaultValue: number;
      stableValue: number;
    }) => updateCurrencyAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: currencyKeys.list(page, pageSize),
      });
    },
  });
}

export function useDeleteCurrencyMutation(page: number, pageSize: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCurrencyAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: currencyKeys.list(page, pageSize),
      });
    },
  });
}
