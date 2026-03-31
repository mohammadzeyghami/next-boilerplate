"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  sendUserEventAction,
} from "@/modules/user-event/actions/user-event.actions";
import type { UserEventSendValues } from "@/modules/user-event/interfaces/user-event.schema";

import { userEventKeys } from "./keys";

export function useSendUserEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UserEventSendValues) => sendUserEventAction(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userEventKeys.all() });
    },
  });
}
