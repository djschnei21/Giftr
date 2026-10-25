import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, contactEmail } from "@/components/legal-page";

export const metadata: Metadata = { title: "Terms of service" };

export default function TermsPage() {
  const contact = contactEmail();
  return (
    <LegalPage title="Terms of service" updated="October 24, 2026">
      <p>
        These terms cover your use of Giftr. By creating an account or joining an exchange, you agree to them. If you
        don&apos;t agree, please don&apos;t use Giftr.
      </p>

      <h2>Using Giftr</h2>
      <ul>
        <li>You need to be at least 13 years old (or the minimum age in your country) to create an account.</li>
        <li>Keep your sign-in secure. You&apos;re responsible for what happens under your account.</li>
        <li>Only invite people who&apos;d expect to hear from you, and only add details you have the right to share.</li>
        <li>Don&apos;t use Giftr to harass anyone, send spam, or break the law, including through anonymous messages.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        You own what you add: wishlists, preferences, messages and so on. You give us permission to store it and show it
        to the people it&apos;s meant for, only so we can run the service. You can delete it at any time; see the{" "}
        <Link href="/privacy#delete">privacy policy</Link>.
      </p>

      <h2>Gifts and links</h2>
      <p>
        Giftr organizes exchanges; it doesn&apos;t sell, buy, or deliver gifts. Product links on wishlists point to other
        websites, which have their own terms. Pictures from links may be out of date.
      </p>

      <h2>Organizers</h2>
      <p>
        Organizers can invite and remove people, set rules, and draw or redraw names. Please use these powers kindly. We
        may remove exchanges or accounts that break these terms.
      </p>

      <h2>No warranty</h2>
      <p>
        Giftr is provided as is. We work hard to keep it running and to keep every draw secret and fair, but we can&apos;t
        promise it will always be available or error-free. To the extent the law allows, we aren&apos;t liable for indirect
        or consequential losses, or for anyone&apos;s taste in gifts.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. If a change is significant, we&apos;ll update the date above and let account holders
        know. Continuing to use Giftr after a change means you accept the new terms.
      </p>

      <h2>Contact</h2>
      <p>
        {contact ? (
          <>
            Questions about these terms? Email <a href={`mailto:${contact}`}>{contact}</a>.
          </>
        ) : (
          "Questions about these terms? Get in touch with the person who runs this Giftr site."
        )}
      </p>
    </LegalPage>
  );
}
