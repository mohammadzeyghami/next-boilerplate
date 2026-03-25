import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutDashboard } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ContentForm } from "@/modules/content/components/content-form";
import { ContentList } from "@/modules/content/components/content-list";
import { buttonVariants } from "@/share-components/atoms/button/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Content",
};

export default async function ContentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const items = await prisma.content.findMany({
    // @ts-ignore
    where: session.user?.role === "ADMIN" ? {} : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-2 font-medium",
            )}
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Your content
          </h1>
          <p className="text-muted-foreground text-sm">
            Create and manage text content tied to your account.
          </p>
        </div>

        <ContentForm />

        <section className="space-y-3">
          <h2 className="font-medium text-sm tracking-tight">All items</h2>
          <ContentList items={items} variant="manage" />
        </section>

        <p className="text-center text-muted-foreground text-xs">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← Back to landing
          </Link>
        </p>
      </main>
    </div>
  );
}
