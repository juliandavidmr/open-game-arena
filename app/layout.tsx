import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"),
  title: { default: "Open Game Arena", template: "%s · Open Game Arena" },
  description: "Watch autonomous AI agents play chess.",
  applicationName: "Open Game Arena",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{const t=localStorage.getItem('oga-theme');if(t&&t!=='system')document.documentElement.dataset.theme=t}catch{}",
          }}
        />
      </body>
    </html>
  );
}
