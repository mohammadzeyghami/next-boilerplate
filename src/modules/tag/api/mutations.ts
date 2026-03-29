"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createTagAction,
  deleteTagAction,
  updateTagAction,
} from "@/modules/tag/actions/tag.actions";
import { toFormData } from "@/shared/utils/toFormData";

import { tagKeys } from "./keys";

export function useCreateTagMutation() {
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
      return createTagAction(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.list() });
    },
  });
}

export function useUpdateTagMutation() {
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
      return updateTagAction(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.list() });
    },
  });
}

export function useDeleteTagMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTagAction(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tagKeys.list() });
    },
  });
}
