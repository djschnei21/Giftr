import { Logo } from "@/components/logo";
import { MainNav, MobileNav } from "@/components/app/nav";
import { UserMenu } from "@/components/app/user-menu";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  if (!user.name.trim()) redirect("/welcome");
  return (
    <div className="flex min-h-dvh min-w-0 flex-col">
      <header className="pointer-events-none sticky top-0 z-40 px-4 pt-4 sm:pt-6">
        <div className="glass pointer-events-auto mx-auto flex w-max max-w-full items-center gap-4 rounded-full p-1 pl-4">
          <Logo href="/events" />
          <MainNav />
          <UserMenu user={user} />
        </div>
      </header>
      <main
        id="main"
        className="page-enter mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 pt-8 pb-nav sm:px-6 sm:pt-12 sm:pb-24"
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
