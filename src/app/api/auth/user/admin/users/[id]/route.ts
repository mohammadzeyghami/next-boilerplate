import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth/http";
import { toAdminUserAuthDto } from "@/lib/user-auth/public-dto";
import type { UserRole } from "@/generated/prisma/enums";
import type { StatusAccount } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

const ROLES: UserRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];
const STATUSES: StatusAccount[] = ["ACTIVE", "DEACTIVE", "SUSPEND"];

export async function GET(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await ctx.params;
    const ua = await prisma.userAuth.findUnique({
      where: { id },
      include: {
        user: { select: { role: true, name: true, email: true } },
      },
    });
    if (!ua) {
      return NextResponse.json({ code: "USER_NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({
      code: "SUCCESS",
      data: toAdminUserAuthDto(ua, ua.user),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const actor = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { role: true },
    });
    if (!actor) {
      return NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await ctx.params;
    const existing = await prisma.userAuth.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ code: "USER_NOT_FOUND" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const authData: Prisma.UserAuthUncheckedUpdateInput = {};
    const userData: Prisma.UserUpdateInput = {};

    if (typeof body.email === "string") {
      const e = body.email.trim().toLowerCase();
      authData.email = e;
      userData.email = e;
    }
    if (typeof body.username === "string")
      authData.username = body.username.trim() || null;
    if (typeof body.phoneNumber === "string")
      authData.phoneNumber = body.phoneNumber.trim() || null;
    if (typeof body.deviceId === "string")
      authData.deviceId = body.deviceId.trim() || null;
    if (typeof body.name === "string") {
      userData.name = body.name.trim() || null;
    }
    if (typeof body.lastName === "string")
      authData.lastName = body.lastName.trim() || null;
    if (typeof body.born === "string" || body.born === null) {
      authData.born =
        body.born === null || body.born === ""
          ? null
          : new Date(body.born as string);
    }
    if (body.metadata !== undefined)
      authData.metadata = body.metadata as Prisma.InputJsonValue;
    if (Array.isArray(body.contentIds))
      authData.contentIds = body.contentIds as string[];
    if (typeof body.firebaseId === "string")
      authData.firebaseId = body.firebaseId.trim() || null;
    if (typeof body.steamId === "string")
      authData.steamId = body.steamId.trim() || null;
    if (typeof body.isGuest === "boolean") authData.isGuest = body.isGuest;
    if (typeof body.inviterId === "string" || body.inviterId === null)
      authData.inviterId = body.inviterId as string | null;

    if (body.role !== undefined) {
      const r = body.role as UserRole;
      if (!ROLES.includes(r)) {
        return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
      }
      if (r === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
        return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
      }
      userData.role = r;
    }

    if (body.status !== undefined) {
      const st = body.status as StatusAccount;
      if (!STATUSES.includes(st)) {
        return NextResponse.json({ code: "INVALID_INPUT" }, { status: 400 });
      }
      authData.status = st;
    }

    if (typeof body.password === "string" && body.password.length >= 8) {
      authData.passwordHash = await bcrypt.hash(body.password, 12);
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: existing.userId },
          data: userData,
        });
      }
      return tx.userAuth.update({
        where: { id },
        data: authData,
        include: {
          user: { select: { role: true, name: true, email: true } },
        },
      });
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

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await ctx.params;
    const ua = await prisma.userAuth.findUnique({ where: { id } });
    if (!ua) {
      return NextResponse.json({ code: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (ua.id === auth.userAuthId) {
      return NextResponse.json({ code: "CANNOT_DELETE_SELF" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: ua.userId } });

    return NextResponse.json({ code: "SUCCESS" });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
