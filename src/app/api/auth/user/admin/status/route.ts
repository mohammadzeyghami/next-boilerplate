import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth/http";
import { toPublicUserAuth } from "@/lib/user-auth/public-dto";
import type { AccountStatus } from "@/generated/prisma/enums";

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      userId?: string;
      status?: AccountStatus;
    };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const status = body.status;

    if (!userId || (status !== "ACTIVE" && status !== "DISABLED")) {
      return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
    }

    const ua = await prisma.userAuth.findUnique({
      where: { userId },
    });
    if (!ua) {
      return NextResponse.json(
        { code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    const updated = await prisma.userAuth.update({
      where: { id: ua.id },
      data: { status },
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
