import {
  SidebarInset,
  SidebarProvider,
} from "@/shared/components/molecules/sidebar/Default";
import {
  baseDashboardNavMain,
  dashboardCreditsNavItem,
  dashboardCurrenciesNavItem,
  dashboardMetasNavItem,
  dashboardUserEventsNavItem,
  dashboardUsersNavItem,
} from "@/shared/components/sections/sidebar/dashboard-nav-config";
import { AppSidebar } from "@/shared/components/sections/sidebar/dashboardSidebar";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessAdminUsersModule } from "@/lib/user-auth/roles";
import React from "react";
import NavbarDashboard from "@/shared/components/organisms/navbar/Dashboard";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const user = {
    name: session?.user?.name?.trim() || session?.user?.email || "Account",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image?.trim() ?? "",
  };

  let mainNav = [...baseDashboardNavMain];
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    if (canAccessAdminUsersModule(dbUser?.role)) {
      mainNav = [
        ...mainNav,
        dashboardCurrenciesNavItem,
        dashboardMetasNavItem,
        dashboardCreditsNavItem,
        dashboardUserEventsNavItem,
        dashboardUsersNavItem,
      ];
    }
  }

  return (
    <div className="flex min-h-svh flex-1 flex-col">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} mainNav={mainNav} />
        <SidebarInset>
          <div className="flex min-h-0 flex-1 flex-col">
            <NavbarDashboard />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
