import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/user-auth/http";
import { toAdminUserAuthDto } from "@/lib/user-auth/public-dto";
import { generateUniqueInviteCode } from "@/lib/user-auth/invite-code";
import type { UserRole } from "@/generated/prisma/enums";

const ROLES: UserRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await prisma.$transaction([
      prisma.userAuth.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { role: true, name: true, email: true } },
        },
      }),
      prisma.userAuth.count(),
    ]);

    return NextResponse.json({
      code: "SUCCESS",
      data: {
        items: items.map((row) => toAdminUserAuthDto(row, row.user)),
        total,
        page,
        limit,
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

export async function POST(request: Request) {
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

    const body = (await request.json()) as Record<string, unknown>;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const roleRaw = body.role as UserRole | undefined;
    const username =
      typeof body.username === "string" ? body.username.trim() : undefined;
    const phoneNumber =
      typeof body.phoneNumber === "string"
        ? body.phoneNumber.trim()
        : undefined;
    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const lastName =
      typeof body.lastName === "string" ? body.lastName.trim() : undefined;
    const deviceId =
      typeof body.deviceId === "string" ? body.deviceId.trim() : undefined;

    if (!email || !password) {
      return NextResponse.json(
        { code: "INVALID_INPUT" },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { code: "PASSWORD_TOO_SHORT" },
        { status: 400 },
      );
    }
    const role: UserRole =
      roleRaw && ROLES.includes(roleRaw) ? roleRaw : "USER";

    if (role === "SUPER_ADMIN" && actor.role !== "SUPER_ADMIN") {
      return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    }

    const taken = await prisma.userAuth.findFirst({
      where: { OR: [{ email }, { username: username || "" }] },
    });
    if (taken) {
      return NextResponse.json({ code: "DUPLICATE_IDENTITY" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const inviteCode = await generateUniqueInviteCode();

    const ua = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name: name ?? null,
          role,
        },
      });
      const row = await tx.userAuth.create({
        data: {
          userId: user.id,
          email,
          username: username || null,
          phoneNumber: phoneNumber || null,
          passwordHash,
          inviteCode,
          lastName: lastName ?? null,
          deviceId: deviceId || null,
        },
      });
      return tx.userAuth.findUniqueOrThrow({
        where: { id: row.id },
        include: {
          user: { select: { role: true, name: true, email: true } },
        },
      });
    });

    return NextResponse.json(
      { code: "SUCCESS", data: toAdminUserAuthDto(ua, ua.user) },
      { status: 201 },
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
