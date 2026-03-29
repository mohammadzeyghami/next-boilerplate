import type { UserRole } from "@/generated/prisma/enums";

/**
 * `ADMIN` or `SUPER_ADMIN` — used for admin-only dashboard areas (e.g. Tags,
 * Languages management) and **must match** who may open `/dashboard/users` and
 * see the sidebar “Users” item (`app/dashboard/layout.tsx`).
 */
export function isElevatedRole(role: UserRole | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

/** Same gate as {@link isElevatedRole}; use where you mean “Users module” only. */
export function canAccessAdminUsersModule(
  role: UserRole | null | undefined,
): boolean {
  return isElevatedRole(role);
}
