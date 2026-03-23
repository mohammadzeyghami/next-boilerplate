"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

import { buttonVariants } from "@/share-components/atoms/button/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/share-components/molecules/card/Card";
import { Badge } from "@/share-components/atoms/badge/Badge";
import { Separator } from "@/share-components/atoms/separator/Separator";
import { siteName } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAuthSessionQuery } from "@/modules/auth/api/queries";
import { LoginRequiredModal } from "@/modules/auth";
import NavbarLanding from "@/share-components/organisms/navbar/Landing";

const features = [
  {
    icon: Zap,
    title: "Fast by default",
    description:
      "App Router, optimized bundles, and a stack tuned for shipping real products.",
  },
  {
    icon: Shield,
    title: "Solid foundations",
    description:
      "TypeScript, ESLint, and accessible UI primitives you can extend safely.",
  },
  {
    icon: Sparkles,
    title: "shadcn UI",
    description:
      "Composable components with Base UI and Tailwind — copy, tweak, own the code.",
  },
] as const;

type LandingViewProps = {
  /** Server-rendered slot (e.g. public content feed). */
  children?: ReactNode;
};

export function LandingView({ children }: LandingViewProps) {
  const router = useRouter();
  const { data: session } = useAuthSessionQuery();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const isLoggedIn = Boolean(session?.user?.id);

  function onDashboardClick() {
    if (isLoggedIn) {
      router.push("/dashboard");
      return;
    }
    setLoginModalOpen(true);
  }

  return (
    <div className="flex min-h-full flex-col">
      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
      <NavbarLanding />

      <main className="flex flex-1 flex-col">
        <section className="border-b bg-linear-to-b from-muted/40 to-background px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Badge className="mb-4" variant="secondary">
              Production-ready starter
            </Badge>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              Build your product on a clean Next.js &amp; shadcn stack
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground text-balance sm:text-lg">
              Landing for marketing, dashboard for app chrome — both wired with
              the same design tokens and UI kit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={onDashboardClick}
                className={cn(buttonVariants({ size: "lg" }), "gap-2 px-6")}
              >
                Open dashboard
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              What you get
            </h2>
            <p className="mt-2 text-muted-foreground text-sm sm:text-base">
              Three pillars this boilerplate is built around.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-foreground" aria-hidden />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground text-xs">
                    Extend in{" "}
                    <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.7rem]">
                      src/share-components
                    </code>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {children}
      </main>

      <footer className="mt-auto border-t py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-center text-muted-foreground text-sm sm:flex-row sm:px-6 sm:text-left">
          <p>
            © {new Date().getFullYear()} {siteName}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hover:text-foreground">
              Dashboard
            </Link>
            <Separator orientation="vertical" className="hidden h-4 sm:block" />
            <span className="hidden sm:inline">
              Yarn · TypeScript · Tailwind v4
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
