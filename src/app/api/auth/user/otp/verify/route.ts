import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyOtpJwt } from "@/lib/user-auth/otp-jwt";
import { toPublicUserAuth } from "@/lib/user-auth/public-dto";
import { signTokensForUserAuth } from "@/lib/user-auth/tokens-bundle";
import { createUserWithAuthProfile } from "@/lib/user-auth/user-bootstrap";
import { bearerToken } from "@/lib/user-auth/http";

function otpMatches(expected: string, given: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(given, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      otpCode?: string;
      token?: string;
    };
    const otpCode = typeof body.otpCode === "string" ? body.otpCode.trim() : "";
    const fromBody = typeof body.token === "string" ? body.token.trim() : "";
    const fromHeader = bearerToken(request) ?? "";
    const token = fromBody || fromHeader;
    if (!otpCode || !token) {
      return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
    }

    let claims;
    try {
      claims = await verifyOtpJwt(token);
    } catch {
      return NextResponse.json({ code: "INVALID_TOKEN" }, { status: 400 });
    }

    if (!otpMatches(claims.otpCode, otpCode)) {
      return NextResponse.json({ code: "OTP_MISMATCH" }, { status: 400 });
    }

    let ua = claims.userAuthId
      ? await prisma.userAuth.findUnique({
          where: { id: claims.userAuthId },
          include: { user: true },
        })
      : null;

    if (!ua) {
      ua = await prisma.userAuth.findFirst({
        where:
          claims.type === "EMAIL"
            ? { email: claims.value }
            : { phoneNumber: claims.value },
        include: { user: true },
      });
    }

    if (ua) {
      if (claims.userAuthId) {
        if (claims.type === "EMAIL" && ua.email !== claims.value) {
          await prisma.$transaction([
            prisma.userAuth.update({
              where: { id: ua.id },
              data: { email: claims.value },
            }),
            prisma.user.update({
              where: { id: ua.userId },
              data: { email: claims.value },
            }),
          ]);
        } else if (
          claims.type === "PHONE_NUMBER" &&
          ua.phoneNumber !== claims.value
        ) {
          await prisma.userAuth.update({
            where: { id: ua.id },
            data: { phoneNumber: claims.value },
          });
        }
      }

      ua = await prisma.userAuth.findUniqueOrThrow({
        where: { id: ua.id },
        include: { user: true },
      });

      if (ua.status !== "ACTIVE") {
        return NextResponse.json(
          { code: "ACCOUNT_DISABLED" },
          { status: 403 },
        );
      }

      const { token: access, refreshToken } = await signTokensForUserAuth(
        ua.id,
        ua.userId,
        ua.user.role,
      );

      return NextResponse.json({
        code: "SUCCESS",
        data: {
          UserAuth: toPublicUserAuth(ua),
          token: access,
          refreshToken,
        },
      });
    }

    const created = await createUserWithAuthProfile(
      claims.type === "EMAIL"
        ? { email: claims.value }
        : { phoneNumber: claims.value },
    );

    if (created.status !== "ACTIVE") {
      return NextResponse.json(
        { code: "ACCOUNT_DISABLED" },
        { status: 403 },
      );
    }

    const { token: access, refreshToken } = await signTokensForUserAuth(
      created.id,
      created.userId,
      created.user.role,
    );

    return NextResponse.json({
      code: "SUCCESS",
      data: {
        UserAuth: toPublicUserAuth(created),
        token: access,
        refreshToken,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
