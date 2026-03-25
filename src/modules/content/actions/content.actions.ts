"use server";

import { revalidatePath } from "next/cache";
import * as yup from "yup";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  deleteContentMediaFile,
  saveContentMediaFile,
} from "@/lib/content-media";

import { contentSchema } from "@/modules/content/interfaces/content.schema";

export type ContentActionResult = {
  ok: boolean;
  error?: string;
};

function fileFromFormData(formData: FormData): File | null {
  const v = formData.get("file");
  if (v instanceof File && v.size > 0) return v;
  return null;
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  return String(value ?? "") === "true";
}

function parseMetadata(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("Metadata must be valid JSON.");
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
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid metadata.",
    };
  }

  let parsed: yup.InferType<typeof contentSchema>;
  try {
    parsed = await contentSchema.validate(
      {
        name,
        text: text || null,
        access,
        type: typeFromForm || (file ? "FILE" : "TEXT"),
        isEarnable,
        metadata,
      },
      { abortEarly: false, stripUnknown: true },
    );
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      return { ok: false, error: e.errors[0] ?? "Invalid input." };
    }
    return { ok: false, error: "Invalid input." };
  }

  let contentUrl: string | null = null;
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
      text: parsed.text ?? null,
      ownerId: current.user.id,
      access: parsed.access,
      // metadata: parsed.metadata ?? null,
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
  const removeFile = String(formData.get("removeFile") ?? "") === "true";
  const file = fileFromFormData(formData);

  if (!id) {
    return { ok: false, error: "Missing content id." };
  }

  let metadata: Record<string, unknown> | null = null;
  try {
    metadata = parseMetadata(formData.get("metadata"));
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Invalid metadata.",
    };
  }

  let parsed: yup.InferType<typeof contentSchema>;
  try {
    parsed = await contentSchema.validate(
      {
        name,
        text: text || null,
        access,
        type: typeFromForm || (file ? "FILE" : "TEXT"),
        isEarnable,
        metadata,
      },
      { abortEarly: false, stripUnknown: true },
    );
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      return { ok: false, error: e.errors[0] ?? "Invalid input." };
    }
    return { ok: false, error: "Invalid input." };
  }

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
  }

  await prisma.content.update({
    where: { id: row.id },
    data: {
      name: parsed.name,
      text: parsed.text ?? null,
      access: parsed.access,
      // metadata: parsed.metadata ?? null,
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

  const whereClause = true ? { id } : { id, ownerId: current.user.id };
  // current.user.role === "ADMIN"

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
