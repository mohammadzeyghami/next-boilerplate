import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const REFRESH_DAYS = 30;

export function hashRefreshToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function issueRefreshToken(userAuthId: string): Promise<string> {
  const raw = randomBytes(48).toString("base64url");
  const tokenHash = hashRefreshToken(raw);
  const expiresAt = new Date(
    Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000,
  );
  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userAuthId,
      expiresAt,
    },
  });
  return raw;
}
