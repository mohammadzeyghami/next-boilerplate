import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import CreditsPage from "@/modules/credit/pages/Credits";

export default async function CreditsDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!isElevatedRole(user?.role)) {
    redirect("/dashboard");
  }

  return <CreditsPage canManageCredits />;
}
