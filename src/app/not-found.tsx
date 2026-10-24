import Link from "next/link";
import { GiftIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { EmptyState } from "@/components/app/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto grid w-full max-w-lg flex-1 content-center gap-10 px-4 py-16">
      <Logo className="justify-center" />
      <EmptyState
        icon={<GiftIcon />}
        title="Nothing under this tree"
        description="This page doesn't exist, or you don't have access to it. If someone sent you a link, ask them to check it."
        action={
          <Button asChild>
            <Link href="/events">Go to my exchanges</Link>
          </Button>
        }
      />
    </main>
  );
}
