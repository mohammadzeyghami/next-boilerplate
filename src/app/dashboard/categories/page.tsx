import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import CategoryPage from "@/modules/category/pages/Category";
import { redirect } from "next/navigation";

export default async function CategoriesDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const canManageCategories = isElevatedRole(user?.role);

  return <CategoryPage canManageCategories={canManageCategories} />;
}
