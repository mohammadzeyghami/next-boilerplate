import type { UserRole } from "@/generated/prisma/enums";

export function isElevatedRole(role: UserRole | null | undefined): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}
