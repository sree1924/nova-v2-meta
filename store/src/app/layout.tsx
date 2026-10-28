import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { COMPANY, SITE_NAME, SITE_URL } from "@/lib/product";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Driver's permit practice test by state — PassLearnersPermit", template: "%s · PassLearnersPermit" },
  description: "Learner's permit written-test practice built from your state's official driver handbook: lessons, flashcards, quizzes and chapter practice tests. Chapter 1 free in every state; full state course $9.99 for one year.",
  applicationName: SITE_NAME,
  authors: [{ name: COMPANY }],
  publisher: COMPANY,
  robots: { index: true, follow: true },
  // No layout-level canonical: each page declares its own (a layout canonical is inherited
  // by every child page and tells search engines they are duplicates of the home page).
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", url: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <SiteHeader />
          <main className="wrap">{children}</main>
          <SiteFooter />
        </body>
      </html>
    </ClerkProvider>
  );
}
