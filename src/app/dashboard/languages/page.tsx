import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import LanguagePage from "@/modules/language/pages/Language";
import { redirect } from "next/navigation";

export default async function LanguagesDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const canManageLanguages = user?.role === "ADMIN";

  return <LanguagePage canManageLanguages={canManageLanguages} />;
}
