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

export async function createContentAction(
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const file = fileFromFormData(formData);

  let parsed: yup.InferType<typeof contentSchema>;
  try {
    parsed = await contentSchema.validate(
      { title, body },
      { abortEarly: false, stripUnknown: true },
    );
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      return { ok: false, error: e.errors[0] ?? "Invalid input." };
    }
    return { ok: false, error: "Invalid input." };
  }

  let mediaUrl: string | null = null;
  let mediaKind: string | null = null;

  if (file) {
    const saved = await saveContentMediaFile(file, session.user.id);
    if ("error" in saved) {
      return { ok: false, error: saved.error };
    }
    mediaUrl = saved.mediaUrl;
    mediaKind = saved.mediaKind;
  }

  await prisma.content.create({
    data: {
      title: parsed.title,
      body: parsed.body,
      userId: session.user.id,
      mediaUrl,
      mediaKind,
    },
  });

  revalidatePath("/dashboard/content");
  revalidatePath("/");
  return { ok: true };
}

export async function updateContentAction(
  formData: FormData,
): Promise<ContentActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const removeMedia = String(formData.get("removeMedia") ?? "") === "true";
  const file = fileFromFormData(formData);

  if (!id) {
    return { ok: false, error: "Missing content id." };
  }

  let parsed: yup.InferType<typeof contentSchema>;
  try {
    parsed = await contentSchema.validate(
      { title, body },
      { abortEarly: false, stripUnknown: true },
    );
  } catch (e) {
    if (e instanceof yup.ValidationError) {
      return { ok: false, error: e.errors[0] ?? "Invalid input." };
    }
    return { ok: false, error: "Invalid input." };
  }

  const row = await prisma.content.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, mediaUrl: true, mediaKind: true },
  });

  if (!row) {
    return { ok: false, error: "Content not found or not allowed." };
  }

  let mediaUrl: string | null = row.mediaUrl;
  let mediaKind: string | null = row.mediaKind;

  if (file) {
    const saved = await saveContentMediaFile(file, session.user.id);
    if ("error" in saved) {
      return { ok: false, error: saved.error };
    }
    await deleteContentMediaFile(row.mediaUrl);
    mediaUrl = saved.mediaUrl;
    mediaKind = saved.mediaKind;
  } else if (removeMedia) {
    await deleteContentMediaFile(row.mediaUrl);
    mediaUrl = null;
    mediaKind = null;
  }

  await prisma.content.update({
    where: { id: row.id },
    data: {
      title: parsed.title,
      body: parsed.body,
      mediaUrl,
      mediaKind,
    },
  });

  revalidatePath("/dashboard/content");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteContentAction(
  id: string,
): Promise<ContentActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in." };
  }

  if (!id?.trim()) {
    return { ok: false, error: "Missing content id." };
  }

  const row = await prisma.content.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, mediaUrl: true },
  });

  if (!row) {
    return { ok: false, error: "Content not found or not allowed." };
  }

  await deleteContentMediaFile(row.mediaUrl);
  await prisma.content.delete({ where: { id: row.id } });

  revalidatePath("/dashboard/content");
  revalidatePath("/");
  return { ok: true };
}
