# Giftr

A calm, mobile-first Secret Santa app. Invite people with one link, share wishlists, set the rules, and let Giftr draw names. Everyone finds out who they're shopping for, and nobody else does.

- **One-tap joining.** Invite links preview the exchange (with a rich card in iMessage, WhatsApp and Slack), then "Continue with Google / Facebook / email".
- **A smarter draw.** Households, one-way exclusions, "no two-person swaps" and "one big loop". If a draw is impossible, Giftr says why.
- **Painless changes.** Late joiners and dropouts are patched into the chain, so only one person's match changes.
- **Real secrecy.** Organizers see totals ("7 of 10 have opened their match") unless they turn on match viewing, and everyone can see when it's on.
- **Anonymous questions.** Santas can message their giftee without revealing who they are. Plus gift-preference profiles, shipping addresses for shipped exchanges, and a private "bought it" tracker.
- **Reminders that don't nag.** A daily job runs scheduled draws, wraps up finished exchanges and sends de-duplicated reminders, with one-click unsubscribe.

## Stack

Next.js 16 (App Router, Server Actions, `src/proxy.ts`), React 19, TypeScript, Tailwind CSS v4 and shadcn/ui, Better Auth (Google, Facebook, email sign-in links), Postgres with Drizzle ORM, Resend with React Email, and Vercel Cron. Tests use Vitest with fast-check (including property-based tests of the draw engine) and Playwright.

## Local development

You need Node 22+, pnpm, and Docker (or any Postgres 16+).

```bash
pnpm install
docker compose up -d          # Postgres with `giftr` and `giftr_test` databases
cp .env.example .env.local    # then set BETTER_AUTH_SECRET: openssl rand -base64 32
pnpm db:migrate
pnpm db:seed                  # optional: demo users and an exchange
pnpm dev
```

Open http://localhost:3000. Without `RESEND_API_KEY`, emails aren't sent. Instead they appear at http://localhost:3000/dev/outbox, so you can sign in as anyone (seeded users are `alice@example.com`, `ben@example.com`, `chloe@example.com`, `dev@example.com` and `emma@example.com`) by requesting a sign-in link and opening it from the outbox. Google and Facebook buttons appear once their credentials are set.

### Checks

```bash
pnpm lint
pnpm typecheck
pnpm test                     # unit and property-based tests
pnpm build && pnpm test:e2e   # end-to-end tests against the giftr_test database
```

The end-to-end suite walks four people through a whole exchange (create, invite by email and link, join, wishlists, a household and an exclusion, the draw, each reveal, and the anonymous chat), checks that the organizer can't see pairings and that Santas stay anonymous in the UI, the database and emails, and runs axe accessibility checks along the way.

`WALKTHROUGH=1 pnpm test:e2e walkthrough` records a desktop and a phone walkthrough to `test-results/walkthrough/`.

### Useful scripts

| Command | What it does |
| --- | --- |
| `pnpm db:generate` | Create a migration after changing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations (uses `DATABASE_URL_UNPOOLED` when set) |
| `pnpm db:studio` | Browse the database with Drizzle Studio |

To run the daily job locally: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily`.

## Deploying to Vercel

1. **Import the repo** at [vercel.com/new](https://vercel.com/new). `vercel.ts` sets the build command (`pnpm db:migrate && pnpm build`, so every deploy applies pending migrations) and the daily cron.
2. **Add Neon** from the Vercel Marketplace (Storage → Neon Postgres) and connect it to the project. It sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. Turn on "Create a database branch for each preview deployment" so previews never touch production data.
3. **Add Resend** from the Marketplace (or create an API key at [resend.com](https://resend.com)) and set `RESEND_API_KEY`. In Resend, verify the domain you'll send from, then set `EMAIL_FROM`, for example `Giftr <hello@yourdomain.com>`. Until a domain is verified, Resend only delivers to your own address.
4. **Set the remaining environment variables** (Settings → Environment Variables):

   | Variable | Environments | Value |
   | --- | --- | --- |
   | `BETTER_AUTH_SECRET` | All | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | Production only | `https://yourdomain.com` |
   | `NEXT_PUBLIC_APP_URL` | Production only | `https://yourdomain.com` |
   | `CRON_SECRET` | All | `openssl rand -hex 32` (Vercel Cron sends it automatically) |
   | `CONTACT_EMAIL` | All | Shown on the privacy and terms pages |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Production | See below |
   | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` | Production | See below |

   Leave `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` unset for previews; they use their own deployment URL automatically.
5. **Deploy**, then smoke test: open the site, sign in with an email link, create an exchange, and check that the invite email arrives. In the project's Cron Jobs tab you can trigger `/api/cron/daily` manually.

Optionally add a custom domain under Settings → Domains and use it everywhere `yourdomain.com` appears above.

### Google sign-in

1. In the [Google Cloud console](https://console.cloud.google.com/), create or pick a project.
2. Under **APIs & Services → OAuth consent screen**, choose "External", fill in the app name, support email, your domain, and the links `https://yourdomain.com/privacy` and `https://yourdomain.com/terms`. The `email`, `profile` and `openid` scopes are all Giftr needs. Publish the app when you're ready for anyone to sign in.
3. Under **Credentials → Create credentials → OAuth client ID**, choose "Web application" and add:
   - Authorized JavaScript origin: `https://yourdomain.com` (and `http://localhost:3000` for local testing)
   - Authorized redirect URI: `https://yourdomain.com/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google`)
4. Copy the client ID and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

### Facebook sign-in

1. At [developers.facebook.com](https://developers.facebook.com/apps), create an app with the "Authenticate and request data from users with Facebook Login" use case.
2. In **Use cases → Facebook Login → Settings**, add the valid OAuth redirect URI `https://yourdomain.com/api/auth/callback/facebook`. Make sure the `email` permission is enabled.
3. In **App settings → Basic**, set the app domain to `yourdomain.com`, the privacy policy URL to `https://yourdomain.com/privacy`, the terms URL to `https://yourdomain.com/terms`, and the user data deletion instructions URL to `https://yourdomain.com/privacy#delete`.
4. Copy the App ID and App Secret into `FACEBOOK_CLIENT_ID` and `FACEBOOK_CLIENT_SECRET`, then switch the app to **Live**.

Accounts are linked by email, so someone invited by email who later signs in with Google or Facebook lands in the same account.

### Preview deployments

Google and Facebook only redirect to registered URLs, so on preview deployments use email sign-in links. Previews need `RESEND_API_KEY` to send them; the dev outbox is disabled on every Vercel deployment because it would expose working sign-in links.

## Project layout

```
src/
  app/              (marketing)/ (auth)/ (app)/ join/[code]/ unsubscribe/ api/ dev/outbox/
  components/       app components; ui/ holds the shadcn primitives
  db/               schema.ts, index.ts, seed.ts
  emails/           React Email templates
  lib/              auth, authz, draw/ (the draw engine), email/, link-preview, validation
  server/           server-only queries and Server Actions
  proxy.ts          keeps signed-out visitors out of app pages
e2e/                Playwright tests
drizzle/            SQL migrations
vercel.ts           build command and cron
```
