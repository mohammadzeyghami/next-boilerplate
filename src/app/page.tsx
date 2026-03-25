import { LandingView } from "@/shared/components/organisms/landing-view/LandingView";
import { ContentList } from "@/modules/content/components/content-list";
import { prisma } from "@/lib/prisma";

function authorLabel(name: string | null, email: string) {
  if (name?.trim()) return name.trim();
  const local = email.split("@")[0];
  return local || "Member";
}

export default async function Home() {
  const rows = await prisma.content.findMany({
    where: {
      access: "PUBLIC",
    },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true, email: true } },
    },
  });

  const items = rows.map((c) => ({
    id: c.id,
    name: c.name,
    text: c.text,
    createdAt: c.createdAt,
    contentUrl: c.contentUrl,
    type: c.type,
    access: c.access,
    isEarnable: c.isEarnable,
    authorLabel: authorLabel(c.owner.name, c.owner.email),
  }));

  return (
    <LandingView>
      <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Community posts
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Anyone can read these.{" "}
              <span className="text-foreground/90">
                Sign in and open the dashboard to add or remove your own.
              </span>
            </p>
          </div>

          <ContentList items={items} variant="public" />
        </div>
      </section>
    </LandingView>
  );
}
