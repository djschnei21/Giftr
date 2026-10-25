import Link from "next/link";
import { Logo } from "@/components/logo";
import { Snowfall } from "@/components/festive";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="relative isolate flex flex-1 flex-col">
      <Snowfall count={36} seed={31} className="-z-10" />
      <div className="mx-auto grid w-full max-w-lg flex-1 content-center gap-12 px-4 py-16">
        <Logo className="justify-center" />
        <EmptyState
          title="Nothing under this tree"
          description="This page doesn't exist, or you don't have access to it. If someone sent you a link, ask them to check it."
          action={
            <Button asChild>
              <Link href="/events">Go to my exchanges</Link>
            </Button>
          }
        />
      </div>
    </main>
  );
}
