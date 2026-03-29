"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createLanguageAction,
  deleteLanguageAction,
} from "@/modules/language/actions/language.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { languageKeys } from "./keys";

export function useCreateLanguageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string;
      contentIds: string[];
    }) => {
      const formData = toFormData({
        name: payload.name,
        description: payload.description,
        contentIds: payload.contentIds,
      });
      return createLanguageAction(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: languageKeys.list() });
    },
  });
}

export function useDeleteLanguageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteLanguageAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: languageKeys.list() });
    },
  });
}
