import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdminUsersModule } from "@/lib/user-auth/roles";
import { DashboardView } from "@/shared/components/organisms/dashboard-view/DashboardView";
import {
  baseDashboardNavMain,
  dashboardCreditsNavItem,
  dashboardCurrenciesNavItem,
  dashboardMetasNavItem,
  dashboardUserEventsNavItem,
  dashboardUsersNavItem,
} from "@/shared/components/sections/sidebar/dashboard-nav-config";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let modules = [...baseDashboardNavMain];
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (canAccessAdminUsersModule(dbUser?.role)) {
    modules = [
      ...modules,
      dashboardCurrenciesNavItem,
      dashboardMetasNavItem,
      dashboardCreditsNavItem,
      dashboardUserEventsNavItem,
      dashboardUsersNavItem,
    ];
  }

  return (
    <DashboardView
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email ?? undefined,
      }}
      modules={modules}
    />
  );
}
