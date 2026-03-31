import "server-only";

import { initializeDefaultCurrenciesForUserTx } from "@/modules/currency/actions/currency.actions";
import { initializeDefaultMetasForUserTx } from "@/modules/meta/actions/meta.actions";
import { prisma } from "@/lib/prisma";

import { generateUniqueInviteCode } from "./invite-code";

export async function createUserWithAuthProfile(input: {
  email?: string | null;
  phoneNumber?: string | null;
  passwordHash?: string | null;
  username?: string | null;
  isGuest?: boolean;
  deviceId?: string | null;
  name?: string | null;
  lastName?: string | null;
}) {
  const inviteCode = await generateUniqueInviteCode();
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email ?? null,
        name: input.name ?? null,
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
        lastName: input.lastName ?? null,
      },
    });
    await initializeDefaultCurrenciesForUserTx(tx, user.id);
    await initializeDefaultMetasForUserTx(tx, user.id);
    return tx.userAuth.findUniqueOrThrow({
      where: { id: ua.id },
      include: { user: true },
    });
  });
}
