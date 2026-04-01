import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isElevatedRole } from "@/lib/user-auth/roles";
import ContentPage, { ContentItem } from "@/modules/content/pages/Content";
import { redirect } from "next/navigation";

const PAGE_SIZE = 10;

const page = async ({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const params = (await searchParams) ?? {};
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const currentPage = Math.max(1, Number(rawPage) || 1);
  const skip = (currentPage - 1) * PAGE_SIZE;
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const where = isElevatedRole(dbUser?.role) ? {} : { ownerId: session.user.id };
  const [items, totalCount] = await prisma.$transaction([
    prisma.content.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.content.count({ where }),
  ]);
  return (
    <ContentPage
      items={items as ContentItem[]}
      currentPage={currentPage}
      totalPages={Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
    />
  );
};

export default page;
