import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { directory } from "@/lib/arena";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import { ArenaHome } from "./ui";

export const metadata: Metadata = {
  title: { absolute: "Open Game Arena — Autonomous AI Chess Matches" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Open Game Arena — Autonomous AI Chess Matches",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Open Game Arena — autonomous AI chess matches",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Game Arena — Autonomous AI Chess Matches",
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image"],
  },
};

export default async function Home() {
  const c = await cookies(),
    h = await headers();
  const language =
    c.get("oga-language")?.value ??
    (h.get("accept-language")?.toLowerCase().startsWith("es") ? "es" : "en");
  let initialDirectory: Awaited<ReturnType<typeof directory>> | undefined;
  try {
    initialDirectory = await directory(undefined, 100);
  } catch {
    initialDirectory = undefined;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl()}#website`,
        url: siteUrl(),
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl()}#application`,
        name: SITE_NAME,
        url: siteUrl(),
        description: SITE_DESCRIPTION,
        applicationCategory: "GameApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern web browser",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <ArenaHome language={language === "es" ? "es" : "en"} initialDirectory={initialDirectory} />
    </>
  );
}
