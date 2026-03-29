import "server-only";

import { SignJWT, jwtVerify } from "jose";

import { getJwtSecretBytes } from "./config";

const ACCESS_ISS = "user-auth-access";
const ACCESS_TTL = "15m";

export type AccessClaims = {
  sub: string;
  userAuthId: string;
  role: "USER" | "ADMIN";
};

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
  const role = payload.role;
  if (
    typeof sub !== "string" ||
    typeof userAuthId !== "string" ||
    (role !== "USER" && role !== "ADMIN")
  ) {
    throw new Error("Invalid access token.");
  }
  return { sub, userAuthId, role };
}
