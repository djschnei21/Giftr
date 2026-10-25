import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, contactEmail } from "@/components/legal-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  const contact = contactEmail();
  return (
    <LegalPage title="Privacy policy" updated="October 24, 2026">
      <p>
        Giftr helps groups run Secret Santa gift exchanges. This page explains what we collect, why, and how to delete it.
        The short version: we collect only what the app needs to work, we never sell it, and there are no ads.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account details</strong>: your name, email address and profile picture. If you sign in with Google or
          Facebook, we receive only these basic profile fields, never your contacts, posts or friends list.
        </li>
        <li>
          <strong>What you add</strong>: exchanges you create or join, wishlists, gift preferences and sizes, your shipping
          address (only if you enter one), private gift notes, and anonymous messages.
        </li>
        <li>
          <strong>Technical data</strong>: sign-in sessions (including IP address and browser type, for security) and
          anonymous, cookie-free usage and performance analytics.
        </li>
      </ul>

      <h2>Who can see what</h2>
      <ul>
        <li>People in an exchange see each other&apos;s names, and your Santa sees the wishlist you choose to share and your gift preferences.</li>
        <li>Your shipping address is shown only to your Secret Santa, and only in exchanges where gifts are shipped.</li>
        <li>
          Who drew whom is visible only to each giver. The organizer can see matches only if they turn that setting on,
          and the exchange page tells everyone when it&apos;s on.
        </li>
        <li>Anonymous messages never reveal the Santa&apos;s identity to their giftee, not in the app and not in emails.</li>
      </ul>

      <h2>Service providers</h2>
      <p>
        We use a few providers to run Giftr: Vercel (hosting and analytics), Neon (database), Resend (email delivery), and
        Google and Facebook (only if you choose them to sign in). They process data on our behalf and only to provide
        their service.
      </p>

      <h2>Emails</h2>
      <p>
        We email you about invitations, draws and changes to your match. Reminders and message notifications are
        optional. Every one has a one click unsubscribe link, and you can change them on your{" "}
        <Link href="/profile#notifications">profile</Link>.
      </p>

      <h2>Cookies</h2>
      <p>We use one essential cookie to keep you signed in. We don&apos;t use advertising or tracking cookies.</p>

      <h2 id="delete" className="scroll-mt-24">
        Deleting your data
      </h2>
      <p>
        You can delete your account at any time: sign in, open <Link href="/profile#delete-account">your profile</Link>,
        and choose <strong>Delete account</strong>. This permanently removes your account, sign-in connections, profile,
        wishlists, and any exchanges you organize. In other people&apos;s exchanges you&apos;re removed from the draw,
        and the chain is patched so the rest of the group can carry on.
      </p>
      <p>
        If you signed in with Facebook and can no longer sign in, or you&apos;d like us to delete your data for you,{" "}
        {contact ? <a href={`mailto:${contact}`}>email {contact}</a> : "contact us"} from the address on your account and
        we&apos;ll delete it within 30 days. You can also remove Giftr from your Facebook settings under Apps and Websites.
      </p>

      <h2>Changes and contact</h2>
      <p>
        If we change this policy in a meaningful way, we&apos;ll update the date above and let account holders know by email.
        Questions? {contact ? <a href={`mailto:${contact}`}>{contact}</a> : "Get in touch with the person who runs this Giftr site."}
      </p>
    </LegalPage>
  );
}
