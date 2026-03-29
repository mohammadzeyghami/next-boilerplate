"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listLanguageContentOptionsAction,
  listLanguagesAction,
} from "@/modules/language/actions/language.actions";

import { languageKeys } from "./keys";

export function useLanguagesQuery() {
  return useQuery({
    queryKey: languageKeys.list(),
    queryFn: async () => {
      const res = await listLanguagesAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load languages.");
      }
      return res.data;
    },
  });
}

export function useLanguageContentOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: languageKeys.contentOptions(),
    queryFn: async () => {
      const res = await listLanguageContentOptionsAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load contents.");
      }
      return res.data;
    },
    enabled,
  });
}
