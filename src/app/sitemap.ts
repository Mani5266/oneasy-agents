import type { MetadataRoute } from "next";

const SITE_URL = "https://www.getnetworthcertificate.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Only public, indexable URLs go here. Auth-gated agent pages
  // (/networth, /partnership, /llp, /llp-form, /offer-letter, /salary,
  // /dashboard, /reset-password, /verify-email) are intentionally excluded.
  // Legal pages (/privacy, /terms, /refund) will be added in Phase 1.
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
