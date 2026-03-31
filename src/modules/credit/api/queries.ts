"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listCreditsAction,
  listCreditLifeTimesAction,
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
