"use client";

import type { ComponentType } from "react";
import { usePathname } from "next/navigation";
import {
  IconCirclePlusFilled,
  IconFileDescription,
  IconFolders,
  IconLanguage,
  IconTags,
  IconUsers,
} from "@tabler/icons-react";

import type { DashboardNavIconKey } from "@/shared/components/sections/sidebar/dashboard-nav-config";
import { isActiveNavPath } from "@/lib/active-nav-path";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../sidebar/Default";
import Link from "next/link";

const NAV_ICONS: Record<
  DashboardNavIconKey,
  ComponentType<{ className?: string }>
> = {
  categories: IconFolders,
  content: IconFileDescription,
  languages: IconLanguage,
  tags: IconTags,
  users: IconUsers,
};

export function NavMain({
  items,
  dashboardHref = "/dashboard",
}: {
  items: {
    title: string;
    url: string;
    iconKey: DashboardNavIconKey;
  }[];
  dashboardHref?: string;
}) {
  const pathname = usePathname();
  const dashboardActive = isActiveNavPath(pathname, dashboardHref);

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Dashboard"
              asChild
              isActive={dashboardActive}
            >
              <Link href={dashboardHref}>
                <IconCirclePlusFilled />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = NAV_ICONS[item.iconKey];
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  isActive={isActiveNavPath(pathname, item.url)}
                >
                  <Link href={item.url}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
