"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createLanguageAction,
  deleteLanguageAction,
  updateLanguageAction,
} from "@/modules/language/actions/language.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { languageKeys } from "./keys";

export function useCreateLanguageMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string;
      contentIds: string[];
      categoryIds: string[];
      tagIds: string[];
    }) => {
      const formData = toFormData({
        name: payload.name,
        description: payload.description,
        contentIds: payload.contentIds,
        categoryIds: payload.categoryIds,
        tagIds: payload.tagIds,
      });
      return createLanguageAction(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: languageKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: languageKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useDeleteLanguageMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLanguageAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: languageKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: languageKeys.paginated(page, pageSize),
      });
    },
  });
}

export function useUpdateLanguageMutation(page = 1, pageSize = 10) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      id: string;
      name: string;
      description: string;
      contentIds: string[];
      categoryIds: string[];
      tagIds: string[];
    }) => {
      const formData = toFormData({
        id: payload.id,
        name: payload.name,
        description: payload.description,
        contentIds: payload.contentIds,
        categoryIds: payload.categoryIds,
        tagIds: payload.tagIds,
      });
      return updateLanguageAction(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: languageKeys.all() });
      void queryClient.invalidateQueries({
        queryKey: languageKeys.paginated(page, pageSize),
      });
    },
  });
}
