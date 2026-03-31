import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import CurrencyPage from "@/modules/currency/pages/Currency";

export default async function CurrencyDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!isElevatedRole(user?.role)) {
    redirect("/dashboard");
  }

  return <CurrencyPage canManageCurrencies />;
}
