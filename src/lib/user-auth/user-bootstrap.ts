import "server-only";

import { prisma } from "@/lib/prisma";

import { generateUniqueInviteCode } from "./invite-code";

export async function createUserWithAuthProfile(input: {
  email?: string | null;
  phoneNumber?: string | null;
  passwordHash?: string | null;
  username?: string | null;
  isGuest?: boolean;
  deviceId?: string | null;
}) {
  const inviteCode = await generateUniqueInviteCode();
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email ?? null,
        name: null,
        role: "USER",
      },
    });
    const ua = await tx.userAuth.create({
      data: {
        userId: user.id,
        email: input.email ?? null,
        phoneNumber: input.phoneNumber ?? null,
        passwordHash: input.passwordHash ?? null,
        username: input.username ?? null,
        isGuest: input.isGuest ?? false,
        deviceId: input.deviceId ?? null,
        inviteCode,
      },
    });
    await tx.userProfile.create({
      data: { userAuthId: ua.id },
    });
    return tx.userAuth.findUniqueOrThrow({
      where: { id: ua.id },
      include: { user: true },
    });
  });
}
