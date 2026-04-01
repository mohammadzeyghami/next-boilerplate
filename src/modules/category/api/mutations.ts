"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/modules/category/actions/category.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { categoryKeys } from "./keys";

export function useCreateCategoryMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string;
      label: string;
      metadataJson: string;
      contentIds: string[];
    }) => {
      const formData = toFormData({
        name: payload.name,
        description: payload.description,
        label: payload.label,
        metadataJson: payload.metadataJson,
        contentIds: payload.contentIds,
      });
      return createCategoryAction(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useUpdateCategoryMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      description: string;
      label: string;
      metadataJson: string;
      contentIds: string[];
    }) => {
      const formData = toFormData({
        id: payload.id,
        name: payload.name,
        description: payload.description,
        label: payload.label,
        metadataJson: payload.metadataJson,
        contentIds: payload.contentIds,
      });
      return updateCategoryAction(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useDeleteCategoryMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategoryAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: categoryKeys.paginated(page, pageSize),
      });
    },
  });
}
