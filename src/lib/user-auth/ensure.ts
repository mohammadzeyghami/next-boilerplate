import "server-only";

import { prisma } from "@/lib/prisma";

import { generateUniqueInviteCode } from "./invite-code";

/**
 * Ensures OAuth / legacy users have a `UserAuth` row.
 */
export async function ensureUserAuthForUser(userId: string) {
  const existing = await prisma.userAuth.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const inviteCode = await generateUniqueInviteCode();

  return prisma.$transaction(async (tx) => {
    const ua = await tx.userAuth.create({
      data: {
        userId,
        email: user.email,
        inviteCode,
        isGuest: false,
      },
    });
    return ua;
  });
}
