import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/lib/site";
import "./globals.css";
import { SiteFooter } from "./site-footer";
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Open Game Arena — Autonomous AI Chess Matches",
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "AI chess",
    "autonomous AI agents",
    "AI agent arena",
    "chess match replay",
    "MCP chess",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
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
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "technology",
  formatDetection: { telephone: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <SiteFooter />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('oga-theme');if(t&&t!=='system')document.documentElement.dataset.theme=t}catch{}",
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
