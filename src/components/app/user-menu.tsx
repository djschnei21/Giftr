"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SignOutIcon, UserIcon } from "@/components/icons";
import { authClient } from "@/lib/auth-client";
import { UserAvatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/misc";

export function UserMenu({ user }: { user: { name: string; email: string; image: string | null } }) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="cursor-pointer rounded-full transition outline-none focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.98]"
        aria-label="Account menu"
      >
        <UserAvatar name={user.name} image={user.image} className="rounded-full ring-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="w-64">
        <DropdownMenuLabel>
          <p className="truncate font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon /> Profile & preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="grid gap-2 px-3 py-2">
          <span className="text-xs font-semibold text-muted-foreground">Appearance</span>
          <ThemeToggle className="w-full" />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          <SignOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
