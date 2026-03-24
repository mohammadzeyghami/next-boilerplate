import "server-only";

import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_SEGMENT = "uploads/content";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

const VIDEO_TYPES: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type SavedContentMedia = {
  mediaUrl: string;
  mediaKind: "image" | "video";
};

function uploadRoot() {
  return path.join(process.cwd(), "public", UPLOAD_SEGMENT);
}

function extForMime(mime: string): string | null {
  if (mime in IMAGE_TYPES) return IMAGE_TYPES[mime]!;
  if (mime in VIDEO_TYPES) return VIDEO_TYPES[mime]!;
  return null;
}

function kindForMime(mime: string): "image" | "video" | null {
  if (mime in IMAGE_TYPES) return "image";
  if (mime in VIDEO_TYPES) return "video";
  return null;
}

function maxBytesForMime(mime: string): number {
  return kindForMime(mime) === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
}

/**
 * Saves an uploaded image or video under `public/uploads/content/{userId}/`.
 */
export async function saveContentMediaFile(
  file: File,
  userId: string,
): Promise<SavedContentMedia | { error: string }> {
  const mime = file.type;
  const kind = kindForMime(mime);
  const ext = extForMime(mime);
  if (!kind || !ext) {
    return {
      error:
        "Unsupported file type. Use an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM, MOV).",
    };
  }

  const max = maxBytesForMime(mime);
  if (file.size > max) {
    const mb = Math.round(max / (1024 * 1024));
    return { error: `File is too large (max ${mb} MB for ${kind}s).` };
  }

  const userDir = path.join(uploadRoot(), userId);
  await mkdir(userDir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const absolute = path.join(userDir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);

  const mediaUrl = `/${UPLOAD_SEGMENT}/${userId}/${filename}`;
  return { mediaUrl, mediaKind: kind };
}

/**
 * Resolves a stored public media path to an absolute file path, or null if invalid.
 */
export function absolutePathForMediaUrl(mediaUrl: string | null | undefined) {
  if (!mediaUrl?.startsWith(`/${UPLOAD_SEGMENT}/`)) return null;
  const rest = mediaUrl.slice(`/${UPLOAD_SEGMENT}/`.length);
  if (!rest || rest.includes("..") || rest.split("/").length !== 2) return null;

  const full = path.join(uploadRoot(), ...rest.split("/"));
  const resolved = path.resolve(full);
  const rootResolved = path.resolve(uploadRoot());
  if (
    !resolved.startsWith(rootResolved + path.sep) &&
    resolved !== rootResolved
  ) {
    return null;
  }
  return resolved;
}

export async function deleteContentMediaFile(
  mediaUrl: string | null | undefined,
): Promise<void> {
  const abs = absolutePathForMediaUrl(mediaUrl);
  if (!abs) return;
  try {
    await unlink(abs);
  } catch {
    // ignore missing file
  }
}
