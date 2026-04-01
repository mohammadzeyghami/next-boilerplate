"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import type { UserRole } from "@/generated/prisma/enums";

export type LanguageActionResult = {
  ok: boolean;
  error?: string;
};

export type LanguageDto = {
  id: string;
  name: string;
  description: string | null;
  contentIds: string[];
  categoryIds: string[];
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type LanguageContentOption = {
  id: string;
  name: string;
};

export type PaginatedLanguages = {
  items: LanguageDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const languageCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2,000 characters."),
  contentIds: z.array(z.string().min(1)),
  categoryIds: z.array(z.string().min(1)),
  tagIds: z.array(z.string().min(1)),
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

function toDto(row: {
  id: string;
  name: string;
  description: string | null;
  contentIds: string[];
  categoryIds: string[];
  tagIds: string[];
  createdAt: Date;
  updatedAt: Date;
}): LanguageDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contentIds: row.contentIds,
    categoryIds: row.categoryIds,
    tagIds: row.tagIds,
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

function parseCategoryIdsJson(raw: FormDataEntryValue | null): string[] {
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

function parseTagIdsJson(raw: FormDataEntryValue | null): string[] {
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

export async function listLanguagesAction(input?: {
  page?: number;
  pageSize?: number;
}): Promise<
  { ok: true; data: PaginatedLanguages } | { ok: false; error: string }
> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const [rows, totalCount] = await prisma.$transaction([
    prisma.language.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.language.count(),
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

export async function listLanguageContentOptionsAction(): Promise<
  | { ok: true; data: LanguageContentOption[] }
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

export async function createLanguageAction(
  formData: FormData,
): Promise<LanguageActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to create languages." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contentIds = parseContentIdsJson(formData.get("contentIds"));
  const categoryIds = parseCategoryIdsJson(formData.get("categoryIds"));
  const tagIds = parseTagIdsJson(formData.get("tagIds"));

  const parsed = languageCreateSchema.safeParse({
    name,
    description,
    contentIds,
    categoryIds,
    tagIds,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const {
    name: n,
    description: descRaw,
    contentIds: ids,
    categoryIds: selectedCategoryIds,
    tagIds: selectedTagIds,
  } = parsed.data;
  const d = descRaw.trim();

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

  if (selectedCategoryIds.length > 0) {
    const count = await prisma.category.count({
      where: { id: { in: selectedCategoryIds } },
    });
    if (count !== selectedCategoryIds.length) {
      return {
        ok: false,
        error: "One or more selected categories do not exist.",
      };
    }
  }

  if (selectedTagIds.length > 0) {
    const count = await prisma.contentTag.count({
      where: { id: { in: selectedTagIds } },
    });
    if (count !== selectedTagIds.length) {
      return {
        ok: false,
        error: "One or more selected tags do not exist.",
      };
    }
  }

  await prisma.language.create({
    data: {
      name: n,
      description: d ? d : null,
      contentIds: ids,
      categoryIds: selectedCategoryIds,
      tagIds: selectedTagIds,
    },
  });

  revalidatePath("/dashboard/languages");
  return { ok: true };
}

export async function updateLanguageAction(
  formData: FormData,
): Promise<LanguageActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to update languages." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contentIds = parseContentIdsJson(formData.get("contentIds"));
  const categoryIds = parseCategoryIdsJson(formData.get("categoryIds"));
  const tagIds = parseTagIdsJson(formData.get("tagIds"));

  if (!id) {
    return { ok: false, error: "Missing language id." };
  }

  const parsed = languageCreateSchema.safeParse({
    name,
    description,
    contentIds,
    categoryIds,
    tagIds,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const {
    name: n,
    description: descRaw,
    contentIds: ids,
    categoryIds: selectedCategoryIds,
    tagIds: selectedTagIds,
  } = parsed.data;
  const d = descRaw.trim();

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

  if (selectedCategoryIds.length > 0) {
    const count = await prisma.category.count({
      where: { id: { in: selectedCategoryIds } },
    });
    if (count !== selectedCategoryIds.length) {
      return {
        ok: false,
        error: "One or more selected categories do not exist.",
      };
    }
  }

  if (selectedTagIds.length > 0) {
    const count = await prisma.contentTag.count({
      where: { id: { in: selectedTagIds } },
    });
    if (count !== selectedTagIds.length) {
      return {
        ok: false,
        error: "One or more selected tags do not exist.",
      };
    }
  }

  try {
    await prisma.language.update({
      where: { id },
      data: {
        name: n,
        description: d ? d : null,
        contentIds: ids,
        categoryIds: selectedCategoryIds,
        tagIds: selectedTagIds,
      },
    });
  } catch {
    return { ok: false, error: "Language not found." };
  }

  revalidatePath("/dashboard/languages");
  return { ok: true };
}

export async function deleteLanguageAction(
  id: string,
): Promise<LanguageActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to delete languages." };
  }

  const trimmed = id?.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing language id." };
  }

  try {
    await prisma.language.delete({
      where: { id: trimmed },
    });
  } catch {
    return { ok: false, error: "Language not found." };
  }

  revalidatePath("/dashboard/languages");
  return { ok: true };
}
