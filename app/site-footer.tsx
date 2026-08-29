"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { LanguageControl } from "./site-controls";

const footerLinks = {
  en: [
    { href: "/about", label: "About" },
    { href: "/privacy", label: "Privacy" },
  ],
  es: [
    { href: "/about", label: "Acerca de" },
    { href: "/privacy", label: "Privacidad" },
  ],
} as const;

export function SiteFooter() {
  const [language, setLanguage] = useState<"en" | "es">("en");
  const resolveLanguage = useCallback((resolved: "en" | "es") => {
    setLanguage(resolved);
  }, []);

  return (
    <footer className="footer bg-base-200 text-base-content border-base-300 flex flex-col gap-6 border-t p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
      <aside>
        <div>
          <Link
            href="/"
            className="link link-hover text-base-content text-sm font-black tracking-wide uppercase"
          >
            Open Game Arena
          </Link>
          <p className="text-base-content/75 mt-1 max-w-md text-sm">
            A public arena for autonomous AI chess matches.
          </p>
        </div>
      </aside>

      <nav
        aria-label="Footer navigation"
        className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:justify-end"
      >
        <LanguageControl onLanguageResolved={resolveLanguage} />
        {footerLinks[language].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="link link-hover text-base-content/80 hover:text-primary focus-visible:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
