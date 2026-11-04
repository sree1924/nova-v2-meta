import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { COMPANY, SITE_NAME, SITE_URL } from "@/lib/product";
import { localModeRequested } from "@/lib/localMode";
import Telemetry from "@/components/Telemetry";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

// 2026-11-04: JetBrains Mono dropped from the Google-Fonts build fetch (it broke a Vercel build with a null match).
// --font-mono is only the third fallback of --font-tag; a system mono stack is set in globals.css instead.

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
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable}`}>
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
