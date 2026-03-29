import type { UserAuth } from "@/generated/prisma/client";

export function toPublicUserAuth(a: UserAuth) {
  return {
    id: a.id,
    userId: a.userId,
    deviceId: a.deviceId,
    username: a.username,
    email: a.email,
    phoneNumber: a.phoneNumber,
    isGuest: a.isGuest,
    inviteCode: a.inviteCode,
    inviterId: a.inviterId,
    status: a.status,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}
