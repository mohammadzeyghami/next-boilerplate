import "server-only";

import { SignJWT, jwtVerify } from "jose";

import { getOtpJwtSecretBytes } from "./config";

export type OtpJwtClaims = {
  userAuthId?: string;
  value: string;
  type: "EMAIL" | "PHONE_NUMBER";
  otpCode: string;
  expireAt?: string;
};

const OTP_JWT_ISS = "user-auth-otp";
const OTP_TTL_MS = 10 * 60 * 1000;

export async function signOtpJwt(claims: OtpJwtClaims): Promise<string> {
  const secret = getOtpJwtSecretBytes();
  const expireAt = new Date(Date.now() + OTP_TTL_MS);
  const payload: Record<string, unknown> = {
    value: claims.value,
    type: claims.type,
    otpCode: claims.otpCode,
    expireAt: expireAt.toISOString(),
  };
  if (claims.userAuthId) payload.userAuthId = claims.userAuthId;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expireAt)
    .setIssuer(OTP_JWT_ISS)
    .sign(secret);
}

export async function verifyOtpJwt(token: string): Promise<OtpJwtClaims> {
  const secret = getOtpJwtSecretBytes();
  const { payload } = await jwtVerify(token, secret, {
    issuer: OTP_JWT_ISS,
    algorithms: ["HS256"],
  });
  const userAuthId =
    typeof payload.userAuthId === "string" ? payload.userAuthId : undefined;
  const value = payload.value;
  const type = payload.type;
  const otpCode = payload.otpCode;
  const expireAt = payload.expireAt;
  if (
    typeof value !== "string" ||
    (type !== "EMAIL" && type !== "PHONE_NUMBER") ||
    typeof otpCode !== "string" ||
    typeof expireAt !== "string"
  ) {
    throw new Error("Invalid OTP token payload.");
  }
  return {
    userAuthId,
    value,
    type,
    otpCode,
    expireAt,
  };
}

export function generateOtpCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += String(Math.floor(Math.random() * 10));
  }
  return out;
}
