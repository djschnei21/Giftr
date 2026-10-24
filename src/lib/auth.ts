import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins/magic-link";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { magicLinkEmail } from "@/emails/templates";
import { sendEmail } from "@/lib/email";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET, prompt: "select_account" as const }
    : undefined;

const facebook =
  process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
    ? { clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET }
    : undefined;

export const enabledSocialProviders = {
  google: Boolean(google),
  facebook: Boolean(facebook),
};

const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);

export const auth = betterAuth({
  appName: "Giftr",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  trustedOrigins: vercelOrigins,
  socialProviders: {
    ...(google ? { google } : {}),
    ...(facebook ? { facebook } : {}),
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "facebook"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === "production" && process.env.GIFTR_DEV_OUTBOX !== "1",
    storage: "database",
    modelName: "rateLimit",
  },
  databaseHooks: {
    user: {
      create: {
        after: async (created) => {
          await db.insert(schema.profile).values({ userId: created.id }).onConflictDoNothing();
          await db.insert(schema.wishlist).values({ ownerId: created.id, name: "My wishlist", isDefault: true });
        },
      },
    },
  },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({ to: email, content: magicLinkEmail(url), kind: "magic_link" });
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
