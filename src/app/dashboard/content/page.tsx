import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ContentPage, { ContentItem } from "@/modules/content/pages/Content";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const items = await prisma.content.findMany({
    // @ts-ignore
    where: session.user?.role === "ADMIN" ? {} : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return <ContentPage items={items as ContentItem[]} />;
};

export default page;
