"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import type { UserRole } from "@/generated/prisma/enums";

export type CategoryActionResult = {
  ok: boolean;
  error?: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  description: string | null;
  label: string | null;
  metadata: Record<string, unknown> | null;
  contentIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryContentOption = {
  id: string;
  name: string;
};

const categoryCreateSchema = z.object({
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

const categoryUpdateSchema = categoryCreateSchema.extend({
  id: z.string().trim().min(1, "Missing category id."),
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
}): CategoryDto {
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

/** Maps Prisma failures to a safe message; avoids throwing from server actions (HTTP 500). */
function prismaFailureMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return "Category table is missing. Run `npx prisma migrate dev` (or `prisma db push`), then restart the dev server.";
    }
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return "Database is unavailable. Check DATABASE_URL and that Postgres is running.";
  }
  return "Something went wrong while accessing the database.";
}

export async function listCategoriesAction(): Promise<
  { ok: true; data: CategoryDto[] } | { ok: false; error: string }
> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  try {
    const rows = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { ok: true, data: rows.map(toDto) };
  } catch (e) {
    console.error("listCategoriesAction:", e);
    return { ok: false, error: prismaFailureMessage(e) };
  }
}

export async function listCategoryContentOptionsAction(): Promise<
  | { ok: true; data: CategoryContentOption[] }
  | { ok: false; error: string }
> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  const where = isElevatedRole(current.user.role)
    ? {}
    : { ownerId: current.user.id };

  try {
    const rows = await prisma.content.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    });
    return { ok: true, data: rows };
  } catch (e) {
    console.error("listCategoryContentOptionsAction:", e);
    return { ok: false, error: prismaFailureMessage(e) };
  }
}

export async function createCategoryAction(
  formData: FormData,
): Promise<CategoryActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to create categories." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();
  const contentIds = parseContentIdsJson(formData.get("contentIds"));

  const parsed = categoryCreateSchema.safeParse({
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

  try {
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

    await prisma.category.create({
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
  } catch (e) {
    console.error("createCategoryAction:", e);
    return { ok: false, error: prismaFailureMessage(e) };
  }

  revalidatePath("/dashboard/categories");
  return { ok: true };
}

export async function updateCategoryAction(
  formData: FormData,
): Promise<CategoryActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to update categories." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const metadataJson = String(formData.get("metadataJson") ?? "").trim();
  const contentIds = parseContentIdsJson(formData.get("contentIds"));

  const parsed = categoryUpdateSchema.safeParse({
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
    id: categoryId,
    name: n,
    description: descRaw,
    label: labelRaw,
    contentIds: ids,
  } = parsed.data;
  const d = descRaw.trim();
  const l = labelRaw.trim();

  try {
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

    await prisma.category.update({
      where: { id: categoryId },
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
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return { ok: false, error: "Category not found." };
    }
    console.error("updateCategoryAction:", e);
    return { ok: false, error: prismaFailureMessage(e) };
  }

  revalidatePath("/dashboard/categories");
  return { ok: true };
}

export async function deleteCategoryAction(
  id: string,
): Promise<CategoryActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!isElevatedRole(current.user.role)) {
    return { ok: false, error: "You are not allowed to delete categories." };
  }

  const trimmed = id?.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing category id." };
  }

  try {
    await prisma.category.delete({
      where: { id: trimmed },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2025"
    ) {
      return { ok: false, error: "Category not found." };
    }
    console.error("deleteCategoryAction:", e);
    return { ok: false, error: prismaFailureMessage(e) };
  }

  revalidatePath("/dashboard/categories");
  return { ok: true };
}
