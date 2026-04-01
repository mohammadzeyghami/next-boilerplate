"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import type { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import { sendSystemUserEvent } from "@/modules/user-event/actions/user-event.actions";

import { currencyFormSchema } from "../interfaces/currency.schema";

export type CurrencyDto = {
  id: string;
  name: string;
  key: string;
  metadata: Record<string, unknown> | null;
  contentIds: string[];
  defaultValue: number;
  stableValue: number;
  createdAt: string;
  updatedAt: string;
};

export type CurrencyContentOption = {
  id: string;
  name: string;
};

export type UserCurrencyDto = {
  id: string;
  userId: string;
  currencyId: string;
  currencyKey: string;
  currencyName: string;
  value: number;
  createdAt: string;
  updatedAt: string;
};

export type CurrencyActionResult = { ok: boolean; error?: string };

export type CurrencyValueResult =
  | { status: 200; code: "SUCCESS"; data: UserCurrencyDto }
  | { status: 404; code: "NOT_FOUND"; error: string }
  | { status: 409; code: "CURRENCY_NOT_ENOUGH"; error: string };

export type PaginatedCurrencies = {
  items: CurrencyDto[];
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
    return { error: "You are not allowed to manage currencies." };
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

function toCurrencyDto(row: {
  id: string;
  name: string;
  key: string;
  metadata: unknown;
  contentIds: string[];
  defaultValue: number;
  stableValue: number;
  createdAt: Date;
  updatedAt: Date;
}): CurrencyDto {
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
    stableValue: row.stableValue,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toUserCurrencyDto(row: {
  id: string;
  userId: string;
  currencyId: string;
  value: number;
  createdAt: Date;
  updatedAt: Date;
  currency: { key: string; name: string };
}): UserCurrencyDto {
  return {
    id: row.id,
    userId: row.userId,
    currencyId: row.currencyId,
    currencyKey: row.currency.key,
    currencyName: row.currency.name,
    value: row.value,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function initializeDefaultCurrenciesForUser(userId: string) {
  const currencies = await prisma.currency.findMany({
    select: { id: true, defaultValue: true },
  });

  if (currencies.length === 0) return;

  await prisma.userCurrency.createMany({
    data: currencies.map((currency) => ({
      userId,
      currencyId: currency.id,
      value: currency.defaultValue,
    })),
    skipDuplicates: true,
  });
}

export async function initializeDefaultCurrenciesForUserTx(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const currencies = await tx.currency.findMany({
    select: { id: true, defaultValue: true },
  });

  if (currencies.length === 0) return;

  await tx.userCurrency.createMany({
    data: currencies.map((currency) => ({
      userId,
      currencyId: currency.id,
      value: currency.defaultValue,
    })),
    skipDuplicates: true,
  });
}

export async function listCurrenciesAction(input?: {
  page?: number;
  pageSize?: number;
}): Promise<{ ok: true; data: PaginatedCurrencies } | { ok: false; error: string }> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const [items, totalCount] = await prisma.$transaction([
    prisma.currency.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.currency.count(),
  ]);

  return {
    ok: true,
    data: {
      items: items.map(toCurrencyDto),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function listCurrencyContentOptionsAction(): Promise<
  | { ok: true; data: CurrencyContentOption[] }
  | { ok: false; error: string }
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

export async function createCurrencyAction(formData: FormData): Promise<CurrencyActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();

  const parsed = currencyFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    key: String(formData.get("key") ?? "").trim(),
    metadataEntries: [],
    contentIds: parseContentIdsJson(formData.get("contentIds")),
    defaultValue: String(formData.get("defaultValue") ?? "0"),
    stableValue: String(formData.get("stableValue") ?? "1"),
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
    await prisma.currency.create({
      data: {
        name: parsed.data.name,
        key: parsed.data.key,
        contentIds: parsed.data.contentIds,
        defaultValue: parsed.data.defaultValue,
        stableValue: parsed.data.stableValue,
        ...(metadata !== null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "Currency key must be unique." };
    }
    throw error;
  }

  revalidatePath("/dashboard/currencies");
  return { ok: true };
}

export async function updateCurrencyAction(formData: FormData): Promise<CurrencyActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing currency id." };

  const parsed = currencyFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    key: String(formData.get("key") ?? "").trim(),
    metadataEntries: [],
    contentIds: parseContentIdsJson(formData.get("contentIds")),
    defaultValue: String(formData.get("defaultValue") ?? "0"),
    stableValue: String(formData.get("stableValue") ?? "1"),
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
    await prisma.currency.update({
      where: { id },
      data: {
        name: parsed.data.name,
        key: parsed.data.key,
        contentIds: parsed.data.contentIds,
        defaultValue: parsed.data.defaultValue,
        stableValue: parsed.data.stableValue,
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
      return { ok: false, error: "Currency key must be unique." };
    }
    return { ok: false, error: "Currency not found." };
  }

  revalidatePath("/dashboard/currencies");
  return { ok: true };
}

export async function deleteCurrencyAction(id: string): Promise<CurrencyActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  if (!id.trim()) return { ok: false, error: "Missing currency id." };

  try {
    await prisma.currency.delete({ where: { id: id.trim() } });
  } catch {
    return { ok: false, error: "Currency not found." };
  }

  revalidatePath("/dashboard/currencies");
  return { ok: true };
}

async function ensureUserCurrency(userId: string, currencyKey: string) {
  const currency = await prisma.currency.findUnique({
    where: { key: currencyKey },
    select: {
      id: true,
      key: true,
      name: true,
      defaultValue: true,
    },
  });
  if (!currency) return null;

  await prisma.userCurrency.upsert({
    where: { userId_currencyId: { userId, currencyId: currency.id } },
    update: {},
    create: {
      userId,
      currencyId: currency.id,
      value: currency.defaultValue,
    },
  });

  return prisma.userCurrency.findUniqueOrThrow({
    where: { userId_currencyId: { userId, currencyId: currency.id } },
    include: {
      currency: {
        select: { key: true, name: true },
      },
    },
  });
}

export async function getUserCurrencyAction(
  userId: string,
  key: string,
): Promise<CurrencyValueResult> {
  const row = await ensureUserCurrency(userId.trim(), key.trim());
  if (!row) {
    return { status: 404, code: "NOT_FOUND", error: "Currency not found." };
  }
  return { status: 200, code: "SUCCESS", data: toUserCurrencyDto(row) };
}

export async function getAllUserCurrenciesAction(
  userId: string,
): Promise<{ status: 200; code: "SUCCESS"; data: UserCurrencyDto[] } | { status: 404; code: "NOT_FOUND"; error: string }> {
  const targetUser = await prisma.user.findUnique({
    where: { id: userId.trim() },
    select: { id: true },
  });
  if (!targetUser) {
    return { status: 404, code: "NOT_FOUND", error: "User not found." };
  }

  await initializeDefaultCurrenciesForUser(userId.trim());

  const rows = await prisma.userCurrency.findMany({
    where: { userId: userId.trim() },
    orderBy: { createdAt: "desc" },
    include: {
      currency: {
        select: { key: true, name: true },
      },
    },
  });

  return { status: 200, code: "SUCCESS", data: rows.map(toUserCurrencyDto) };
}

export async function addCurrencyValue(
  userId: string,
  currencyId: string,
  value: number,
): Promise<CurrencyValueResult> {
  if (value < 0) {
    return {
      status: 409,
      code: "CURRENCY_NOT_ENOUGH",
      error: "Value must be positive.",
    };
  }

  const currency = await prisma.currency.findUnique({
    where: { id: currencyId },
    select: { id: true, key: true, name: true },
  });
  if (!currency) {
    return { status: 404, code: "NOT_FOUND", error: "Currency not found." };
  }

  const row = await prisma.userCurrency.upsert({
    where: { userId_currencyId: { userId, currencyId } },
    update: { value: { increment: value } },
    create: { userId, currencyId, value },
    include: {
      currency: {
        select: { key: true, name: true },
      },
    },
  });

  await sendSystemUserEvent({
    eventType: "Currency:Add",
    userId,
    payload: { value },
    entityType: "Currency",
    entityId: currencyId,
  });

  return { status: 200, code: "SUCCESS", data: toUserCurrencyDto(row) };
}

export async function useCurrencyValue(
  userId: string,
  currencyId: string,
  value: number,
): Promise<CurrencyValueResult> {
  if (value < 0) {
    return {
      status: 409,
      code: "CURRENCY_NOT_ENOUGH",
      error: "Value must be positive.",
    };
  }

  const row = await prisma.userCurrency.findUnique({
    where: { userId_currencyId: { userId, currencyId } },
    include: {
      currency: {
        select: { key: true, name: true, defaultValue: true },
      },
    },
  });

  let balance = row;
  if (!balance) {
    const currency = await prisma.currency.findUnique({
      where: { id: currencyId },
      select: { id: true, key: true, name: true, defaultValue: true },
    });
    if (!currency) {
      return { status: 404, code: "NOT_FOUND", error: "Currency not found." };
    }
    balance = await prisma.userCurrency.create({
      data: {
        userId,
        currencyId,
        value: currency.defaultValue,
      },
      include: {
        currency: {
          select: { key: true, name: true, defaultValue: true },
        },
      },
    });
  }

  if (balance.value < value) {
    return {
      status: 409,
      code: "CURRENCY_NOT_ENOUGH",
      error: "Currency is not enough.",
    };
  }

  const updated = await prisma.userCurrency.update({
    where: { userId_currencyId: { userId, currencyId } },
    data: { value: { decrement: value } },
    include: {
      currency: {
        select: { key: true, name: true },
      },
    },
  });

  await sendSystemUserEvent({
    eventType: "Currency:Use",
    userId,
    payload: { value },
    entityType: "Currency",
    entityId: currencyId,
  });

  return { status: 200, code: "SUCCESS", data: toUserCurrencyDto(updated) };
}
