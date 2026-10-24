import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { emailLog } from "@/db/schema";
import { devOutboxEnabled } from "@/lib/email";
import { formatDistanceToNow } from "date-fns";

export const metadata = { title: "Dev outbox", robots: { index: false } };

export default async function DevOutboxPage() {
  if (!devOutboxEnabled()) notFound();
  const emails = await db
    .select()
    .from(emailLog)
    .where(eq(emailLog.provider, "dev"))
    .orderBy(desc(emailLog.createdAt))
    .limit(30);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">Dev outbox</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Emails sent while no RESEND_API_KEY is configured. Newest first. Only available outside production.
      </p>
      <div className="mt-8 grid gap-6">
        {emails.length === 0 ? <p className="text-muted-foreground">Nothing yet.</p> : null}
        {emails.map((e) => {
          const links = [...(e.html ?? "").matchAll(/href="([^"]+)"/g)]
            .map((m) => m[1].replaceAll("&amp;", "&"))
            .filter((href) => href.includes("/api/auth/") || href.includes("/join/") || href.includes("/events/"));
          return (
            <article key={e.id} className="overflow-hidden rounded-2xl border bg-card">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b px-5 py-3">
                <div>
                  <p className="font-medium">{e.subject}</p>
                  <p className="text-sm text-muted-foreground">to {e.toEmail}</p>
                </div>
                <time className="text-xs text-muted-foreground">
                  {formatDistanceToNow(e.createdAt, { addSuffix: true })}
                </time>
              </header>
              {links[0] ? (
                <div className="border-b bg-accent/40 px-5 py-2 text-sm">
                  <a className="font-medium text-primary underline" href={links[0]} data-testid="outbox-link">
                    Open link →
                  </a>
                </div>
              ) : null}
              <iframe title={e.subject} srcDoc={e.html ?? ""} className="h-80 w-full bg-[#f7f4ee]" sandbox="" />
            </article>
          );
        })}
      </div>
    </main>
  );
}
