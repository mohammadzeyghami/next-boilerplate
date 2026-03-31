"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createMetaAction,
  deleteMetaAction,
  updateMetaAction,
} from "@/modules/meta/actions/meta.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { metaKeys } from "./keys";

export function useCreateMetaMutation(page: number, pageSize: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      key: string;
      metadataJson: string;
      contentTypes: string[];
      defaultValue: number;
      minValue: number | null;
      maxValue: number | null;
    }) => createMetaAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: metaKeys.list(page, pageSize),
      });
    },
  });
}

export function useUpdateMetaMutation(page: number, pageSize: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      id: string;
      name: string;
      key: string;
      metadataJson: string;
      contentTypes: string[];
      defaultValue: number;
      minValue: number | null;
      maxValue: number | null;
    }) => updateMetaAction(toFormData(payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: metaKeys.list(page, pageSize),
      });
    },
  });
}

export function useDeleteMetaMutation(page: number, pageSize: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMetaAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: metaKeys.list(page, pageSize),
      });
    },
  });
}
