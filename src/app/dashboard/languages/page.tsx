import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import LanguagePage from "@/modules/language/pages/Language";
import { redirect } from "next/navigation";

export default async function LanguagesDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const canManageLanguages = isElevatedRole(user?.role);

  return <LanguagePage canManageLanguages={canManageLanguages} />;
}
