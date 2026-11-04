import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { COMPANY, SITE_NAME, SITE_URL } from "@/lib/product";
import { localModeRequested } from "@/lib/localMode";
import Telemetry from "@/components/Telemetry";

// 2026-11-04: no build-time font fetch. Vercel's build failed twice inside next/font's Google loader (null match for
// JetBrains Mono, then Space Grotesk). The site's primary faces are the self-hosted "PLP …" @font-face files; the Google
// families are secondary and now load at runtime via <link> below, so a Google outage can never fail a deploy again.
const GOOGLE_FONTS_CSS = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Driver's permit practice test by state — PassLearnersPermit", template: "%s · PassLearnersPermit" },
  description: "Learner's permit written-test practice built from your state's official driver handbook: lessons, flashcards, quizzes and chapter practice tests. Chapter 1 free in every state; full state course $9.99 for one year.",
  applicationName: SITE_NAME,
  authors: [{ name: COMPANY }],
  publisher: COMPANY,
  robots: { index: true, follow: true },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", url: SITE_URL },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const document = (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={GOOGLE_FONTS_CSS} />
      </head>
      <body>
        <Telemetry />
        <SiteHeader />
        <main className="wrap">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
  if (localModeRequested()) return document;
  const { ClerkProvider } = await import("@clerk/nextjs");
  return <ClerkProvider>{document}</ClerkProvider>;
}
