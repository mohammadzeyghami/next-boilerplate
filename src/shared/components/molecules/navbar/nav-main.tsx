"use client";

import { usePathname } from "next/navigation";
import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";

import { isActiveNavPath } from "@/lib/active-nav-path";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../sidebar/Default";
import Link from "next/link";

export function NavMain({
  items,
  dashboardHref = "/dashboard",
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
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
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                asChild
                isActive={isActiveNavPath(pathname, item.url)}
              >
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
