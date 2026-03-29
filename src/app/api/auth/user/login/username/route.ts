import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { toUserAuthSelfClientDto } from "@/lib/user-auth/public-dto";
import { signTokensForUserAuth } from "@/lib/user-auth/tokens-bundle";
import { createUserWithAuthProfile } from "@/lib/user-auth/user-bootstrap";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
      allowRegister?: boolean;
    };
    const username =
      typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const allowRegister = Boolean(body.allowRegister);

    if (!username || !password) {
      return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
    }

    const ua = await prisma.userAuth.findUnique({
      where: { username },
      include: { user: true },
    });

    if (!ua) {
      if (!allowRegister) {
        return NextResponse.json(
          { code: "USER_NOT_FOUND" },
          { status: 404 },
        );
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const created = await createUserWithAuthProfile({
        username,
        passwordHash,
      });
      return NextResponse.json(
        {
          code: "SUCCESS",
          data: toUserAuthSelfClientDto(created, created.user),
        },
        { status: 201 },
      );
    }

    if (!ua.passwordHash || !(await bcrypt.compare(password, ua.passwordHash))) {
      return NextResponse.json(
        { code: "PASSWORD_IS_WRONG" },
        { status: 401 },
      );
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
