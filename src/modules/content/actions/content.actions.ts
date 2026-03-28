"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteContentMediaFile,
  saveContentMediaFile,
} from "@/lib/content-media";

export type ContentActionResult = {
  ok: boolean;
  error?: string;
};

const contentAccessValues = ["PRIVATE", "PUBLIC"] as const;
const contentTypeValues = ["TEXT", "IMAGE", "VIDEO", "SOUND", "FILE"] as const;

const contentActionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be at most 200 characters."),
  text: z
    .string()
    .trim()
    .max(20_000, "Text must be at most 20,000 characters.")
    .nullable(),
  access: z.enum(contentAccessValues),
  type: z.enum(contentTypeValues),
  isEarnable: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
});

type ContentActionValues = z.infer<typeof contentActionSchema>;

function fileFromFormData(formData: FormData): File | null {
  const value = formData.get("file");
  if (value instanceof File && value.size > 0) return value;
  return null;
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  return String(value ?? "").toLowerCase() === "true";
}

function parseMetadata(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error();
    }

    return parsed as Record<string, unknown>;
  } catch {
    throw new Error("Metadata must be valid JSON object.");
  }
}

async function getCurrentDbUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "You must be signed in." as const };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
    },
  });

  if (!dbUser) {
    return { error: "User not found." as const };
  }

  return { user: dbUser };
}

function buildParsedInput(params: {
  name: string;
  text: string;
  access: string;
  typeFromForm: string;
  isEarnable: boolean;
  metadata: Record<string, unknown> | null;
  hasFile: boolean;
}) {
  return contentActionSchema.safeParse({
    name: params.name,
    text: params.text || null,
    access: params.access,
    type: params.typeFromForm || (params.hasFile ? "FILE" : "TEXT"),
    isEarnable: params.isEarnable,
    metadata: params.metadata,
  });
}

export async function createContentAction(
  formData: FormData,
): Promise<ContentActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  const name = String(formData.get("name") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const access = String(formData.get("access") ?? "PRIVATE")
    .trim()
    .toUpperCase();
  const typeFromForm = String(formData.get("type") ?? "")
    .trim()
    .toUpperCase();
  const isEarnable = parseBoolean(formData.get("isEarnable"));
  const file = fileFromFormData(formData);

  let metadata: Record<string, unknown> | null = null;
  try {
    metadata = parseMetadata(formData.get("metadata"));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid metadata.",
    };
  }

  const parsedResult = buildParsedInput({
    name,
    text,
    access,
    typeFromForm,
    isEarnable,
    metadata,
    hasFile: !!file,
  });

  if (!parsedResult.success) {
    return {
      ok: false,
      error: parsedResult.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const contentUrlFromForm = String(formData.get("contentUrl") ?? "").trim();
  const parsed: ContentActionValues = parsedResult.data;
  let contentUrl: string | null = contentUrlFromForm || null;
  let finalType = parsed.type;

  if (file) {
    const saved = await saveContentMediaFile(file, current.user.id);

    if ("error" in saved) {
      return { ok: false, error: saved.error };
    }

    contentUrl = saved.mediaUrl;

    const mediaKindToTypeMap: Record<string, typeof finalType> = {
      image: "IMAGE",
      video: "VIDEO",
      sound: "SOUND",
      file: "FILE",
    };

    finalType = mediaKindToTypeMap[saved.mediaKind] ?? "FILE";
  }

  await prisma.content.create({
    data: {
      name: parsed.name,
      text: parsed.text,
      ownerId: current.user.id,
      access: parsed.access,
      // @ts-ignore
      metadata: parsed.metadata,
      contentUrl,
      type: finalType,
      isEarnable: parsed.isEarnable,
    },
  });

  revalidatePath("/dashboard/content");
  revalidatePath("/");

  return { ok: true };
}

export async function updateContentAction(
  formData: FormData,
): Promise<ContentActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const text = String(formData.get("text") ?? "").trim();
  const access = String(formData.get("access") ?? "PRIVATE")
    .trim()
    .toUpperCase();
  const typeFromForm = String(formData.get("type") ?? "")
    .trim()
    .toUpperCase();
  const isEarnable = parseBoolean(formData.get("isEarnable"));
  const removeFile =
    String(formData.get("removeFile") ?? "").toLowerCase() === "true";
  const file = fileFromFormData(formData);

  if (!id) {
    return { ok: false, error: "Missing content id." };
  }

  let metadata: Record<string, unknown> | null = null;
  try {
    metadata = parseMetadata(formData.get("metadata"));
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid metadata.",
    };
  }

  const parsedResult = buildParsedInput({
    name,
    text,
    access,
    typeFromForm,
    isEarnable,
    metadata,
    hasFile: !!file,
  });

  if (!parsedResult.success) {
    return {
      ok: false,
      error: parsedResult.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const parsed: ContentActionValues = parsedResult.data;

  const whereClause =
    current.user.role === "ADMIN" ? { id } : { id, ownerId: current.user.id };

  const row = await prisma.content.findFirst({
    where: whereClause,
    select: {
      id: true,
      ownerId: true,
      contentUrl: true,
      type: true,
    },
  });

  if (!row) {
    return { ok: false, error: "Content not found or not allowed." };
  }

  let contentUrl: string | null = row.contentUrl;
  let finalType = parsed.type;

  if (file) {
    const saved = await saveContentMediaFile(file, row.ownerId);

    if ("error" in saved) {
      return { ok: false, error: saved.error };
    }

    await deleteContentMediaFile(row.contentUrl);

    contentUrl = saved.mediaUrl;

    const mediaKindToTypeMap: Record<string, typeof finalType> = {
      image: "IMAGE",
      video: "VIDEO",
      sound: "SOUND",
      file: "FILE",
    };

    finalType = mediaKindToTypeMap[saved.mediaKind] ?? "FILE";
  } else if (removeFile) {
    await deleteContentMediaFile(row.contentUrl);
    contentUrl = null;

    if (parsed.type !== "TEXT") {
      finalType = "TEXT";
    }
  }

  await prisma.content.update({
    where: { id: row.id },
    data: {
      name: parsed.name,
      text: parsed.text,
      access: parsed.access,
      // @ts-ignore
      metadata: parsed.metadata,
      contentUrl,
      type: finalType,
      isEarnable: parsed.isEarnable,
    },
  });

  revalidatePath("/dashboard/content");
  revalidatePath("/");

  return { ok: true };
}

export async function deleteContentAction(
  id: string,
): Promise<ContentActionResult> {
  const current = await getCurrentDbUser();
  if ("error" in current) {
    return { ok: false, error: current.error };
  }

  if (!id?.trim()) {
    return { ok: false, error: "Missing content id." };
  }

  const whereClause =
    current.user.role === "ADMIN" ? { id } : { id, ownerId: current.user.id };

  const row = await prisma.content.findFirst({
    where: whereClause,
    select: {
      id: true,
      contentUrl: true,
    },
  });

  if (!row) {
    return { ok: false, error: "Content not found or not allowed." };
  }

  await deleteContentMediaFile(row.contentUrl);

  await prisma.content.delete({
    where: { id: row.id },
  });

  revalidatePath("/dashboard/content");
  revalidatePath("/");

  return { ok: true };
}
