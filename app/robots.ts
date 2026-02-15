import type { MetadataRoute } from "next";

const SITE_URL = "https://www.babaselo.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
