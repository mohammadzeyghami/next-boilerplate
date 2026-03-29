import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import TagPage from "@/modules/tag/pages/Tag";
import { redirect } from "next/navigation";

export default async function TagsDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const canManageTags = isElevatedRole(user?.role);

  return <TagPage canManageTags={canManageTags} />;
}
