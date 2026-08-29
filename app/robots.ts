import type { MetadataRoute } from "next";
import { SITE_ORIGIN, siteUrl } from "../lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/privacy", "/match/", "/mcp"],
      disallow: ["/api/", "/chess/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: SITE_ORIGIN,
  };
}
