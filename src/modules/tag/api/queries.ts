"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listTagContentOptionsAction,
  listTagsPageAction,
  listTagsAction,
} from "@/modules/tag/actions/tag.actions";

import { tagKeys } from "./keys";

export function useTagsQuery() {
  return useQuery({
    queryKey: tagKeys.list(),
    queryFn: async () => {
      const res = await listTagsAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load tags.");
      }
      return res.data;
    },
  });
}

export function useTagsPageQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: tagKeys.paginated(page, pageSize),
    queryFn: async () => {
      const res = await listTagsPageAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load tags.");
      }
      return res.data;
    },
  });
}

export function useTagContentOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: tagKeys.contentOptions(),
    queryFn: async () => {
      const res = await listTagContentOptionsAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load contents.");
      }
      return res.data;
    },
    enabled,
  });
}
