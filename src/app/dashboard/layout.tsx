import {
  SidebarInset,
  SidebarProvider,
} from "@/shared/components/molecules/sidebar/Default";
import { AppSidebar } from "@/shared/components/sections/sidebar/dashboardSidebar";
import { auth } from "@/auth";
import React from "react";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth();
  const user = {
    name: session?.user?.name?.trim() || session?.user?.email || "Account",
    email: session?.user?.email ?? "",
    avatar: session?.user?.image?.trim() ?? "",
  };

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
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
