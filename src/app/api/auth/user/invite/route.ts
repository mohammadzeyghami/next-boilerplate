import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/user-auth/http";
import { toPublicUserAuth } from "@/lib/user-auth/public-dto";

/**
 * SetInviter(userId, inviteCode) — caller must match `userId` (from body) and be authenticated.
 */
export async function POST(request: Request) {
  const auth = await requireAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      userId?: string;
      inviteCode?: string;
    };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const inviteCode =
      typeof body.inviteCode === "string" ? body.inviteCode.trim() : "";

    if (!userId || !inviteCode) {
      return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
    }

    if (userId !== auth.userId) {
      return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    const inviter = await prisma.userAuth.findUnique({
      where: { inviteCode },
    });
    if (!inviter) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    const selfAuth = await prisma.userAuth.findUnique({
      where: { userId },
    });
    if (!selfAuth) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (inviter.id === selfAuth.id) {
      return NextResponse.json({ code: "INVALID_INVITER" }, { status: 400 });
    }

    const updated = await prisma.userAuth.update({
      where: { id: selfAuth.id },
      data: { inviterId: inviter.id },
    });

    return NextResponse.json({
      code: "SUCCESS",
      data: toPublicUserAuth(updated),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
