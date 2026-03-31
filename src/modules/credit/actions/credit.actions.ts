"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import type { ContentType, UserRole } from "@/generated/prisma/enums";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import { sendSystemUserEvent } from "@/modules/user-event/actions/user-event.actions";

import {
  creditFormSchema,
  creditLifeTimeFormSchema,
} from "../interfaces/credit.schema";

export type CreditActionResult = {
  ok: boolean;
  error?: string;
};

export type CreditUseResult =
  | { status: 200; code: "SUCCESS"; data: { value: number } }
  | { status: 409; code: "CREDITS_NOT_ENOUGH"; error: string }
  | { status: 404; code: "NOT_FOUND"; error: string };

export type CreditDto = {
  id: string;
  name: string;
  metadata: Record<string, unknown> | null;
  contentTypes: ContentType[];
  createdAt: string;
  updatedAt: string;
};

export type CreditLifeTimeDto = {
  id: string;
  creditsId: string;
  creditName: string;
  name: string;
  metadata: Record<string, unknown> | null;
  lifeTime: number;
  createdAt: string;
  updatedAt: string;
};

type DbUserBrief = { id: string; role: UserRole };

async function getCurrentDbUser(): Promise<
  { error: string } | { user: DbUserBrief }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });

  if (!dbUser) {
    return { error: "User not found." };
  }

  return { user: dbUser };
}

async function requireElevatedActor() {
  const current = await getCurrentDbUser();
  if ("error" in current) return current;
  if (!isElevatedRole(current.user.role)) {
    return { error: "You are not allowed to manage credits." };
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

function parseContentTypesJson(raw: FormDataEntryValue | null): string[] {
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

function toCreditDto(row: {
  id: string;
  name: string;
  metadata: unknown;
  contentTypes: ContentType[];
  createdAt: Date;
  updatedAt: Date;
}): CreditDto {
  return {
    id: row.id,
    name: row.name,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    contentTypes: row.contentTypes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toCreditLifeTimeDto(row: {
  id: string;
  creditsId: string;
  name: string;
  metadata: unknown;
  lifeTime: number;
  createdAt: Date;
  updatedAt: Date;
  credit: { name: string };
}): CreditLifeTimeDto {
  return {
    id: row.id,
    creditsId: row.creditsId,
    creditName: row.credit.name,
    name: row.name,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : null,
    lifeTime: row.lifeTime,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listCreditsAction(): Promise<
  { ok: true; data: CreditDto[] } | { ok: false; error: string }
> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const rows = await prisma.credit.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { ok: true, data: rows.map(toCreditDto) };
}

export async function listCreditLifeTimesAction(): Promise<
  { ok: true; data: CreditLifeTimeDto[] } | { ok: false; error: string }
> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const rows = await prisma.creditLifeTime.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      credit: { select: { name: true } },
    },
  });

  return { ok: true, data: rows.map(toCreditLifeTimeDto) };
}

export async function createCreditAction(
  formData: FormData,
): Promise<CreditActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = creditFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    metadataJson: String(formData.get("metadataJson") ?? "").trim(),
    contentTypes: parseContentTypesJson(formData.get("contentTypes")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(parsed.data.metadataJson);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata." };
  }

  await prisma.credit.create({
    data: {
      name: parsed.data.name,
      contentTypes: parsed.data.contentTypes,
      ...(metadata !== null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });

  revalidatePath("/dashboard/credits");
  return { ok: true };
}

export async function updateCreditAction(
  formData: FormData,
): Promise<CreditActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing credit id." };

  const parsed = creditFormSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    metadataJson: String(formData.get("metadataJson") ?? "").trim(),
    contentTypes: parseContentTypesJson(formData.get("contentTypes")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(parsed.data.metadataJson);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata." };
  }

  try {
    await prisma.credit.update({
      where: { id },
      data: {
        name: parsed.data.name,
        contentTypes: parsed.data.contentTypes,
        ...(metadata !== null
          ? { metadata: metadata as Prisma.InputJsonValue }
          : { metadata: Prisma.DbNull }),
      },
    });
  } catch {
    return { ok: false, error: "Credit not found." };
  }

  revalidatePath("/dashboard/credits");
  return { ok: true };
}

export async function deleteCreditAction(id: string): Promise<CreditActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  if (!id.trim()) return { ok: false, error: "Missing credit id." };

  try {
    await prisma.credit.delete({ where: { id: id.trim() } });
  } catch {
    return { ok: false, error: "Credit not found." };
  }

  revalidatePath("/dashboard/credits");
  return { ok: true };
}

export async function createCreditLifeTimeAction(
  formData: FormData,
): Promise<CreditActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const parsed = creditLifeTimeFormSchema.safeParse({
    creditsId: String(formData.get("creditsId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    metadataJson: String(formData.get("metadataJson") ?? "").trim(),
    lifeTime: String(formData.get("lifeTime") ?? "").trim(),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(parsed.data.metadataJson);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata." };
  }

  const credit = await prisma.credit.findUnique({
    where: { id: parsed.data.creditsId },
    select: { id: true },
  });
  if (!credit) return { ok: false, error: "Credit not found." };

  await prisma.creditLifeTime.create({
    data: {
      creditsId: parsed.data.creditsId,
      name: parsed.data.name,
      lifeTime: parsed.data.lifeTime,
      ...(metadata !== null ? { metadata: metadata as Prisma.InputJsonValue } : {}),
    },
  });

  revalidatePath("/dashboard/credits");
  return { ok: true };
}

export async function updateCreditLifeTimeAction(
  formData: FormData,
): Promise<CreditActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, error: "Missing credit lifetime id." };

  const parsed = creditLifeTimeFormSchema.safeParse({
    creditsId: String(formData.get("creditsId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    metadataJson: String(formData.get("metadataJson") ?? "").trim(),
    lifeTime: String(formData.get("lifeTime") ?? "").trim(),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(parsed.data.metadataJson);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Invalid metadata." };
  }

  try {
    await prisma.creditLifeTime.update({
      where: { id },
      data: {
        creditsId: parsed.data.creditsId,
        name: parsed.data.name,
        lifeTime: parsed.data.lifeTime,
        ...(metadata !== null
          ? { metadata: metadata as Prisma.InputJsonValue }
          : { metadata: Prisma.DbNull }),
      },
    });
  } catch {
    return { ok: false, error: "Credit lifetime not found." };
  }

  revalidatePath("/dashboard/credits");
  return { ok: true };
}

export async function deleteCreditLifeTimeAction(
  id: string,
): Promise<CreditActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) return { ok: false, error: gate.error };
  if (!id.trim()) return { ok: false, error: "Missing credit lifetime id." };

  try {
    await prisma.creditLifeTime.delete({ where: { id: id.trim() } });
  } catch {
    return { ok: false, error: "Credit lifetime not found." };
  }

  revalidatePath("/dashboard/credits");
  return { ok: true };
}

async function normalizeTimedCreditQueue(
  tx: Prisma.TransactionClient,
  userId: string,
  creditsId: string,
) {
  const now = new Date();

  const rows = await tx.userCreditTimed.findMany({
    where: { userId, creditsId },
    orderBy: { createdAt: "asc" },
  });

  for (const row of rows) {
    const isExpired =
      row.startedAt !== null &&
      row.startedAt.getTime() + row.lifeTime * 60 * 60 * 1000 <= now.getTime();

    if (row.value <= 0 || isExpired) {
      await tx.userCreditTimed.delete({ where: { id: row.id } });
    }
  }

  let remainingRows = await tx.userCreditTimed.findMany({
    where: { userId, creditsId },
    orderBy: { createdAt: "asc" },
  });

  const active = remainingRows.find((row) => row.startedAt !== null);
  if (!active && remainingRows[0]) {
    await tx.userCreditTimed.update({
      where: { id: remainingRows[0].id },
      data: { startedAt: now },
    });
    remainingRows = await tx.userCreditTimed.findMany({
      where: { userId, creditsId },
      orderBy: { createdAt: "asc" },
    });
  }

  return remainingRows;
}

export async function giveTimedUserCredits(
  userId: string,
  creditsId: string,
  value: number,
  lifeTime: number,
) {
  if (value <= 0 || lifeTime <= 0) {
    throw new Error("Value and lifeTime must be greater than zero.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!targetUser) throw new Error("User not found.");

  const credit = await prisma.credit.findUnique({
    where: { id: creditsId },
    select: { id: true },
  });
  if (!credit) throw new Error("Credit not found.");

  await prisma.$transaction(async (tx) => {
    const queue = await normalizeTimedCreditQueue(tx, userId, creditsId);
    await tx.userCreditTimed.create({
      data: {
        userId,
        creditsId,
        total: value,
        value,
        lifeTime,
        startedAt: queue.length === 0 ? new Date() : null,
      },
    });
  });

  await sendSystemUserEvent({
    eventType: "UserCreditsTimed:Give",
    userId,
    payload: { value, lifeTime },
    entityType: "Credits",
    entityId: creditsId,
  });
}

export async function addCredits(userId: string, creditsId: string, value: number) {
  return addUserCredits(userId, creditsId, value);
}

export async function giveTimedCredits(
  userId: string,
  creditsId: string,
  value: number,
  lifeTime: number,
) {
  return giveTimedUserCredits(userId, creditsId, value, lifeTime);
}

export async function useTimedCredits(
  userId: string,
  creditsId: string,
  value: number,
) {
  return consumeTimedUserCredits(userId, creditsId, value);
}

export async function consumeTimedUserCredits(
  userId: string,
  creditsId: string,
  value: number,
): Promise<number> {
  if (value <= 0) return 0;

  return prisma.$transaction(async (tx) => {
    let remaining = value;

    while (remaining > 0) {
      const queue = await normalizeTimedCreditQueue(tx, userId, creditsId);
      const active = queue.find((row) => row.startedAt !== null);

      if (!active) {
        break;
      }

      if (active.value > remaining) {
        await tx.userCreditTimed.update({
          where: { id: active.id },
          data: { value: active.value - remaining },
        });
        remaining = 0;
        break;
      }

      remaining -= active.value;
      await tx.userCreditTimed.delete({ where: { id: active.id } });
    }

    return remaining;
  });
}

export async function totalTimedCreditsValue(
  userId: string,
  creditsId: string,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const rows = await normalizeTimedCreditQueue(tx, userId, creditsId);
    return rows.reduce((sum, row) => sum + row.value, 0);
  });
}

export async function addUserCredits(
  userId: string,
  creditsId: string,
  value: number,
) {
  if (value <= 0) {
    throw new Error("Value must be greater than zero.");
  }

  const [targetUser, credit] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.credit.findUnique({ where: { id: creditsId }, select: { id: true } }),
  ]);

  if (!targetUser) throw new Error("User not found.");
  if (!credit) throw new Error("Credit not found.");

  await prisma.userCredit.upsert({
    where: { creditsId_userId: { creditsId, userId } },
    update: { value: { increment: value } },
    create: { creditsId, userId, value },
  });

  await sendSystemUserEvent({
    eventType: "UserCredits:Add",
    userId,
    payload: { value },
    entityType: "Credits",
    entityId: creditsId,
  });
}

export async function totalCreditsValue(
  userId: string,
  creditsId: string,
): Promise<{ status: 200; code: "SUCCESS"; data: { value: number } } | { status: 404; code: "NOT_FOUND"; error: string }> {
  const [credit, freeCredits, timedValue] = await Promise.all([
    prisma.credit.findUnique({ where: { id: creditsId }, select: { id: true } }),
    prisma.userCredit.findUnique({
      where: { creditsId_userId: { creditsId, userId } },
      select: { value: true },
    }),
    totalTimedCreditsValue(userId, creditsId),
  ]);

  if (!credit) {
    return { status: 404, code: "NOT_FOUND", error: "Credit not found." };
  }

  return {
    status: 200,
    code: "SUCCESS",
    data: { value: (freeCredits?.value ?? 0) + timedValue },
  };
}

export async function consumeCredits(
  userId: string,
  creditsId: string,
  value: number,
): Promise<CreditUseResult> {
  if (value <= 0) {
    return { status: 200, code: "SUCCESS", data: { value: 0 } };
  }

  const total = await totalCreditsValue(userId, creditsId);
  if (total.status !== 200) {
    return total;
  }
  if (total.data.value < value) {
    return {
      status: 409,
      code: "CREDITS_NOT_ENOUGH",
      error: "Credits are not enough.",
    };
  }

  const remainingAfterTimed = await consumeTimedUserCredits(
    userId,
    creditsId,
    value,
  );
  if (remainingAfterTimed > 0) {
    await prisma.userCredit.upsert({
      where: { creditsId_userId: { creditsId, userId } },
      update: { value: { decrement: remainingAfterTimed } },
      create: { creditsId, userId, value: 0 },
    });
  }

  const nextTotal = await totalCreditsValue(userId, creditsId);
  if (nextTotal.status !== 200) {
    return nextTotal;
  }

  return nextTotal;
}
