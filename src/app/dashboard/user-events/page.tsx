import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import UserEventsPage from "@/modules/user-event/pages/UserEvents";

export default async function UserEventsDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!isElevatedRole(user?.role)) {
    redirect("/dashboard");
  }

  return <UserEventsPage />;
}
