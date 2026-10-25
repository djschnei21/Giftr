import { Logo } from "@/components/logo";
import { MainNav } from "@/components/app/nav";
import { UserMenu } from "@/components/app/user-menu";
import type { CurrentUser } from "@/lib/authz";

export function AppHeader({ user }: { user: CurrentUser }) {
  return (
    <header className="pointer-events-none sticky top-0 z-40 px-4 pt-4 sm:pt-6">
      <div className="glass pointer-events-auto mx-auto flex w-max max-w-full items-center gap-4 rounded-full p-1 pl-4">
        <Logo />
        <MainNav />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
