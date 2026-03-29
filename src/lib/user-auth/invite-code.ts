import "server-only";

import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export async function generateUniqueInviteCode(): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    const code = `inv_${randomBytes(16).toString("base64url")}`;
    const taken = await prisma.userAuth.findUnique({
      where: { inviteCode: code },
      select: { id: true },
    });
    if (!taken) return code;
  }
  throw new Error("Could not allocate invite code.");
}
