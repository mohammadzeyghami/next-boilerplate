"use server";

import { Prisma } from "@/generated/prisma/client";
import type { UserEventActorType, UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";

import {
  paginationSchema,
  userEventSendSchema,
  type UserEventSendValues,
} from "../interfaces/user-event.schema";

export type UserEventDto = {
  id: string;
  eventType: string;
  type: UserEventActorType;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  metadata: Prisma.JsonValue | null;
  payload: Prisma.JsonValue | null;
  context: Prisma.JsonValue | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
};

export type EventTypeStatisticDto = {
  id: string;
  eventType: string;
  count: number;
  updatedAt: string;
  createdAt: string;
};

export type UserEventSendActionResult =
  | {
      status: 201;
      code: "SUCCESS";
      data: UserEventDto;
    }
  | {
      status: number;
      code: "ERROR";
      error: string;
    };

export type PaginatedResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type DbUserBrief = { id: string; role: UserRole; name: string | null; email: string | null };

async function getCurrentDbUser(): Promise<
  { error: string } | { user: DbUserBrief }
> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
    },
  });

  if (!dbUser) {
    return { error: "User not found." };
  }

  return { user: dbUser };
}

async function requireElevatedActor(): Promise<
  { error: string } | { user: DbUserBrief }
> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return current;
  }
  if (!isElevatedRole(current.user.role)) {
    return { error: "You are not allowed to access user events." };
  }
  return current;
}

function normalizeNullableString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toUserEventDto(row: {
  id: string;
  eventType: string;
  type: UserEventActorType;
  userId: string;
  metadata: Prisma.JsonValue | null;
  payload: Prisma.JsonValue | null;
  context: Prisma.JsonValue | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: Date;
  user: { name: string | null; email: string | null };
}): UserEventDto {
  return {
    id: row.id,
    eventType: row.eventType,
    type: row.type,
    userId: row.userId,
    userName: row.user.name,
    userEmail: row.user.email,
    metadata: row.metadata,
    payload: row.payload,
    context: row.context,
    entityType: row.entityType,
    entityId: row.entityId,
    createdAt: row.createdAt.toISOString(),
  };
}

function toStatisticDto(row: {
  id: string;
  eventType: string;
  count: number;
  updatedAt: Date;
  createdAt: Date;
}): EventTypeStatisticDto {
  return {
    id: row.id,
    eventType: row.eventType,
    count: row.count,
    updatedAt: row.updatedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

async function validateTargetUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return user;
}

async function persistUserEvent(
  values: UserEventSendValues,
  type: UserEventActorType,
) {
  const entityType = normalizeNullableString(values.entityType);
  const entityId = normalizeNullableString(values.entityId);

  const created = await prisma.$transaction(async (tx) => {
    const event = await tx.userEvent.create({
      data: {
        eventType: values.eventType.trim(),
        type,
        userId: values.userId.trim(),
        payload:
          values.payload === undefined
            ? Prisma.JsonNull
            : (values.payload as Prisma.InputJsonValue),
        metadata:
          values.metadata === undefined
            ? Prisma.JsonNull
            : (values.metadata as Prisma.InputJsonValue),
        context:
          values.context === undefined
            ? Prisma.JsonNull
            : (values.context as Prisma.InputJsonValue),
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    await tx.eventTypeStatistic.upsert({
      where: { eventType: values.eventType.trim() },
      update: {
        count: { increment: 1 },
      },
      create: {
        eventType: values.eventType.trim(),
        count: 1,
      },
    });

    return event;
  });

  return toUserEventDto(created);
}

export async function sendUserEventAction(
  input: UserEventSendValues,
): Promise<UserEventSendActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { status: 401, code: "ERROR", error: current.error };
  }

  const parsed = userEventSendSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: 400,
      code: "ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  if (
    parsed.data.userId.trim() !== current.user.id &&
    !isElevatedRole(current.user.role)
  ) {
    return {
      status: 403,
      code: "ERROR",
      error: "You are not allowed to send events for another user.",
    };
  }

  const targetUser = await validateTargetUser(parsed.data.userId.trim());
  if (!targetUser) {
    return { status: 404, code: "ERROR", error: "User not found." };
  }

  const dto = await persistUserEvent(parsed.data, "USER");
  return {
    status: 201,
    code: "SUCCESS",
    data: dto,
  };
}

export async function sendSystemUserEvent(
  input: UserEventSendValues,
): Promise<UserEventDto> {
  const parsed = userEventSendSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input.");
  }

  const targetUser = await validateTargetUser(parsed.data.userId.trim());
  if (!targetUser) {
    throw new Error("User not found.");
  }

  return persistUserEvent(parsed.data, "SYSTEM");
}

export async function sendUserCreatedEvent(
  userId: string,
  payload?: Record<string, unknown> | null,
  metadata?: Record<string, unknown> | null,
) {
  return sendSystemUserEvent({
    eventType: "User:UserCreated",
    userId,
    payload: payload ?? undefined,
    metadata: metadata ?? undefined,
    entityType: "Users",
    entityId: userId,
  });
}

export async function sendLoginEvent(
  userId: string,
  payload?: Record<string, unknown> | null,
  metadata?: Record<string, unknown> | null,
) {
  return sendSystemUserEvent({
    eventType: "User:Login",
    userId,
    payload: payload ?? undefined,
    metadata: metadata ?? undefined,
    entityType: "Users",
    entityId: userId,
  });
}

export async function updateEventTypeStatistic(eventType: string) {
  const trimmed = eventType.trim();
  if (!trimmed) {
    throw new Error("Event type is required.");
  }

  await prisma.eventTypeStatistic.upsert({
    where: { eventType: trimmed },
    update: { count: { increment: 1 } },
    create: { eventType: trimmed, count: 1 },
  });
}

export async function listUserEventsAction(input?: {
  page?: number;
  pageSize?: number;
}): Promise<{ ok: true; data: PaginatedResult<UserEventDto> } | { ok: false; error: string }> {
  const gate = await requireElevatedActor();
  if ("error" in gate) {
    return { ok: false, error: gate.error };
  }

  const parsed = paginationSchema.safeParse({
    page: input?.page ?? 1,
    pageSize: input?.pageSize ?? 20,
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid pagination." };
  }

  const { page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;

  const [totalCount, rows] = await prisma.$transaction([
    prisma.userEvent.count(),
    prisma.userEvent.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    ok: true,
    data: {
      items: rows.map(toUserEventDto),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function listEventTypeStatisticsAction(input?: {
  page?: number;
  pageSize?: number;
}): Promise<
  { ok: true; data: PaginatedResult<EventTypeStatisticDto> } | { ok: false; error: string }
> {
  const gate = await requireElevatedActor();
  if ("error" in gate) {
    return { ok: false, error: gate.error };
  }

  const parsed = paginationSchema.safeParse({
    page: input?.page ?? 1,
    pageSize: input?.pageSize ?? 20,
  });
  if (!parsed.success) {
    return { ok: false, error: "Invalid pagination." };
  }

  const { page, pageSize } = parsed.data;
  const skip = (page - 1) * pageSize;

  const [totalCount, rows] = await prisma.$transaction([
    prisma.eventTypeStatistic.count(),
    prisma.eventTypeStatistic.findMany({
      orderBy: [{ count: "desc" }, { updatedAt: "desc" }],
      skip,
      take: pageSize,
    }),
  ]);

  return {
    ok: true,
    data: {
      items: rows.map(toStatisticDto),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}
