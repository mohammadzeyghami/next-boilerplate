"use client";

import Link from "next/link";
import { CreditCard, LayoutDashboard, TrendingUp, Users } from "lucide-react";

import { Button } from "../../atoms/button/Button";
import { Badge } from "../../atoms/badge";
import { Input } from "../../atoms/input";
import { Label } from "../../atoms/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../molecules/card/Card";

import { Separator } from "../../atoms/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/molecules/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../molecules/table/Table";
import NavbarDashboard from "../navbar/Dashboard";

const rows = [
  { id: "INV-001", customer: "Liam Carter", status: "Paid", amount: "$250.00" },
  {
    id: "INV-002",
    customer: "Noah Brooks",
    status: "Pending",
    amount: "$120.50",
  },
  { id: "INV-003", customer: "Mia Chen", status: "Paid", amount: "$89.00" },
  {
    id: "INV-004",
    customer: "Ava Singh",
    status: "Overdue",
    amount: "$410.00",
  },
] as const;

const stats = [
  {
    title: "Revenue",
    value: "$24.8k",
    hint: "+12% vs last month",
    icon: TrendingUp,
  },
  {
    title: "Active users",
    value: "1,284",
    hint: "+4% vs last month",
    icon: Users,
  },
  {
    title: "Subscriptions",
    value: "312",
    hint: "3 trials ending soon",
    icon: CreditCard,
  },
  {
    title: "Uptime",
    value: "99.98%",
    hint: "Last 30 days",
    icon: LayoutDashboard,
  },
] as const;

function statusBadge(status: string) {
  switch (status) {
    case "Paid":
      return <Badge variant="secondary">{status}</Badge>;
    case "Pending":
      return <Badge variant="outline">{status}</Badge>;
    case "Overdue":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

type DashboardViewProps = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
};

export function DashboardView({ user }: DashboardViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <NavbarDashboard />

      <div className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Overview
          </h1>
          <p className="text-muted-foreground text-sm">
            Sample dashboard using shadcn cards, tabs, table, and menus.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ title, value, hint, icon: Icon }) => (
            <Card key={title} size="sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-medium text-muted-foreground text-sm">
                  {title}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              </CardHeader>
              <CardContent className="pt-0">
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {value}
                </p>
                <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Workspace</CardTitle>
                <CardDescription>
                  Invoices and recent activity (demo data).
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="invoices" className="gap-4">
              <TabsList
                className="w-full justify-start sm:w-auto"
              >
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="invoices" className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="grid w-full max-w-xs gap-2">
                    <Label htmlFor="filter-customer">Filter</Label>
                    <Input id="filter-customer" placeholder="Customer name" />
                  </div>
                  <Button size="sm" className="sm:mb-0.5">
                    Apply
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-mono text-xs">
                          {row.id}
                        </TableCell>
                        <TableCell>{row.customer}</TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              <TabsContent value="activity" className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Latest events in your workspace.
                </p>
                <Separator />
                <ul className="space-y-3 text-sm">
                  <li className="flex justify-between gap-4">
                    <span>New team member invited</span>
                    <span className="shrink-0 text-muted-foreground">
                      2h ago
                    </span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>Invoice INV-004 marked overdue</span>
                    <span className="shrink-0 text-muted-foreground">
                      5h ago
                    </span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span>Weekly report generated</span>
                    <span className="shrink-0 text-muted-foreground">
                      1d ago
                    </span>
                  </li>
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-muted-foreground text-xs">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← Back to landing
          </Link>
        </p>
      </div>
    </div>
  );
}
