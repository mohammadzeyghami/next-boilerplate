import { NextResponse } from "next/server";

import type { UserRole } from "@/generated/prisma/enums";

import { verifyAccessToken } from "./access-jwt";

export function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export async function requireAccess(
  request: Request,
): Promise<
  | {
      ok: true;
      userId: string;
      userAuthId: string;
      role: UserRole;
    }
  | { ok: false; response: NextResponse }
> {
  const raw = bearerToken(request);
  if (!raw) {
    return {
      ok: false,
      response: NextResponse.json({ code: "UNAUTHORIZED" }, { status: 401 }),
    };
  }
  try {
    const c = await verifyAccessToken(raw);
    return {
      ok: true,
      userId: c.sub,
      userAuthId: c.userAuthId,
      role: c.role,
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ code: "INVALID_TOKEN" }, { status: 401 }),
    };
  }
}

/** ADMIN or SUPER_ADMIN (dashboard / admin APIs). */
export async function requireAdmin(request: Request) {
  const r = await requireAccess(request);
  if (!r.ok) return r;
  if (r.role !== "ADMIN" && r.role !== "SUPER_ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json({ code: "FORBIDDEN" }, { status: 403 }),
    };
  }
  return r;
}
