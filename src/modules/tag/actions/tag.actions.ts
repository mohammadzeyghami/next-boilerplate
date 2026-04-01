"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import type { UserRole } from "@/generated/prisma/enums";

export type TagActionResult = {
  ok: boolean;
  error?: string;
};

export type TagDto = {
  id: string;
  name: string;
  description: string | null;
  label: string | null;
  metadata: Record<string, unknown> | null;
  contentIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type TagContentOption = {
  id: string;
  name: string;
};

export type PaginatedTags = {
  items: TagDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const tagCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2,000 characters."),
  label: z.string().trim().max(200, "Label must be at most 200 characters."),
  metadataJson: z
    .string()
    .trim()
    .max(20_000, "Metadata JSON is too large."),
  contentIds: z.array(z.string().min(1)),
});

const tagUpdateSchema = tagCreateSchema.extend({
  id: z.string().trim().min(1, "Missing tag id."),
});

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
    select: {
      id: true,
      role: true,
    },
  });

  if (!dbUser) {
    return { error: "User not found." };
  }

  return { user: dbUser };
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

function toDto(row: {
  id: string;
  name: string;
  description: string | null;
  label: string | null;
  metadata: unknown;
  contentIds: string[];
  createdAt: Date;
  updatedAt: Date;
}): TagDto {
  const meta =
    row.metadata &&
    typeof row.metadata === "object" &&
    !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    label: row.label,
    metadata: meta,
    contentIds: row.contentIds,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseContentIdsJson(raw: FormDataEntryValue | null): string[] {
  const s = String(raw ?? "").trim();
  if (!s) return [];
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
  } catch {
    return [];
  }
}

export async function listTagsAction(): Promise<
  { ok: true; data: TagDto[] } | { ok: false; error: string }
> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  const rows = await prisma.contentTag.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { ok: true, data: rows.map(toDto) };
}

export async function listTagsPageAction(input?: {
  page?: number;
  pageSize?: number;
}): Promise<{ ok: true; data: PaginatedTags } | { ok: false; error: string }> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const [rows, totalCount] = await prisma.$transaction([
    prisma.contentTag.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.contentTag.count(),
  ]);

  return {
    ok: true,
    data: {
      items: rows.map(toDto),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

export async function listTagContentOptionsAction(): Promise<
  | { ok: true; data: TagContentOption[] }
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

export async function createTagAction(
  formData: FormData,
): Promise<TagActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to create tags." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();
  const contentIds = parseContentIdsJson(formData.get("contentIds"));

  const parsed = tagCreateSchema.safeParse({
    name,
    description,
    label,
    metadataJson,
    contentIds,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(parsed.data.metadataJson);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid metadata.",
    };
  }

  const { name: n, description: descRaw, label: labelRaw, contentIds: ids } =
    parsed.data;
  const d = descRaw.trim();
  const l = labelRaw.trim();

  if (ids.length > 0) {
    const count = await prisma.content.count({
      where: { id: { in: ids } },
    });
    if (count !== ids.length) {
      return {
        ok: false,
        error: "One or more selected contents do not exist.",
      };
    }
  }

  await prisma.contentTag.create({
    data: {
      name: n,
      description: d ? d : null,
      label: l ? l : null,
      ...(metadata !== null
        ? { metadata: metadata as Prisma.InputJsonValue }
        : {}),
      contentIds: ids,
    },
  });

  revalidatePath("/dashboard/tags");
  return { ok: true };
}

export async function updateTagAction(
  formData: FormData,
): Promise<TagActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to update tags." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();
  const contentIds = parseContentIdsJson(formData.get("contentIds"));

  const parsed = tagUpdateSchema.safeParse({
    id,
    name,
    description,
    label,
    metadataJson,
    contentIds,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  let metadata: Record<string, unknown> | null;
  try {
    metadata = parseMetadataJson(parsed.data.metadataJson);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid metadata.",
    };
  }

  const {
    id: tagId,
    name: n,
    description: descRaw,
    label: labelRaw,
    contentIds: ids,
  } = parsed.data;
  const d = descRaw.trim();
  const l = labelRaw.trim();

  if (ids.length > 0) {
    const count = await prisma.content.count({
      where: { id: { in: ids } },
    });
    if (count !== ids.length) {
      return {
        ok: false,
        error: "One or more selected contents do not exist.",
      };
    }
  }

  try {
    await prisma.contentTag.update({
      where: { id: tagId },
      data: {
        name: n,
        description: d ? d : null,
        label: l ? l : null,
        ...(metadata !== null
          ? { metadata: metadata as Prisma.InputJsonValue }
          : { metadata: Prisma.DbNull }),
        contentIds: ids,
      },
    });
  } catch {
    return { ok: false, error: "Tag not found." };
  }

  revalidatePath("/dashboard/tags");
  return { ok: true };
}

export async function deleteTagAction(id: string): Promise<TagActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to delete tags." };
  }

  const trimmed = id?.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing tag id." };
  }

  try {
    await prisma.contentTag.delete({
      where: { id: trimmed },
    });
  } catch {
    return { ok: false, error: "Tag not found." };
  }

  revalidatePath("/dashboard/tags");
  return { ok: true };
}
