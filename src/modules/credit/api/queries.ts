"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listCreditsAction,
  listCreditLifeTimesAction,
  listCreditsPageAction,
  listCreditLifeTimesPageAction,
} from "@/modules/credit/actions/credit.actions";

import { creditKeys } from "./keys";

export function useCreditsQuery() {
  return useQuery({
    queryKey: creditKeys.list(),
    queryFn: async () => {
      const res = await listCreditsAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load credits.");
      }
      return res.data;
    },
  });
}

export function useCreditsPageQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: creditKeys.paginated(page, pageSize),
    queryFn: async () => {
      const res = await listCreditsPageAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load credits.");
      }
      return res.data;
    },
  });
}

export function useCreditLifeTimesQuery() {
  return useQuery({
    queryKey: creditKeys.lifetimes(),
    queryFn: async () => {
      const res = await listCreditLifeTimesAction();
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load credit life times.");
      }
      return res.data;
    },
  });
}

export function useCreditLifeTimesPageQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: creditKeys.lifetimesPaginated(page, pageSize),
    queryFn: async () => {
      const res = await listCreditLifeTimesPageAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load credit life times.");
      }
      return res.data;
    },
  });
}
