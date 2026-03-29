import type { User, UserAuth } from "@/generated/prisma/client";

/** Own account: no password hash, no app role on this object (role lives on `User`). */
export function toUserAuthSelfClientDto(
  a: UserAuth,
  user?: Pick<User, "name"> | null,
) {
  return {
    id: a.id,
    userId: a.userId,
    status: a.status,
    username: a.username,
    phoneNumber: a.phoneNumber,
    email: a.email,
    deviceId: a.deviceId,
    isGuest: a.isGuest,
    name: user?.name ?? null,
    lastName: a.lastName,
    born: a.born ? a.born.toISOString() : null,
    metadata: a.metadata ?? null,
    contentIds: a.contentIds,
    inviteCode: a.inviteCode,
    inviterId: a.inviterId,
    firebaseId: a.firebaseId,
    steamId: a.steamId,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

/** Another user’s public slice: redacted per API spec. */
export function toUserAuthOtherPublicDto(a: UserAuth) {
  return {
    id: a.id,
    userId: a.userId,
    username: a.username,
    lastName: a.lastName,
    isGuest: a.isGuest,
    inviteCode: a.inviteCode,
    contentIds: a.contentIds,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

/** Admin / server: full `UserAuth` plus `User.role` (no password hash). */
export function toAdminUserAuthDto(
  a: UserAuth,
  user: Pick<User, "role" | "name" | "email">,
) {
  return {
    id: a.id,
    userId: a.userId,
    role: user.role,
    status: a.status,
    username: a.username,
    phoneNumber: a.phoneNumber,
    email: a.email,
    deviceId: a.deviceId,
    isGuest: a.isGuest,
    name: user.name,
    lastName: a.lastName,
    born: a.born ? a.born.toISOString() : null,
    metadata: a.metadata ?? null,
    contentIds: a.contentIds,
    inviteCode: a.inviteCode,
    inviterId: a.inviterId,
    firebaseId: a.firebaseId,
    steamId: a.steamId,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

/** @deprecated Prefer toUserAuthSelfClientDto */
export function toPublicUserAuth(a: UserAuth, user?: Pick<User, "name"> | null) {
  return toUserAuthSelfClientDto(a, user);
}

export type UserOtherPublicBundle = {
  user: { id: string; name: string | null; image: string | null };
  userAuth: ReturnType<typeof toUserAuthOtherPublicDto>;
};

export function toUserOtherPublicBundle(
  user: Pick<User, "id" | "name" | "image">,
  ua: UserAuth,
): UserOtherPublicBundle {
  return {
    user: {
      id: user.id,
      name: user.name,
      image: user.image,
    },
    userAuth: toUserAuthOtherPublicDto(ua),
  };
}
