"use client";

import { useRouter } from "next/navigation";
import { CreditCard, LayoutDashboard, LogOut, Settings } from "lucide-react";

import { avatarImageReferrerPolicy } from "@/lib/avatar-referrer-policy";
import { cn } from "@/lib/utils";
import { buttonVariants } from "../../atoms/button/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/molecules/dropdown-menu/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../../atoms/avatar/Avatar";
// import { Avatar, AvatarFallback, AvatarImage } from "../../atoms/avatar/Avatar";

interface UserMenuProps {
  avatarSrc?: string;
  displayName: string;
  /** Shown under the name inside the menu (optional). */
  email?: string;
  initials: string;
  onLogout: () => Promise<void> | void;
  dashboardHref?: string;
  settingsHref?: string;
}

function UserMenu({
  avatarSrc,
  displayName,
  email,
  initials,
  onLogout,
  dashboardHref = "/dashboard",
  settingsHref = "/dashboard",
}: UserMenuProps) {
  const router = useRouter();

  function renderAvatar() {
    return (
      <Avatar>
        {avatarSrc ? (
          <AvatarImage
            src={avatarSrc}
            alt={displayName}
            referrerPolicy={avatarImageReferrerPolicy(avatarSrc)}
          />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2 rounded-full px-1.5",
        )}
      >
        {renderAvatar()}

        <span className="hidden max-w-28 truncate sm:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56 w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              {renderAvatar()}
              <div className="grid min-w-0 flex-1 leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                {email ? (
                  <span className="truncate text-muted-foreground text-xs">
                    {email}
                  </span>
                ) : null}
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => router.push(dashboardHref)}>
          <LayoutDashboard className="size-4" />
          Dashboard
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => router.push(settingsHref)}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuItem disabled>
          <CreditCard className="size-4" />
          Billing
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={() => void onLogout()}>
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
