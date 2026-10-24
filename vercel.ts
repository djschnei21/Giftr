import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "nextjs",
  buildCommand: "pnpm build",
  installCommand: "pnpm install",
  crons: [{ path: "/api/cron/daily", schedule: "0 14 * * *" }],
};
