"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { initializeDefaultCurrenciesForUserTx } from "@/modules/currency/actions/currency.actions";
import { initializeDefaultMetasForUserTx } from "@/modules/meta/actions/meta.actions";
import { generateUniqueInviteCode } from "@/lib/user-auth/invite-code";
import { isElevatedRole } from "@/lib/user-auth/roles";
import type { StatusAccount, UserRole } from "@/generated/prisma/enums";

export type AdminUserActionResult = {
  ok: boolean;
  error?: string;
};

export type AdminUserRowDto = {
  userAuthId: string;
  userId: string;
  email: string | null;
  username: string | null;
  role: UserRole;
  status: StatusAccount;
  name: string | null;
  lastName: string | null;
  isGuest: boolean;
  createdAt: string;
};

export type PaginatedAdminUsers = {
  items: AdminUserRowDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

const ROLES: UserRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];
const STATUSES: StatusAccount[] = ["ACTIVE", "DEACTIVE", "SUSPEND"];

function toRow(
  ua: {
    id: string;
    userId: string;
    email: string | null;
    username: string | null;
    status: StatusAccount;
    lastName: string | null;
    isGuest: boolean;
    createdAt: Date;
  },
  user: { role: UserRole; name: string | null; email: string | null },
): AdminUserRowDto {
  return {
    userAuthId: ua.id,
    userId: ua.userId,
    email: ua.email ?? user.email,
    username: ua.username,
    role: user.role,
    status: ua.status,
    name: user.name,
    lastName: ua.lastName,
    isGuest: ua.isGuest,
    createdAt: ua.createdAt.toISOString(),
  };
}

async function requireElevatedActor(): Promise<
  { error: string } | { actor: { id: string; role: UserRole } }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "You must be signed in." };
  }
  const u = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!u || !isElevatedRole(u.role)) {
    return { error: "You are not allowed to manage users." };
  }
  return { actor: u };
}

export async function listAdminUsersAction(): Promise<
  { ok: true; data: AdminUserRowDto[] } | { ok: false; error: string }
> {
  const gate = await requireElevatedActor();
  if ("error" in gate) {
    return { ok: false, error: gate.error };
  }

  const rows = await prisma.userAuth.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { role: true, name: true, email: true } },
    },
  });

  return {
    ok: true,
    data: rows.map((r) => toRow(r, r.user)),
  };
}

export async function listAdminUsersPageAction(input?: {
  page?: number;
  pageSize?: number;
}): Promise<{ ok: true; data: PaginatedAdminUsers } | { ok: false; error: string }> {
  const gate = await requireElevatedActor();
  if ("error" in gate) {
    return { ok: false, error: gate.error };
  }

  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input?.pageSize ?? 10));
  const skip = (page - 1) * pageSize;

  const [rows, totalCount] = await prisma.$transaction([
    prisma.userAuth.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        user: { select: { role: true, name: true, email: true } },
      },
    }),
    prisma.userAuth.count(),
  ]);

  return {
    ok: true,
    data: {
      items: rows.map((r) => toRow(r, r.user)),
      page,
      pageSize,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    },
  };
}

const createSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(8),
  name: z.string().trim().max(200).optional(),
  lastName: z.string().trim().max(200).optional(),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]),
});

export async function createAdminUserAction(
  formData: FormData,
): Promise<AdminUserActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) {
    return { ok: false, error: gate.error };
  }

  const parsed = createSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "").trim() || undefined,
    lastName: String(formData.get("lastName") ?? "").trim() || undefined,
    role: String(formData.get("role") ?? "USER"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { email, password, name, lastName, role } = parsed.data;
  if (!ROLES.includes(role)) {
    return { ok: false, error: "Invalid role." };
  }
  if (role === "SUPER_ADMIN" && gate.actor.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Only a super admin can create super admins." };
  }

  const taken = await prisma.userAuth.findFirst({ where: { email } });
  if (taken) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const inviteCode = await generateUniqueInviteCode();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: name ?? null,
        role,
      },
    });
    await tx.userAuth.create({
      data: {
        userId: user.id,
        email,
        passwordHash,
        inviteCode,
        lastName: lastName ?? null,
      },
    });
    await initializeDefaultCurrenciesForUserTx(tx, user.id);
    await initializeDefaultMetasForUserTx(tx, user.id);
  });

  revalidatePath("/dashboard/users");
  return { ok: true };
}

const updateSchema = z.object({
  userAuthId: z.string().min(1),
  role: z.enum(["USER", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "DEACTIVE", "SUSPEND"]).optional(),
  name: z.string().trim().max(200).optional(),
  lastName: z.string().trim().max(200).optional(),
  password: z.string().min(8).optional().or(z.literal("")),
});

export async function updateAdminUserAction(
  formData: FormData,
): Promise<AdminUserActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) {
    return { ok: false, error: gate.error };
  }

  const passwordRaw = String(formData.get("password") ?? "").trim();
  const parsed = updateSchema.safeParse({
    userAuthId: String(formData.get("userAuthId") ?? "").trim(),
    role: String(formData.get("role") ?? "") || undefined,
    status: String(formData.get("status") ?? "") || undefined,
    name: String(formData.get("name") ?? "").trim() || undefined,
    lastName: String(formData.get("lastName") ?? "").trim() || undefined,
    password: passwordRaw || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const { userAuthId, role, status, name, lastName, password } = parsed.data;
  const ua = await prisma.userAuth.findUnique({ where: { id: userAuthId } });
  if (!ua) {
    return { ok: false, error: "User not found." };
  }

  if (role && !ROLES.includes(role)) {
    return { ok: false, error: "Invalid role." };
  }
  if (role === "SUPER_ADMIN" && gate.actor.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Only a super admin can assign that role." };
  }
  if (status && !STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." };
  }

  const passwordHash = password
    ? await bcrypt.hash(password, 12)
    : undefined;

  await prisma.$transaction(async (tx) => {
    if (role !== undefined || name !== undefined) {
      await tx.user.update({
        where: { id: ua.userId },
        data: {
          ...(role !== undefined ? { role } : {}),
          ...(name !== undefined ? { name: name || null } : {}),
        },
      });
    }
    await tx.userAuth.update({
      where: { id: userAuthId },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(lastName !== undefined ? { lastName: lastName || null } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
  });

  revalidatePath("/dashboard/users");
  return { ok: true };
}

export async function deleteAdminUserAction(
  userAuthId: string,
): Promise<AdminUserActionResult> {
  const gate = await requireElevatedActor();
  if ("error" in gate) {
    return { ok: false, error: gate.error };
  }

  const trimmed = userAuthId?.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing id." };
  }

  const ua = await prisma.userAuth.findUnique({ where: { id: trimmed } });
  if (!ua) {
    return { ok: false, error: "User not found." };
  }

  if (ua.userId === gate.actor.id) {
    return { ok: false, error: "You cannot delete your own account." };
  }

  try {
    await prisma.user.delete({ where: { id: ua.userId } });
  } catch {
    return { ok: false, error: "Could not delete user." };
  }

  revalidatePath("/dashboard/users");
  return { ok: true };
}
