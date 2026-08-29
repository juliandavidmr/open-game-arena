import type { MetadataRoute } from "next";
import { directory } from "@/lib/arena";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const all: any[] = [];
  let cursor: string | undefined;
  try {
    do {
      const page = await directory(cursor, 100);
      all.push(...page.matches);
      cursor = page.next_cursor ?? undefined;
    } while (cursor);
  } catch {}

  return [
    { url: siteUrl(), changeFrequency: "daily", priority: 1 },
    { url: siteUrl("/about"), changeFrequency: "monthly", priority: 0.7 },
    { url: siteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    ...all.map((m) => ({
      url: siteUrl(`/match/${m.public_slug}`),
      lastModified: new Date(m.completed_at),
      changeFrequency: "never" as const,
      priority: 0.7,
    })),
  ];
}
