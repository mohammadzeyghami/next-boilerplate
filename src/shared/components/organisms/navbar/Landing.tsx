"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LayoutDashboard } from "lucide-react";

import { siteName } from "@/config/site";
import { cn } from "@/lib/utils";
import { LoginRequiredModal } from "@/modules/auth";
import { useAuthSessionQuery } from "@/modules/auth/api/queries";
import { useLogoutMutation } from "@/modules/auth/api/mutations";
import { Badge } from "@/shared/components/atoms/badge/Badge";
import { buttonVariants } from "@/shared/components/atoms/button/button-variants";
import { ThemeToggle } from "@/shared/components/molecules/theme-toggle/ThemeToggle";
import UserMenu from "@/shared/components/molecules/userMenu/default";

function userInitials(
  name: string | null | undefined,
  email: string | null | undefined,
) {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  const e = (email ?? "").trim();
  if (e.length >= 2) return e.slice(0, 2).toUpperCase();
  return "?";
}

const NavbarLanding = () => {
  const router = useRouter();
  const { data: session } = useAuthSessionQuery();
  const logoutMutation = useLogoutMutation();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const isLoggedIn = Boolean(session?.user?.id);
  const displayName =
    session?.user?.name?.trim() || session?.user?.email || "Account";
  const initials = userInitials(session?.user?.name, session?.user?.email);
  const avatarSrc = session?.user?.image?.trim() || "";

  function onDashboardClick() {
    if (isLoggedIn) {
      router.push("/dashboard");
      return;
    }
    setLoginModalOpen(true);
  }

  async function onLogout() {
    await logoutMutation.mutateAsync();
    router.refresh();
  }

  return (
    <>
      <LoginRequiredModal
        open={loginModalOpen}
        onOpenChange={setLoginModalOpen}
      />
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-4" aria-hidden />
            </span>
            <span>{siteName}</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            {!isLoggedIn ? (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "hidden sm:inline-flex",
                  )}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
                >
                  Register
                </Link>
              </>
            ) : (
              <UserMenu
                avatarSrc={avatarSrc}
                displayName={displayName}
                email={session?.user?.email ?? undefined}
                initials={initials}
                onLogout={onLogout}
              />
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default NavbarLanding;
