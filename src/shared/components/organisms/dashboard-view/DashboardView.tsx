"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconClockBolt,
  IconCoin,
  IconCoins,
  IconFileDescription,
  IconFolders,
  IconLanguage,
  IconMedal,
  IconSettings,
  IconTags,
  IconUsers,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardHeader
} from "../../molecules/card/Card";
import type {
  DashboardNavIconKey,
  DashboardNavItem,
} from "@/shared/components/sections/sidebar/dashboard-nav-config";

const MODULE_ICONS: Record<
  DashboardNavIconKey,
  ComponentType<{ className?: string }>
> = {
  categories: IconFolders,
  content: IconFileDescription,
  credits: IconCoin,
  currencies: IconCoins,
  events: IconClockBolt,
  languages: IconLanguage,
  metas: IconMedal,
  settings: IconSettings,
  tags: IconTags,
  users: IconUsers,
};

type DashboardViewProps = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  modules: DashboardNavItem[];
};

export function DashboardView({ user, modules }: DashboardViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <div className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Welcome back{user.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm">
            Select a module to manage your dashboard resources.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = MODULE_ICONS[module.iconKey];

            return (
              <Link key={module.url} href={module.url} className="group block">
                <Card className="h-full transition-colors group-hover:border-primary/60">
                  <CardHeader className="flex flex-row items-center gap-3">
                    <div className="rounded-md border bg-background p-2">
                      <Icon className="size-5 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{module.title}</p>
                      <p className="text-muted-foreground text-xs">{module.url}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm">
                      Open {module.title} module
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <p className="text-center text-muted-foreground text-xs">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← Back to landing
          </Link>
        </p>
      </div>
    </div>
  );
}
