export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 pt-12 pb-24 sm:px-6 sm:pt-16">
      <header className="mb-12 grid gap-2">
        <h1 className="font-display text-4xl sm:text-5xl">{title}</h1>
        <p className="text-sm font-medium text-muted-foreground">Last updated {updated}</p>
      </header>
      <div className="grid gap-6 leading-relaxed [&_a]:font-semibold [&_a]:text-accent-foreground [&_a]:underline [&_a]:decoration-current/30 [&_a]:underline-offset-4 hover:[&_a]:decoration-current [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_li]:ml-6 [&_li]:list-disc [&_li]:marker:text-primary [&_ul]:grid [&_ul]:gap-2">
        {children}
      </div>
    </article>
  );
}

export function contactEmail() {
  return process.env.CONTACT_EMAIL || null;
}
