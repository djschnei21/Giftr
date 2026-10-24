import { Logo } from "@/components/logo";
import { MainNav, MobileNav } from "@/components/app/nav";
import { UserMenu } from "@/components/app/user-menu";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  if (!user.name.trim()) redirect("/welcome");
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-6 px-4 sm:px-6">
          <Logo href="/events" />
          <MainNav />
          <div className="ml-auto">
            <UserMenu user={user} />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 sm:px-6 sm:pt-8 sm:pb-16">{children}</main>
      <MobileNav />
    </div>
  );
}
