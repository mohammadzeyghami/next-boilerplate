"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LayoutDashboard, Search } from "lucide-react";

import { siteName } from "@/config/site";
import { cn } from "@/lib/utils";
import { useAuthSessionQuery } from "@/modules/auth/api/queries";
import { useLogoutMutation } from "@/modules/auth/api/mutations";
import { Button } from "../../atoms/button/Button";
import { buttonVariants } from "../../atoms/button/button-variants";
import { Separator } from "../../atoms/separator";
import { Input } from "../../molecules/inputs/Default";
import { ThemeToggle } from "../../molecules/theme-toggle/ThemeToggle";
import UserMenu from "../../molecules/userMenu/default";

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

const NavbarDashboard = () => {
  const router = useRouter();
  const { data: session } = useAuthSessionQuery();
  const logoutMutation = useLogoutMutation();
  const isLoggedIn = Boolean(session?.user?.id);
  const displayName =
    session?.user?.name?.trim() || session?.user?.email || "Account";
  const initials = userInitials(session?.user?.name, session?.user?.email);
  const avatarSrc = session?.user?.image?.trim() || "";

  async function onLogout() {
    await logoutMutation.mutateAsync();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="flex h-14 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">{siteName}</span>
        </Link>
        <Separator orientation="vertical" className="hidden h-6 sm:block" />

        <div className="relative max-w-md flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search…"
            className="h-9 pl-9"
            aria-label="Search"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon-sm" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>

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
        </div>
      </div>
    </header>
  );
};

export default NavbarDashboard;
