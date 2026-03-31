"use client";

import { useQuery } from "@tanstack/react-query";

import {
  listEventTypeStatisticsAction,
  listUserEventsAction,
} from "@/modules/user-event/actions/user-event.actions";

import { userEventKeys } from "./keys";

export function useUserEventsQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: userEventKeys.events(page, pageSize),
    queryFn: async () => {
      const res = await listUserEventsAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load user events.");
      }
      return res.data;
    },
  });
}

export function useEventTypeStatisticsQuery(page: number, pageSize: number) {
  return useQuery({
    queryKey: userEventKeys.statistics(page, pageSize),
    queryFn: async () => {
      const res = await listEventTypeStatisticsAction({ page, pageSize });
      if (!res.ok) {
        throw new Error(res.error ?? "Failed to load event statistics.");
      }
      return res.data;
    },
  });
}
