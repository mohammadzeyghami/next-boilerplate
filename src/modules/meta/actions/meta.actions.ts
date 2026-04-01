"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import { sendSystemUserEvent } from "@/modules/user-event/actions/user-event.actions";

import { metaFormSchema } from "../interfaces/meta.schema";

export type MetaDto = {
  id: string;
  name: string;
  key: string;
  metadata: Record<string, unknown> | null;
  contentIds: string[];
  defaultValue: number;
  minValue: number | null;
  maxValue: number | null;
  createdAt: string;
  updatedAt: string;
};

export type MetaContentOption = {
  id: string;
  name: string;
};

export type UserMetaDto = {
  id: string;
  userId: string;
  metaId: string;
  metaKey: string;
  metaName: string;
  value: number;
  createdAt: string;
  updatedAt: string;
};

export type MetaActionResult = { ok: boolean; error?: string };

export type MetaValueResult =
  | { status: 200; code: "SUCCESS"; data: UserMetaDto }
  | { status: 404; code: "NOT_FOUND"; error: string };

export type PaginatedMetas = {
  items: MetaDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type DbUserBrief = { id: string; role: UserRole };

async function getCurrentDbUser(): Promise<
  { error: string } | { user: DbUserBrief }
> {
  const session = await auth();
  if (!session?.user?.id) return { error: "You must be signed in." };

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return { error: "User not found." };

  return { user: dbUser };
}

async function requireElevatedActor() {
  const current = await getCurrentDbUser();
  if ("error" in current) return current;
  if (!isElevatedRole(current.user.role)) {
    return { error: "You are not allowed to manage metas." };
  }
  return current;
}

function parseMetadataJson(raw: string): Record<string, unknown> | null {
  const s = raw.trim();
  if (!s) return null;
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Metadata must be a valid JSON object.");
  }
}

function parseContentIdsJson(raw: FormDataEntryValue | null): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function parseNullableNumber(raw: FormDataEntryValue | null): number | undefined {
  const value = String(raw ?? "").trim();
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeOptionalNumber(value: number | undefined) {
  return value === undefined || Number.isNaN(value) ? null : value;
}

function clampValue(
  input: number,
  settings: { minValue: number | null; maxValue: number | null },
) {
  let current = input;
  if (settings.minValue !== null && current < settings.minValue) {
    current = settings.minValue;
  }
  if (settings.maxValue !== null && current > settings.maxValue) {
    current = settings.maxValue;
  }
  return current;
}

function toMetaDto(row: {
  id: string;
  name: string;
  key: string;
  metadata: unknown;
  contentIds: string[];
  defaultValue: number;
  minValue: number | null;
  maxValue: number | null;
  createdAt: Date;
  updatedAt: Date;
}): MetaDto {
  return {
    id: row.id,
    name: row.name,
    key: row.key,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    contentIds: row.contentIds,
    defaultValue: row.defaultValue,
    minValue: row.minValue,
    maxValue: row.maxValue,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toUserMetaDto(row: {
  id: string;
  userId: string;
  metaId: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
  meta: { key: string; name: string };
}): UserMetaDto {
  return {
    id: row.id,
    userId: row.userId,
    metaId: row.metaId,
    metaKey: row.meta.key,
    metaName: row.meta.name,
    value: row.value,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function initializeDefaultMetasForUser(userId: string) {
  const metas = await prisma.meta.findMany({
    select: {
      id: true,
      defaultValue: true,
      minValue: true,
      maxValue: true,
    },
  });

  if (metas.length === 0) return;

  await prisma.userMeta.createMany({
    data: metas.map((meta) => ({
      userId,
      metaId: meta.id,
      value: clampValue(meta.defaultValue, {
        minValue: meta.minValue,
        maxValue: meta.maxValue,
      }),
    })),
    skipDuplicates: true,
  });
}

export async function initializeDefaultMetasForUserTx(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const metas = await tx.meta.findMany({
    select: {
      id: true,
      defaultValue: true,
      minValue: true,
      maxValue: true,
    },
  });

  if (metas.length === 0) return;

  await tx.userMeta.createMany({
    data: metas.map((meta) => ({
      userId,
      metaId: meta.id,
      value: clampValue(meta.defaultValue, {
        minValue: meta.minValue,
        maxValue: meta.maxValue,
      }),
    })),
    skipDuplicates: true,
  });
}

export async function listMetasAction(input?: {
  page?: number;
  pageSize?: number;
}): Promise<{ ok: true; data: PaginatedMetas } | { ok: false; error: string }> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const [items, totalCount] = await prisma.$transaction([
    prisma.meta.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.meta.count(),
  ]);

  return {
    ok: true,
    data: {
      items: items.map(toMetaDto),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function listMetaContentOptionsAction(): Promise<
  { ok: true; data: MetaContentOption[] } | { ok: false; error: string }
> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  const where = isElevatedRole(current.user.role)
    ? {}
    : { ownerId: current.user.id };

  const rows = await prisma.content.findMany({
    where,
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return { ok: true, data: rows };
}

export async function createMetaAction(formData: FormData): Promise<MetaActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();

  const parsed = metaFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    key: String(formData.get("key") ?? "").trim(),
    metadataEntries: [],
    contentIds: parseContentIdsJson(formData.get("contentIds")),
    defaultValue: String(formData.get("defaultValue") ?? "0"),
    minValue: parseNullableNumber(formData.get("minValue")),
    maxValue: parseNullableNumber(formData.get("maxValue")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(metadataJson);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata." };
  }

  const minValue = normalizeOptionalNumber(parsed.data.minValue);
  const maxValue = normalizeOptionalNumber(parsed.data.maxValue);

  if (parsed.data.contentIds.length > 0) {
    const count = await prisma.content.count({
      where: { id: { in: parsed.data.contentIds } },
    });
    if (count !== parsed.data.contentIds.length) {
      return {
        ok: false,
        error: "One or more selected contents do not exist.",
      };
    }
  }

  try {
    await prisma.meta.create({
      data: {
        name: parsed.data.name,
        key: parsed.data.key,
        contentIds: parsed.data.contentIds,
        defaultValue: clampValue(parsed.data.defaultValue, { minValue, maxValue }),
        minValue,
        maxValue,
        ...(metadata !== null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Meta key must be unique." };
    }
    throw error;
  }

  revalidatePath("/dashboard/metas");
  return { ok: true };
}

export async function updateMetaAction(formData: FormData): Promise<MetaActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing meta id." };

  const parsed = metaFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    key: String(formData.get("key") ?? "").trim(),
    metadataEntries: [],
    contentIds: parseContentIdsJson(formData.get("contentIds")),
    defaultValue: String(formData.get("defaultValue") ?? "0"),
    minValue: parseNullableNumber(formData.get("minValue")),
    maxValue: parseNullableNumber(formData.get("maxValue")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(metadataJson);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata." };
  }

  const minValue = normalizeOptionalNumber(parsed.data.minValue);
  const maxValue = normalizeOptionalNumber(parsed.data.maxValue);

  if (parsed.data.contentIds.length > 0) {
    const count = await prisma.content.count({
      where: { id: { in: parsed.data.contentIds } },
    });
    if (count !== parsed.data.contentIds.length) {
      return {
        ok: false,
        error: "One or more selected contents do not exist.",
      };
    }
  }

  try {
    await prisma.meta.update({
      where: { id },
      data: {
        name: parsed.data.name,
        key: parsed.data.key,
        contentIds: parsed.data.contentIds,
        defaultValue: clampValue(parsed.data.defaultValue, { minValue, maxValue }),
        minValue,
        maxValue,
        ...(metadata !== null
          ? { metadata: metadata as Prisma.InputJsonValue }
          : { metadata: Prisma.DbNull }),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Meta key must be unique." };
    }
    return { ok: false, error: "Meta not found." };
  }

  revalidatePath("/dashboard/metas");
  return { ok: true };
}

export async function deleteMetaAction(id: string): Promise<MetaActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  if (!id.trim()) return { ok: false, error: "Missing meta id." };

  try {
    await prisma.meta.delete({ where: { id: id.trim() } });
  } catch {
    return { ok: false, error: "Meta not found." };
  }

  revalidatePath("/dashboard/metas");
  return { ok: true };
}

async function ensureUserMetaByKey(userId: string, key: string) {
  const meta = await prisma.meta.findUnique({
    where: { key },
    select: {
      id: true,
      key: true,
      name: true,
      defaultValue: true,
      minValue: true,
      maxValue: true,
    },
  });
  if (!meta) return null;

  await prisma.userMeta.upsert({
    where: { userId_metaId: { userId, metaId: meta.id } },
    update: {},
    create: {
      userId,
      metaId: meta.id,
      value: clampValue(meta.defaultValue, {
        minValue: meta.minValue,
        maxValue: meta.maxValue,
      }),
    },
  });

  return prisma.userMeta.findUniqueOrThrow({
    where: { userId_metaId: { userId, metaId: meta.id } },
    include: {
      meta: {
        select: { key: true, name: true },
      },
    },
  });
}

export async function getUserMetaAction(
  userId: string,
  key: string,
): Promise<MetaValueResult> {
  const trimmedUserId = userId.trim();
  const trimmedKey = key.trim();

  const user = await prisma.user.findUnique({
    where: { id: trimmedUserId },
    select: { id: true },
  });
  if (!user) {
    return { status: 404, code: "NOT_FOUND", error: "User not found." };
  }

  const row = await ensureUserMetaByKey(trimmedUserId, trimmedKey);
  if (!row) {
    return { status: 404, code: "NOT_FOUND", error: "Meta not found." };
  }
  return { status: 200, code: "SUCCESS", data: toUserMetaDto(row) };
}

export async function getAllUserMetasAction(
  userId: string,
): Promise<
  | { status: 200; code: "SUCCESS"; data: UserMetaDto[] }
  | { status: 404; code: "NOT_FOUND"; error: string }
> {
  const trimmedUserId = userId.trim();
  const targetUser = await prisma.user.findUnique({
    where: { id: trimmedUserId },
    select: { id: true },
  });
  if (!targetUser) {
    return { status: 404, code: "NOT_FOUND", error: "User not found." };
  }

  await initializeDefaultMetasForUser(trimmedUserId);

  const rows = await prisma.userMeta.findMany({
    where: { userId: trimmedUserId },
    orderBy: { createdAt: "desc" },
    include: {
      meta: {
        select: { key: true, name: true },
      },
    },
  });

  return { status: 200, code: "SUCCESS", data: rows.map(toUserMetaDto) };
}

export async function getMyMetasAction() {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { status: 404, code: "NOT_FOUND" as const, error: current.error };
  }
  return getAllUserMetasAction(current.user.id);
}

export async function getMyMetaAction(key: string) {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { status: 404, code: "NOT_FOUND" as const, error: current.error };
  }
  return getUserMetaAction(current.user.id, key);
}

export async function addUserMetaValue(
  userId: string,
  metaId: string,
  value: number,
): Promise<MetaValueResult> {
  const trimmedUserId = userId.trim();
  const trimmedMetaId = metaId.trim();

  const user = await prisma.user.findUnique({
    where: { id: trimmedUserId },
    select: { id: true },
  });
  if (!user) {
    return { status: 404, code: "NOT_FOUND", error: "User not found." };
  }

  const meta = await prisma.meta.findUnique({
    where: { id: trimmedMetaId },
    select: {
      id: true,
      key: true,
      name: true,
      defaultValue: true,
      minValue: true,
      maxValue: true,
    },
  });
  if (!meta) {
    return { status: 404, code: "NOT_FOUND", error: "Meta not found." };
  }

  const row = await prisma.$transaction(async (tx) => {
    const existing = await tx.userMeta.upsert({
      where: { userId_metaId: { userId: trimmedUserId, metaId: trimmedMetaId } },
      update: {},
      create: {
        userId: trimmedUserId,
        metaId: trimmedMetaId,
        value: clampValue(meta.defaultValue, {
          minValue: meta.minValue,
          maxValue: meta.maxValue,
        }),
      },
      include: {
        meta: {
          select: { key: true, name: true },
        },
      },
    });

    const nextValue = clampValue(existing.value + value, {
      minValue: meta.minValue,
      maxValue: meta.maxValue,
    });

    return tx.userMeta.update({
      where: { userId_metaId: { userId: trimmedUserId, metaId: trimmedMetaId } },
      data: { value: nextValue },
      include: {
        meta: {
          select: { key: true, name: true },
        },
      },
    });
  });

  await sendSystemUserEvent({
    eventType: "Meta:Add",
    userId: trimmedUserId,
    payload: { value },
    entityType: "Meta",
    entityId: trimmedMetaId,
  });

  return { status: 200, code: "SUCCESS", data: toUserMetaDto(row) };
}

export async function setUserMetaValue(
  userId: string,
  metaId: string,
  value: number,
): Promise<MetaValueResult> {
  const trimmedUserId = userId.trim();
  const trimmedMetaId = metaId.trim();

  const user = await prisma.user.findUnique({
    where: { id: trimmedUserId },
    select: { id: true },
  });
  if (!user) {
    return { status: 404, code: "NOT_FOUND", error: "User not found." };
  }

  const meta = await prisma.meta.findUnique({
    where: { id: trimmedMetaId },
    select: {
      id: true,
      key: true,
      name: true,
      defaultValue: true,
      minValue: true,
      maxValue: true,
    },
  });
  if (!meta) {
    return { status: 404, code: "NOT_FOUND", error: "Meta not found." };
  }

  const clampedValue = clampValue(value, {
    minValue: meta.minValue,
    maxValue: meta.maxValue,
  });

  const row = await prisma.userMeta.upsert({
    where: { userId_metaId: { userId: trimmedUserId, metaId: trimmedMetaId } },
    update: {
      value: clampedValue,
    },
    create: {
      userId: trimmedUserId,
      metaId: trimmedMetaId,
      value: clampedValue,
    },
    include: {
      meta: {
        select: { key: true, name: true },
      },
    },
  });

  await sendSystemUserEvent({
    eventType: "Meta:Set",
    userId: trimmedUserId,
    payload: { value },
    entityType: "Meta",
    entityId: trimmedMetaId,
  });

  return { status: 200, code: "SUCCESS", data: toUserMetaDto(row) };
}
