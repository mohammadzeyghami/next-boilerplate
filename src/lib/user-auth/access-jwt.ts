import "server-only";

import { SignJWT, jwtVerify } from "jose";

import type { UserRole } from "@/generated/prisma/enums";

import { getJwtSecretBytes } from "./config";

const ACCESS_ISS = "user-auth-access";
const ACCESS_TTL = "15m";

export type AccessClaims = {
  sub: string;
  userAuthId: string;
  role: UserRole;
};

const USER_ROLES: UserRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];

function isUserRole(v: unknown): v is UserRole {
  return typeof v === "string" && (USER_ROLES as string[]).includes(v);
}

export async function signAccessToken(c: AccessClaims): Promise<string> {
  const secret = getJwtSecretBytes();
  return new SignJWT({
    userAuthId: c.userAuthId,
    role: c.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(c.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .setIssuer(ACCESS_ISS)
    .sign(secret);
}

export async function verifyAccessToken(
  token: string,
): Promise<AccessClaims> {
  const secret = getJwtSecretBytes();
  const { payload } = await jwtVerify(token, secret, {
    issuer: ACCESS_ISS,
    algorithms: ["HS256"],
  });
  const sub = payload.sub;
  const userAuthId = payload.userAuthId;
  const legacy = payload.profileRole;
  const roleRaw = payload.role ?? legacy;
  if (
    typeof sub !== "string" ||
    typeof userAuthId !== "string" ||
    !isUserRole(roleRaw)
  ) {
    throw new Error("Invalid access token.");
  }
  return { sub, userAuthId, role: roleRaw };
}
