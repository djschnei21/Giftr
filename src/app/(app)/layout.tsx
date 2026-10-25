import { AppHeader } from "@/components/app/app-header";
import { MobileNav } from "@/components/app/nav";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/authz";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  if (!user.name.trim()) redirect("/welcome");
  return (
    <div className="flex min-h-dvh min-w-0 flex-col">
      <AppHeader user={user} />
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
