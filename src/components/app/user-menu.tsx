"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOutIcon, MonitorIcon, MoonIcon, SunIcon, UserRoundIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { UserAvatar } from "@/components/ui/avatar";
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
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="cursor-pointer rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        aria-label="Account menu"
      >
        <UserAvatar name={user.name} image={user.image} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRoundIcon /> Profile & preferences
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-1 px-2.5 py-1.5">
          <span className="text-sm">Theme</span>
          <div className="flex rounded-full bg-secondary p-0.5">
            {(
              [
                ["light", SunIcon],
                ["system", MonitorIcon],
                ["dark", MoonIcon],
              ] as const
            ).map(([value, Icon]) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} theme`}
                aria-pressed={theme === value}
                onClick={() => setTheme(value)}
                className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-sm"
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await authClient.signOut();
            router.push("/");
            router.refresh();
          }}
        >
          <LogOutIcon /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
