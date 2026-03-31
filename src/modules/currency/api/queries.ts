"use client";

import { useQuery } from "@tanstack/react-query";

import { listCurrenciesAction } from "@/modules/currency/actions/currency.actions";

import { currencyKeys } from "./keys";

export function useCurrenciesQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: currencyKeys.list(page, pageSize),
    queryFn: async () => {
      const res = await listCurrenciesAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load currencies.");
      }
      return res.data;
    },
  });
}
