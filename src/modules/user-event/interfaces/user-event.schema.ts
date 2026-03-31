import { z } from "zod";

export const userEventActorTypeValues = ["USER", "SYSTEM"] as const;

export const userEventSendSchema = z
  .object({
    eventType: z
      .string()
      .trim()
      .min(1, "Event type is required.")
      .max(200, "Event type must be at most 200 characters."),
    userId: z.string().trim().min(1, "User id is required."),
    payload: z.unknown().optional(),
    metadata: z.unknown().optional(),
    context: z.unknown().optional(),
    entityType: z.string().trim().max(200).optional().or(z.literal("")),
    entityId: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .superRefine((values, ctx) => {
    const hasEntityType = Boolean(values.entityType?.trim());
    const hasEntityId = Boolean(values.entityId?.trim());

    if (hasEntityType !== hasEntityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasEntityType ? ["entityId"] : ["entityType"],
        message: "entityType and entityId must be provided together.",
      });
    }
  });

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type UserEventSendValues = z.infer<typeof userEventSendSchema>;
