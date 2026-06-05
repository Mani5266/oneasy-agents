import type { MetadataRoute } from "next";

const SITE_URL = "https://www.getnetworthcertificate.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup"],
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/networth",
          "/networth/",
          "/partnership",
          "/partnership/",
          "/llp",
          "/llp/",
          "/llp-form",
          "/llp-form/",
          "/offer-letter",
          "/offer-letter/",
          "/salary",
          "/salary/",
          "/reset-password",
          "/verify-email",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
