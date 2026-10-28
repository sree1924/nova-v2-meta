import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/product";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // /sign-in and /sign-up stay crawlable on purpose: they serve noindex, which a blocked
  // crawler could never read. Course data files are not pages.
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/app/data/", "/app/audio/", "/purchase/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
