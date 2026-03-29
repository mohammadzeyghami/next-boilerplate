import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { toUserAuthSelfClientDto } from "@/lib/user-auth/public-dto";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      value?: string;
      valueType?: "Phone" | "Email";
      password?: string;
    };
    const valueRaw = typeof body.value === "string" ? body.value.trim() : "";
    const valueType = body.valueType;
    const password = typeof body.password === "string" ? body.password : "";

    if (!valueRaw || !password || !valueType) {
      return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
    }

    const value =
      valueType === "Email" ? valueRaw.toLowerCase() : valueRaw.replace(/\s/g, "");

    const ua = await prisma.userAuth.findFirst({
      where:
        valueType === "Email"
          ? { email: value }
          : { phoneNumber: value },
      include: { user: true },
    });

    if (!ua) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND" },
        { status: 404 },
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

    return NextResponse.json({
      code: "SUCCESS",
      data: toUserAuthSelfClientDto(ua, ua.user),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
