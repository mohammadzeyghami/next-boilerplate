import { cn } from "@/lib/utils";
import {

  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from  "@/shared/components/molecules/tooltip";
import { Button } from "@/shared/components/atoms/button";
import { UserIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/components/molecules/dropdown-menu";
import {
  BellIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
} from "lucide-react";
import * as React from "react";
import { SidebarTrigger } from "../sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "../../atoms/avatar/Avatar";
import { NavigationMenu, NavigationMenuList } from "../../molecules/navigation-menu";

type WithChildren<T = unknown> = T & { children?: React.ReactNode };

/**
 * NavbarShell
 * Sticky, translucent top bar with flexible slots:
 * <NavbarShell>
 *   <NavbarShell.Left>...</NavbarShell.Left>
 *   <NavbarShell.Center>...</NavbarShell.Center>
 *   <NavbarShell.Right>...</NavbarShell.Right>
 * </NavbarShell>
 */
function NavbarShell({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="navbar-shell"
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60",
        className
      )}
      role="navigation"
    >
      <div className="mx-auto flex h-14 w-full items-center gap-2 px-3">
        {children}
      </div>
    </div>
  );
}

/* Zones -------------------------------------------------------------------- */

function NavbarShellLeft({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="navbar-left"
      className={cn("flex min-w-0 items-center gap-2", className)}
    >
      {children}
    </div>
  );
}

function NavbarShellCenter({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="navbar-center"
      className={cn(
        "mx-auto hidden min-w-0 flex-1 items-center justify-center md:flex",
        className
      )}
    >
      {children}
    </div>
  );
}

function NavbarShellRight({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  return (
    <div
      data-slot="navbar-right"
      className={cn("ml-auto flex items-center gap-1.5", className)}
    >
      {children}
    </div>
  );
}

/* Brand -------------------------------------------------------------------- */

function NavbarShellBrand({
  className,
  logo,
  name,
  href = "/",
}: {
  className?: string;
  logo?: React.ReactNode;
  name?: React.ReactNode;
  href?: string;
}) {
  return (
    <a
      data-slot="navbar-brand"
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-1 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      {logo ? <span className="shrink-0">{logo}</span> : null}
      {name ? <span className="truncate">{name}</span> : null}
    </a>
  );
}

/* Sidebar burger (mobile) -------------------------------------------------- */

function NavbarShellSidebarButton({ className }: { className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className={cn("md:hidden", className)}
            aria-label="Open sidebar"
          >
            <MenuIcon className="size-4" />
          </Button>
        </SidebarTrigger>
      </TooltipTrigger>
      <TooltipContent>Menu</TooltipContent>
    </Tooltip>
  );
}

/* Command palette trigger (headless) -------------------------------------- */

function NavbarShellCommandButton({
  className,
  onClick,
  label = "Search",
}: {
  className?: string;
  onClick?: () => void;
  label?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={cn("hidden items-center gap-2 md:inline-flex", className)}
          onClick={onClick}
        >
          <SearchIcon className="size-4" />
          <span>{label}</span>
          <kbd className="ml-1 hidden rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/* Notifications button (optional) ----------------------------------------- */

function NavbarShellNotificationsButton({
  className,
  onClick,
  ariaLabel = "Notifications",
}: {
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className={cn("relative", className)}
          aria-label={ariaLabel}
          onClick={onClick}
        >
          <BellIcon className="size-4" />
          {/* unread dot */}
          <span className="absolute right-1 top-1 inline-flex h-2 w-2 rounded-full bg-primary" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{ariaLabel}</TooltipContent>
    </Tooltip>
  );
}

/* User menu --------------------------------------------------------------- */

function NavbarShellUserMenu({
  className,
  name,
  email,
  avatarUrl,
  onProfile,
  onSettings,
  onLogout,
}: {
  className?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  onProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={cn("inline-flex items-center gap-2", className)}
        >
          <Avatar className="size-5">
            <AvatarImage src={avatarUrl} alt={name || "User"} />
            <AvatarFallback>
              <UserIcon className="size-4" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate sm:inline">
            {name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <div className="truncate font-medium text-foreground">
            {name || "Signed in"}
          </div>
          <div className="truncate">{email}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfile}>
          <UserIcon className="mr-2 size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSettings}>
          <SettingsIcon className="mr-2 size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOutIcon className="mr-2 size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* Center navigation (uses your NavigationMenu) ---------------------------- */

function NavbarShellNav({
  className,
  children,
}: WithChildren<{ className?: string }>) {
  // You can pass <NavigationMenuItem> etc. as children
  return (
    <NavigationMenu className={cn("hidden md:flex", className)}>
      <NavigationMenuList>{children}</NavigationMenuList>
    </NavigationMenu>
  );
}

/* Compound API ------------------------------------------------------------ */

NavbarShell.Left = NavbarShellLeft;
NavbarShell.Center = NavbarShellCenter;
NavbarShell.Right = NavbarShellRight;

NavbarShell.Brand = NavbarShellBrand;
NavbarShell.SidebarButton = NavbarShellSidebarButton;
NavbarShell.CommandButton = NavbarShellCommandButton;
NavbarShell.NotificationsButton = NavbarShellNotificationsButton;
NavbarShell.UserMenu = NavbarShellUserMenu;
NavbarShell.Nav = NavbarShellNav;

export { NavbarShell };
