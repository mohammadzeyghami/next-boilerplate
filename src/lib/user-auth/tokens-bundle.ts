import "server-only";

import type { UserRole } from "@/generated/prisma/enums";

import { signAccessToken } from "./access-jwt";
import { issueRefreshToken } from "./refresh-token";

export async function signTokensForUserAuth(
  userAuthId: string,
  userId: string,
  role: UserRole,
) {
  const token = await signAccessToken({
    sub: userId,
    userAuthId,
    role,
  });
  const refreshToken = await issueRefreshToken(userAuthId);
  return { token, refreshToken };
}
