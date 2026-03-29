import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toUserAuthOtherPublicDto } from "@/lib/user-auth/public-dto";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await ctx.params;
    const inviteCode = decodeURIComponent(code ?? "").trim();
    if (!inviteCode) {
      return NextResponse.json({ code: "USER_NOT_FOUND" }, { status: 409 });
    }

    const ua = await prisma.userAuth.findUnique({
      where: { inviteCode },
    });
    if (!ua) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND" },
        { status: 409 },
      );
    }

    return NextResponse.json({
      code: "SUCCESS",
      data: toUserAuthOtherPublicDto(ua),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
