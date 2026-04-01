"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listMetaContentOptionsAction,
  listMetasAction,
} from "@/modules/meta/actions/meta.actions";

import { metaKeys } from "./keys";

export function useMetasQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: metaKeys.list(page, pageSize),
    queryFn: async () => {
      const res = await listMetasAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load metas.");
      }
      return res.data;
    },
  });
}

export function useMetaContentOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: metaKeys.contentOptions(),
    queryFn: async () => {
      const res = await listMetaContentOptionsAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load content options.");
      }
      return res.data;
    },
    enabled,
  });
}
