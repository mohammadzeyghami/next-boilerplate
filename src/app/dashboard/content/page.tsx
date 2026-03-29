import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import ContentPage, { ContentItem } from "@/modules/content/pages/Content";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const items = await prisma.content.findMany({
    where: isElevatedRole(dbUser?.role) ? {} : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return <ContentPage items={items as ContentItem[]} />;
};

export default page;
