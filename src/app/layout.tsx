import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Manrope, Mountains_of_Christmas } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FESTIVITY_BOOT_SCRIPT } from "@/components/festivity";
import { FestivityProvider } from "@/components/festivity-provider";
import { Snowfall, StringLights } from "@/components/festive";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { appUrl } from "@/lib/utils";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["SOFT", "WONK", "opsz"] });
const christmas = Mountains_of_Christmas({ variable: "--font-christmas", subsets: ["latin"], weight: "700" });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "Giftr · Secret Santa, simplified", template: "%s · Giftr" },
  description:
    "Run a Secret Santa in minutes. Invite everyone with one link, share wishlists, set the rules and let Giftr draw the names. No ads, no spreadsheets.",
  applicationName: "Giftr",
  openGraph: { siteName: "Giftr", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf4e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1b16" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-festivity="high"
      suppressHydrationWarning
      className={`${manrope.variable} ${geistMono.variable} ${fraunces.variable} ${christmas.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: FESTIVITY_BOOT_SCRIPT }} />
      </head>
      <body className="flex min-h-full min-w-0 flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <FestivityProvider>
            <Snowfall count={44} seed={31} className="fixed! -z-10" />
            <StringLights />
            <a
              href="#main"
              className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
            >
              Skip to content
            </a>
            {children}
            <Toaster />
          </FestivityProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
