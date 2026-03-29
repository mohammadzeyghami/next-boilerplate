import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import AdminUsersPage from "@/modules/admin-users/pages/AdminUsers";
import { isElevatedRole } from "@/lib/user-auth/roles";
import { redirect } from "next/navigation";

export default async function AdminUsersDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!isElevatedRole(user?.role)) {
    redirect("/dashboard");
  }

  return (
    <AdminUsersPage canAssignSuperAdmin={user?.role === "SUPER_ADMIN"} />
  );
}
