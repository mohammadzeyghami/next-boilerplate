"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listCategoriesAction,
  listCategoriesPageAction,
  listCategoryContentOptionsAction,
} from "@/modules/category/actions/category.actions";

import { categoryKeys } from "./keys";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const res = await listCategoriesAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load categories.");
      }
      return res.data;
    },
    retry: false,
  });
}

export function useCategoriesPageQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: categoryKeys.paginated(page, pageSize),
    queryFn: async () => {
      const res = await listCategoriesPageAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load categories.");
      }
      return res.data;
    },
    retry: false,
  });
}

export function useCategoryContentOptionsQuery(enabled = true) {
  return useQuery({
    queryKey: categoryKeys.contentOptions(),
    queryFn: async () => {
      const res = await listCategoryContentOptionsAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load contents.");
      }
      return res.data;
    },
    enabled,
    retry: false,
  });
}
