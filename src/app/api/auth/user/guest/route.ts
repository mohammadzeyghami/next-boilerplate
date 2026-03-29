import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { signTokensForUserAuth } from "@/lib/user-auth/tokens-bundle";
import { toUserAuthSelfClientDto } from "@/lib/user-auth/public-dto";
import { createUserWithAuthProfile } from "@/lib/user-auth/user-bootstrap";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { deviceId?: string };
    const deviceId =
      typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    if (!deviceId) {
      return NextResponse.json(
        { code: "DEVICE_ID_REQUIRED" },
        { status: 400 },
      );
    }

    let ua = await prisma.userAuth.findUnique({
      where: { deviceId },
      include: { user: true },
    });

    if (!ua) {
      const created = await createUserWithAuthProfile({
        deviceId,
        isGuest: true,
      });
      ua = created;
    } else if (!ua.isGuest) {
      /* existing non-guest device binding — treat as login */
    }

    if (ua.status !== "ACTIVE") {
      return NextResponse.json(
        { code: "ACCOUNT_DISABLED" },
        { status: 403 },
      );
    }

    const { token, refreshToken } = await signTokensForUserAuth(
      ua.id,
      ua.userId,
      ua.user.role,
    );

    return NextResponse.json({
      code: "SUCCESS",
      data: {
        UserAuth: toUserAuthSelfClientDto(ua, ua.user),
        token,
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
