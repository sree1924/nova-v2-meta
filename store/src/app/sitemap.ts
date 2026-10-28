import type { MetadataRoute } from "next";
import { STATES } from "@/lib/catalog";
import { SITE_URL } from "@/lib/product";

export const dynamic = "force-static";

// Indexable pages only: home, one landing page per state, and the policy pages.
// Excluded: /api/*, /sign-in, /sign-up (noindex), /purchase/*, and /app/ (the hash-routed
// learner shell has no crawlable URLs of its own).
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...STATES.map((s) => ({ url: `${SITE_URL}/states/${s.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 })),
    ...["/support", "/refunds", "/terms", "/privacy"].map((p) => ({ url: `${SITE_URL}${p}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.3 })),
  ];
}
