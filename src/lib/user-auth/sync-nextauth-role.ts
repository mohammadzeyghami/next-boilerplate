import "server-only";

import type { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function setUserAppRole(userId: string, role: UserRole) {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}
