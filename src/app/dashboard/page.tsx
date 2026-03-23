import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { DashboardView } from "@/share-components/organisms/dashboard-view/DashboardView";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <DashboardView
      user={{
        id: session.user.id,
        name: session.user.name,
        email: session.user.email ?? undefined,
      }}
    />
  );
}
