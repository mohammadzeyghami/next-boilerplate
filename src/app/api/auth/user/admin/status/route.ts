import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth/http";
import { toAdminUserAuthDto } from "@/lib/user-auth/public-dto";
import type { StatusAccount } from "@/generated/prisma/enums";

const STATUSES: StatusAccount[] = ["ACTIVE", "DEACTIVE", "SUSPEND"];

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      userId?: string;
      status?: StatusAccount;
    };
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const status = body.status;

    if (!userId || !status || !STATUSES.includes(status)) {
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
      include: {
        user: { select: { role: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      code: "SUCCESS",
      data: toAdminUserAuthDto(updated, updated.user),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
